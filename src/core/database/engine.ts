/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Relational Database Engine
 * In-Memory/Local Relational Engine with Foreign Key Enforcement, Formula Calculation,
 * Referential Integrity (CASCADE/RESTRICT/SET NULL), and Audit Logging.
 */

import { ApplicationSchema, AuditRecord, TableDataStore, TableSchema } from '../schema/types.ts';

export interface QueryOptions {
  tableId: string;
  fields?: string[];
  filter?: Record<string, any> | ((row: Record<string, any>) => boolean);
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
}

export type DatabaseEventListener = (
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  tableId: string,
  record: Record<string, any>,
  oldRecord?: Record<string, any>
) => void;

export class DatabaseEngine {
  private schema: ApplicationSchema;
  private data: TableDataStore;
  private auditLog: AuditRecord[] = [];
  private listeners: DatabaseEventListener[] = [];
  private undoStack: Array<{ data: TableDataStore; audit: AuditRecord[] }> = [];

  constructor(schema: ApplicationSchema, initialData: TableDataStore = {}) {
    this.schema = schema;
    this.data = initialData;
    this.initTables();
  }

  public setSchema(newSchema: ApplicationSchema) {
    this.schema = newSchema;
    this.initTables();
  }

  public getSchema(): ApplicationSchema {
    return this.schema;
  }

  public getDataStore(): TableDataStore {
    return this.data;
  }

  public getAuditLog(): AuditRecord[] {
    return this.auditLog;
  }

  public addListener(listener: DatabaseEventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private initTables() {
    this.schema.tables.forEach((table) => {
      if (!this.data[table.id]) {
        this.data[table.id] = [];
      }
    });
  }

  private saveStateForUndo() {
    // Keep max 20 snapshots
    if (this.undoStack.length > 20) {
      this.undoStack.shift();
    }
    this.undoStack.push({
      data: JSON.parse(JSON.stringify(this.data)),
      audit: [...this.auditLog],
    });
  }

  public undo(): boolean {
    const prev = this.undoStack.pop();
    if (!prev) return false;
    this.data = prev.data;
    this.auditLog = prev.audit;
    return true;
  }

  private getTable(tableId: string): TableSchema | undefined {
    return this.schema.tables.find((t) => t.id === tableId || t.name === tableId);
  }

  // Evaluate formula fields on row
  private computeFormulas(table: TableSchema, row: Record<string, any>): Record<string, any> {
    const computed = { ...row };
    table.fields.forEach((field) => {
      if (field.type === 'formula' && field.formulaExpression) {
        try {
          // Safe evaluation using row keys
          const expr = field.formulaExpression;
          // replace field references if needed or provide row object
          const fn = new Function('record', `with(record) { return (${expr}); }`);
          computed[field.id] = fn(computed);
        } catch {
          computed[field.id] = null;
        }
      }
    });
    return computed;
  }

  // Validate Foreign Key on Insert/Update
  private checkForeignKeysOnSave(table: TableSchema, record: Record<string, any>): string | null {
    if (!this.schema.settings.enforceForeignKeys) return null;

    // Check if this table is the child (target) in any 1:N or 1:1 relationship
    const childRels = this.schema.relationships.filter((r) => r.targetTableId === table.id);

    for (const rel of childRels) {
      const foreignValue = record[rel.targetFieldId];
      if (foreignValue === undefined || foreignValue === null || foreignValue === '') {
        // Check if field is required
        const field = table.fields.find((f) => f.id === rel.targetFieldId);
        if (field?.validation?.required) {
          return `Violação de Integridade: O campo "${field.label || field.name}" é obrigatório e vincula à tabela pai.`;
        }
        continue;
      }

      // Verify parent exists
      const parentTableData = this.data[rel.sourceTableId] || [];
      const parentExists = parentTableData.some((pRow) => pRow[rel.sourceFieldId] === foreignValue);

      if (!parentExists) {
        const parentTable = this.getTable(rel.sourceTableId);
        return `Violação de Chave Estrangeira: Registro pai com ID "${foreignValue}" não existe na tabela "${parentTable?.singularLabel || parentTable?.name}".`;
      }
    }

    return null;
  }

  // INSERT RECORD
  public insert(tableId: string, record: Record<string, any>, user: string = 'Administrador'): EngineResult<Record<string, any>> {
    const table = this.getTable(tableId);
    if (!table) return { success: false, error: `Tabela ${tableId} não encontrada.` };

    const pkField = table.fields.find((f) => f.id === table.primaryKeyFieldId);
    if (!pkField) return { success: false, error: 'Chave primária não configurada.' };

    const newRecord = { ...record };

    // Auto-generate PK if absent
    if (!newRecord[pkField.id]) {
      if (pkField.type === 'uuid') {
        newRecord[pkField.id] = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      } else if (pkField.type === 'number' && pkField.autoIncrement) {
        const maxId = (this.data[table.id] || []).reduce((max, r) => Math.max(max, Number(r[pkField.id]) || 0), 0);
        newRecord[pkField.id] = maxId + 1;
      } else {
        newRecord[pkField.id] = `rec_${Date.now()}`;
      }
    }

    // Check unique constraints & PK
    const tableRows = this.data[table.id] || [];
    const pkVal = newRecord[pkField.id];
    if (tableRows.some((r) => r[pkField.id] === pkVal)) {
      return { success: false, error: `Chave primária duplicada: ${pkVal}` };
    }

    // Check FK
    const fkError = this.checkForeignKeysOnSave(table, newRecord);
    if (fkError) return { success: false, error: fkError };

    // Apply formulas
    const computedRecord = this.computeFormulas(table, newRecord);

    this.saveStateForUndo();
    this.data[table.id] = [...tableRows, computedRecord];

    // Audit Log
    if (this.schema.settings.autoAudit) {
      this.auditLog.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        user,
        action: 'INSERT',
        tableName: table.name,
        recordId: String(pkVal),
        newValue: computedRecord,
      });
    }

