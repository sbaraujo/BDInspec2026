/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Schema Validation Engine
 * Strict integrity checker for Tables, Fields, FKs, Layouts & Scripts
 */

import { ApplicationSchema, TableSchema, RelationshipSchema } from './types.ts';

export interface ValidationIssue {
  type: 'error' | 'warning';
  entity: 'table' | 'field' | 'relationship' | 'layout' | 'script' | 'report';
  entityId: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateApplicationSchema(schema: ApplicationSchema): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. Table validations
  const tableNames = new Set<string>();
  const tableIds = new Set<string>();

  schema.tables.forEach((table) => {
    // Check ID
    if (!table.id) {
      errors.push({
        type: 'error',
        entity: 'table',
        entityId: 'unknown',
        message: 'Tabela sem identificador único (ID).',
      });
    } else {
      tableIds.add(table.id);
    }

    // Check unique Name
    const lowerName = table.name?.trim().toLowerCase();
    if (!lowerName) {
      errors.push({
        type: 'error',
        entity: 'table',
        entityId: table.id,
        message: 'A tabela deve possuir um nome válido.',
      });
    } else if (tableNames.has(lowerName)) {
      errors.push({
        type: 'error',
        entity: 'table',
        entityId: table.id,
        message: `Nome de tabela duplicado: "${table.name}".`,
        suggestion: `Renomeie para "${table.name}_1" ou especifique um nome exclusivo.`,
      });
    } else {
      tableNames.add(lowerName);
    }

    // Check Fields
    if (!table.fields || table.fields.length === 0) {
      errors.push({
        type: 'error',
        entity: 'table',
        entityId: table.id,
        message: `A tabela "${table.name}" não possui campos definidos.`,
        suggestion: 'Adicione pelo menos uma chave primária (ID) e um campo descritivo.',
      });
      return;
    }

    const fieldNames = new Set<string>();
    const fieldIds = new Set<string>();
    let hasPk = false;

    table.fields.forEach((field) => {
      fieldIds.add(field.id);
      const fName = field.name?.trim().toLowerCase();
      if (!fName) {
        errors.push({
          type: 'error',
          entity: 'field',
          entityId: field.id,
          message: `Campo sem nome na tabela "${table.name}".`,
        });
      } else if (fieldNames.has(fName)) {
        errors.push({
          type: 'error',
          entity: 'field',
          entityId: field.id,
          message: `Campo duplicado "${field.name}" na tabela "${table.name}".`,
        });
      } else {
        fieldNames.add(fName);
      }

      if (field.primaryKey || field.id === table.primaryKeyFieldId) {
        hasPk = true;
      }

      // Check formula fields
      if (field.type === 'formula' && !field.formulaExpression) {
        warnings.push({
          type: 'warning',
          entity: 'field',
          entityId: field.id,
          message: `Campo calculado "${field.name}" sem expressão definida.`,
          suggestion: 'Defina a fórmula matemática ou condicional.',
        });
      }
    });

    if (!hasPk) {
      errors.push({
        type: 'error',
        entity: 'table',
        entityId: table.id,
        message: `Tabela "${table.name}" não possui chave primária definida.`,
        suggestion: 'Marque um campo como Primary Key (UUID ou Auto-increment).',
      });
    }
  });

  // 2. Relationship validations (Referential Integrity)
  schema.relationships.forEach((rel) => {
    const srcTable = schema.tables.find((t) => t.id === rel.sourceTableId);
    const tgtTable = schema.tables.find((t) => t.id === rel.targetTableId);

    if (!srcTable) {
      errors.push({
        type: 'error',
        entity: 'relationship',
        entityId: rel.id,
        message: `Relacionamento "${rel.name}": Tabela de origem não encontrada.`,
      });
    }

    if (!tgtTable) {
      errors.push({
        type: 'error',
        entity: 'relationship',
        entityId: rel.id,
        message: `Relacionamento "${rel.name}": Tabela de destino não encontrada.`,
      });
    }

    if (srcTable && tgtTable) {
      const srcField = srcTable.fields.find((f) => f.id === rel.sourceFieldId);
      const tgtField = tgtTable.fields.find((f) => f.id === rel.targetFieldId);

      if (!srcField) {
        errors.push({
          type: 'error',
          entity: 'relationship',
          entityId: rel.id,
          message: `Relacionamento "${rel.name}": Campo de origem não existe na tabela "${srcTable.name}".`,
        });
      }

      if (!tgtField) {
        errors.push({
          type: 'error',
          entity: 'relationship',
          entityId: rel.id,
          message: `Relacionamento "${rel.name}": Campo de destino não existe na tabela "${tgtTable.name}".`,
        });
      }

      // Type compatibility check
      if (srcField && tgtField && srcField.type !== tgtField.type) {
        // Allow text and uuid interchange, otherwise warn
        const isCompatible =
          (srcField.type === 'uuid' && tgtField.type === 'text') ||
          (srcField.type === 'text' && tgtField.type === 'uuid') ||
          (srcField.type === 'number' && tgtField.type === 'number');

        if (!isCompatible) {
          warnings.push({
            type: 'warning',
            entity: 'relationship',
            entityId: rel.id,
            message: `Tipos divergentes no relacionamento "${rel.name}": ${srcField.name} (${srcField.type}) vs ${tgtField.name} (${tgtField.type}).`,
            suggestion: 'Garanta que as chaves estrangeiras usem o mesmo tipo de dado.',
          });
        }
      }
    }
  });

  // 3. Layout checks
  schema.layouts.forEach((layout) => {
    const table = schema.tables.find((t) => t.id === layout.tableId);
    if (!table) {
      errors.push({
        type: 'error',
        entity: 'layout',
        entityId: layout.id,
        message: `Layout "${layout.name}" aponta para uma tabela inexistente.`,
      });
    }
  });

  // 4. Report checks
  schema.reports.forEach((rep) => {
    const table = schema.tables.find((t) => t.id === rep.tableId);
    if (!table) {
      errors.push({
        type: 'error',
        entity: 'report',
        entityId: rep.id,
        message: `Relatório "${rep.name}" aponta para tabela inexistente.`,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
