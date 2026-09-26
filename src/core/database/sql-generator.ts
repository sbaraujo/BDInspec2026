/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — SQL Generator Engine
 * Emits robust, standards-compliant SQLite and PostgreSQL DDL/DML
 */

import { ApplicationSchema, FieldSchema, FieldType, TableDataStore } from '../schema/types.ts';

function mapTypeToSQLite(type: FieldType): string {
  switch (type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
    case 'container':
    case 'formula':
    case 'lookup':
      return 'TEXT';
    case 'number':
      return 'INTEGER';
    case 'decimal':
    case 'currency':
    case 'percentage':
      return 'REAL';
    case 'boolean':
      return 'INTEGER'; // 0 or 1
    case 'date':
    case 'time':
    case 'datetime':
      return 'TEXT'; // ISO8601
    case 'uuid':
      return 'TEXT';
    case 'json':
      return 'TEXT';
    default:
      return 'TEXT';
  }
}

function mapTypeToPostgres(type: FieldType): string {
  switch (type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
    case 'container':
    case 'formula':
    case 'lookup':
      return 'VARCHAR(255)';
    case 'number':
      return 'BIGINT';
    case 'decimal':
    case 'currency':
    case 'percentage':
      return 'NUMERIC(14,2)';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'DATE';
    case 'time':
      return 'TIME';
    case 'datetime':
      return 'TIMESTAMPTZ';
    case 'uuid':
      return 'UUID';
    case 'json':
      return 'JSONB';
    default:
      return 'TEXT';
  }
}

export function generateSQLiteDDL(schema: ApplicationSchema): string {
  const statements: string[] = [];

  statements.push(`-- ============================================================`);
  statements.push(`-- SYGMA DATABASE STUDIO AI — SQLite Relational Schema`);
  statements.push(`-- Application: ${schema.application.name} (v${schema.application.version})`);
  statements.push(`-- Generated: ${new Date().toISOString()}`);
  statements.push(`-- ============================================================\n`);
  statements.push(`PRAGMA foreign_keys = ON;\n`);

  schema.tables.forEach((table) => {
    const colDefs: string[] = [];
    const fkDefs: string[] = [];

    table.fields.forEach((field) => {
      let def = `  "${field.name}" ${mapTypeToSQLite(field.type)}`;
      if (field.primaryKey) {
        def += ' PRIMARY KEY';
        if (field.autoIncrement) def += ' AUTOINCREMENT';
      }
      if (field.validation?.required && !field.primaryKey) {
        def += ' NOT NULL';
      }
      if (field.validation?.unique && !field.primaryKey) {
        def += ' UNIQUE';
      }
      if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '') {
        const val = typeof field.defaultValue === 'string' ? `'${field.defaultValue.replace(/'/g, "''")}'` : field.defaultValue;
        def += ` DEFAULT ${val}`;
      }
      colDefs.push(def);
    });

    // Foreign Keys
    const tableRels = schema.relationships.filter((r) => r.targetTableId === table.id);
    tableRels.forEach((rel) => {
      const parentTable = schema.tables.find((t) => t.id === rel.sourceTableId);
      const childField = table.fields.find((f) => f.id === rel.targetFieldId);
      const parentField = parentTable?.fields.find((f) => f.id === rel.sourceFieldId);

      if (parentTable && childField && parentField) {
        fkDefs.push(
          `  CONSTRAINT "fk_${table.name}_${parentTable.name}" FOREIGN KEY ("${childField.name}") REFERENCES "${parentTable.name}" ("${parentField.name}") ON DELETE ${rel.onDelete} ON UPDATE ${rel.onUpdate}`
        );
      }
    });

    const allClauses = [...colDefs, ...fkDefs].join(',\n');
    statements.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (\n${allClauses}\n);\n`);

    // Indexes
    if (table.indexes) {
      table.indexes.forEach((idx) => {
        const fieldNames = idx.fieldIds
          .map((fid) => table.fields.find((f) => f.id === fid)?.name)
          .filter(Boolean)
          .map((n) => `"${n}"`)
          .join(', ');
        const unique = idx.unique ? 'UNIQUE ' : '';
        statements.push(`CREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${table.name}" (${fieldNames});\n`);
      });
    }
  });

  return statements.join('\n');
}

export function generatePostgresDDL(schema: ApplicationSchema): string {
  const statements: string[] = [];

  statements.push(`-- ============================================================`);
  statements.push(`-- SYGMA DATABASE STUDIO AI — PostgreSQL Enterprise Schema`);
  statements.push(`-- Application: ${schema.application.name} (v${schema.application.version})`);
  statements.push(`-- Generated: ${new Date().toISOString()}`);
  statements.push(`-- ============================================================\n`);

  schema.tables.forEach((table) => {
    const colDefs: string[] = [];
    const fkDefs: string[] = [];

    table.fields.forEach((field) => {
      let def = `  "${field.name}" ${mapTypeToPostgres(field.type)}`;
      if (field.primaryKey) {
        def += ' PRIMARY KEY';
      }
      if (field.validation?.required && !field.primaryKey) {
        def += ' NOT NULL';
      }
      if (field.validation?.unique && !field.primaryKey) {
        def += ' UNIQUE';
      }
      colDefs.push(def);
    });

    const tableRels = schema.relationships.filter((r) => r.targetTableId === table.id);
    tableRels.forEach((rel) => {
      const parentTable = schema.tables.find((t) => t.id === rel.sourceTableId);
      const childField = table.fields.find((f) => f.id === rel.targetFieldId);
      const parentField = parentTable?.fields.find((f) => f.id === rel.sourceFieldId);

      if (parentTable && childField && parentField) {
        fkDefs.push(
          `  CONSTRAINT "fk_${table.name}_${parentTable.name}" FOREIGN KEY ("${childField.name}") REFERENCES "${parentTable.name}" ("${parentField.name}") ON DELETE ${rel.onDelete} ON UPDATE ${rel.onUpdate}`
        );
      }
    });

    const allClauses = [...colDefs, ...fkDefs].join(',\n');
    statements.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (\n${allClauses}\n);\n`);
  });

  return statements.join('\n');
}

export function generateInsertSQL(schema: ApplicationSchema, data: TableDataStore): string {
  const statements: string[] = [];

  statements.push(`-- ============================================================`);
  statements.push(`-- DATA EXPORT (INSERT STATEMENTS)`);
  statements.push(`-- ============================================================\n`);

  schema.tables.forEach((table) => {
    const rows = data[table.id] || [];
    if (rows.length === 0) return;

    statements.push(`-- Tabela: ${table.name} (${rows.length} registros)`);
    rows.forEach((row) => {
      const cols: string[] = [];
      const values: string[] = [];

      table.fields.forEach((field) => {
        if (field.type === 'formula') return; // Skip computed columns
        const val = row[field.id];
        cols.push(`"${field.name}"`);

        if (val === null || val === undefined) {
          values.push('NULL');
        } else if (typeof val === 'number') {
          values.push(String(val));
        } else if (typeof val === 'boolean') {
          values.push(val ? '1' : '0');
        } else {
          values.push(`'${String(val).replace(/'/g, "''")}'`);
        }
      });

      statements.push(`INSERT INTO "${table.name}" (${cols.join(', ')}) VALUES (${values.join(', ')});`);
    });
    statements.push('');
  });

  return statements.join('\n');
}