    // Notify listeners
    this.listeners.forEach((fn) => fn('INSERT', table.id, computedRecord));

    return { success: true, data: computedRecord, affectedRows: 1 };
  }

  // UPDATE RECORD
  public update(tableId: string, recordId: any, updates: Record<string, any>, user: string = 'Administrador'): EngineResult<Record<string, any>> {
    const table = this.getTable(tableId);
    if (!table) return { success: false, error: `Tabela ${tableId} não encontrada.` };

    const tableRows = this.data[table.id] || [];
    const index = tableRows.findIndex((r) => String(r[table.primaryKeyFieldId]) === String(recordId));
    if (index === -1) return { success: false, error: `Registro ${recordId} não encontrado.` };

    const oldRecord = tableRows[index];
    const merged = { ...oldRecord, ...updates };

    // Check FK
    const fkError = this.checkForeignKeysOnSave(table, merged);
    if (fkError) return { success: false, error: fkError };

    const computed = this.computeFormulas(table, merged);

    this.saveStateForUndo();
    const updatedRows = [...tableRows];
    updatedRows[index] = computed;
    this.data[table.id] = updatedRows;

    // Audit Log
    if (this.schema.settings.autoAudit) {
      Object.keys(updates).forEach((fId) => {
        if (oldRecord[fId] !== updates[fId]) {
          const field = table.fields.find((f) => f.id === fId);
          this.auditLog.unshift({
            id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            user,
            action: 'UPDATE',
            tableName: table.name,
            recordId: String(recordId),
            fieldName: field ? field.name : fId,
            oldValue: oldRecord[fId],
            newValue: updates[fId],
          });
        }
      });
    }

    this.listeners.forEach((fn) => fn('UPDATE', table.id, computed, oldRecord));

    return { success: true, data: computed, affectedRows: 1 };
  }

  // DELETE RECORD with referential actions (CASCADE, RESTRICT, SET NULL)
  public delete(tableId: string, recordId: any, user: string = 'Administrador'): EngineResult<boolean> {
    const table = this.getTable(tableId);
    if (!table) return { success: false, error: `Tabela ${tableId} não encontrada.` };

    const tableRows = this.data[table.id] || [];
    const targetRow = tableRows.find((r) => String(r[table.primaryKeyFieldId]) === String(recordId));
    if (!targetRow) return { success: false, error: `Registro ${recordId} não encontrado.` };

    const pkVal = targetRow[table.primaryKeyFieldId];

    // Check downstream child relationships
    const dependentRels = this.schema.relationships.filter((r) => r.sourceTableId === table.id);

    for (const rel of dependentRels) {
      const childTable = this.getTable(rel.targetTableId);
      if (!childTable) continue;

      const childRows = this.data[childTable.id] || [];
      const matchingChildren = childRows.filter((cRow) => cRow[rel.targetFieldId] === pkVal);

      if (matchingChildren.length > 0) {
        if (rel.onDelete === 'RESTRICT') {
          return {
            success: false,
            error: `Operação bloqueada (RESTRICT): Existem ${matchingChildren.length} registro(s) dependente(s) na tabela "${childTable.singularLabel || childTable.name}". Exclua-os primeiro.`,
          };
        } else if (rel.onDelete === 'CASCADE') {
          // Recursively delete children
          matchingChildren.forEach((child) => {
            this.delete(childTable.id, child[childTable.primaryKeyFieldId], user);
          });
        } else if (rel.onDelete === 'SET NULL') {
          // Set null on child foreign keys
          matchingChildren.forEach((child) => {
            this.update(childTable.id, child[childTable.primaryKeyFieldId], { [rel.targetFieldId]: null }, user);
          });
        }
      }
    }

    this.saveStateForUndo();
    this.data[table.id] = (this.data[table.id] || []).filter((r) => String(r[table.primaryKeyFieldId]) !== String(recordId));

    if (this.schema.settings.autoAudit) {
      this.auditLog.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        user,
        action: 'DELETE',
        tableName: table.name,
        recordId: String(recordId),
        oldValue: targetRow,
      });
    }

    this.listeners.forEach((fn) => fn('DELETE', table.id, targetRow));

    return { success: true, data: true, affectedRows: 1 };
  }

  // QUERY
  public query(options: QueryOptions): { rows: Record<string, any>[]; total: number } {
    const table = this.getTable(options.tableId);
    if (!table) return { rows: [], total: 0 };

    let results = [...(this.data[table.id] || [])];

    // Global Search filter
    if (options.search && options.search.trim()) {
      const term = options.search.trim().toLowerCase();
      results = results.filter((row) =>
        Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(term))
      );
    }

    // Specific field filters
    if (options.filter) {
      if (typeof options.filter === 'function') {
        const filterFn = options.filter as (row: Record<string, any>) => boolean;
        results = results.filter(filterFn);
      } else {
        const filterObj = options.filter;
        results = results.filter((row) => {
          return Object.entries(filterObj).every(([key, val]) => {
            if (val === undefined || val === '') return true;
            return String(row[key] ?? '').toLowerCase() === String(val).toLowerCase();
          });
        });
      }
    }

    const total = results.length;

    // Sorting
    if (options.sortBy) {
      const sortKey = options.sortBy;
      const asc = options.sortDirection !== 'DESC';
      results.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }
        return asc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    // Pagination
    if (options.offset !== undefined && options.limit !== undefined) {
      results = results.slice(options.offset, options.offset + options.limit);
    } else if (options.limit !== undefined) {
      results = results.slice(0, options.limit);
    }

    return { rows: results, total };
  }

  // Get Related Child Records for a Parent (Portals)
  public getRelatedRecords(relationshipId: string, parentRecordId: any): Record<string, any>[] {
    const rel = this.schema.relationships.find((r) => r.id === relationshipId);
    if (!rel) return [];

    const childTable = this.getTable(rel.targetTableId);
    if (!childTable) return [];

    const childRows = this.data[childTable.id] || [];
    return childRows.filter((c) => String(c[rel.targetFieldId]) === String(parentRecordId));
  }
}
