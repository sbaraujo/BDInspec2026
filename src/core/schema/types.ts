/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Core Schema Types
 * Unified Application Schema (AST) for Relational Apps
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'time'
  | 'datetime'
  | 'boolean'
  | 'json'
  | 'uuid'
  | 'email'
  | 'phone'
  | 'url'
  | 'container' // Files, photos, signatures
  | 'formula'   // Computed expressions
  | 'lookup';   // Relational referenced field

export type Cardinality = '1:1' | '1:N' | 'N:N';
export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export interface FieldValidation {
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[]; // For select / dropdown
  customExpression?: string;
  errorMessage?: string;
}

export interface FieldSchema {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  defaultValue?: any;
  formulaExpression?: string;
  lookupTableId?: string;
  lookupFieldId?: string;
  description?: string;
  validation?: FieldValidation;
  isSystem?: boolean;
}

export interface TableIndex {
  id: string;
  name: string;
  fieldIds: string[];
  unique: boolean;
}

export interface TableSchema {
  id: string;
  name: string;
  singularLabel: string;
  pluralLabel: string;
  description?: string;
  primaryKeyFieldId: string;
  fields: FieldSchema[];
  indexes?: TableIndex[];
  icon?: string;
  position?: { x: number; y: number }; // For ER Diagram visual positioning
}

export interface RelationshipSchema {
  id: string;
  name: string;
  sourceTableId: string;
  sourceFieldId: string;
  targetTableId: string;
  targetFieldId: string;
  cardinality: Cardinality;
  onDelete: ReferentialAction;
  onUpdate: ReferentialAction;
  description?: string;
}

export type ComponentType =
  | 'text'
  | 'field-input'
  | 'button'
  | 'image'
  | 'table-grid'
  | 'portal' // Related records portal (e.g. Inspections within Building)
  | 'metric-card'
  | 'divider'
  | 'panel'
  | 'signature'
  | 'qr-code';

export interface LayoutComponent {
  id: string;
  type: ComponentType;
  label?: string;
  fieldId?: string; // Linked field if type is field-input
  relatedTableId?: string; // For portal
  relatedRelationshipId?: string;
  portalColumns?: string[]; // Field IDs shown in portal
  content?: string; // Text or markdown content
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  actionScriptId?: string; // Trigger script
  position: { x: number; y: number; w: number; h: number }; // Grid or px
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    bgColor?: string;
    borderColor?: string;
  };
}

export interface LayoutSchema {
  id: string;
  name: string;
  tableId: string;
  type: 'form' | 'detail' | 'list' | 'modal';
  isDefault?: boolean;
  components: LayoutComponent[];
}

export type EventTriggerType =
  | 'OnRecordCreate'
  | 'OnRecordUpdate'
  | 'OnRecordDelete'
  | 'OnFieldChange'
  | 'OnButtonClick'
  | 'OnLayoutLoad'
  | 'OnAppOpen';

export interface ScriptAction {
  id: string;
  type:
    | 'SetField'
    | 'NewRecord'
    | 'DeleteRecord'
    | 'ShowDialog'
    | 'CommitRecord'
    | 'GeneratePDF'
    | 'GoToLayout'
    | 'If'
    | 'RunQuery';
  targetTableId?: string;
  targetFieldId?: string;
  expression?: string;
  message?: string;
  subActions?: ScriptAction[];
}

export interface ScriptSchema {
  id: string;
  name: string;
  description?: string;
  trigger: EventTriggerType;
  tableId?: string;
  fieldId?: string;
  actions: ScriptAction[];
}

export interface ReportColumn {
  fieldId: string;
  header: string;
  width?: string;
  aggregate?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

export interface ReportSchema {
  id: string;
  name: string;
  tableId: string;
  title: string;
  subtitle?: string;
  headerText?: string;
  footerText?: string;
  includeDate?: boolean;
  includePageNumbers?: boolean;
  includeSignatureBlock?: boolean;
  columns: ReportColumn[];
  filterCondition?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  groupByFieldId?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'kpi-card' | 'bar-chart' | 'pie-chart' | 'table-summary' | 'status-pills';
  tableId: string;
  fieldId?: string;
  aggregate?: 'COUNT' | 'SUM' | 'AVG';
  groupByFieldId?: string;
  filter?: string;
  color?: string;
  colSpan?: 1 | 2 | 3 | 4;
}

export interface DashboardSchema {
  id: string;
  name: string;
  title: string;
  description?: string;
  widgets: DashboardWidget[];
}

export interface UserRole {
  id: string;
  name: string;
  permissions: {
    canManageSchema: boolean;
    canExportData: boolean;
    tablePermissions: Record<
      string,
      {
        create: boolean;
        read: boolean;
        update: boolean;
        delete: boolean;
      }
    >;
  };
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  user: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SCHEMA_CHANGE';
  tableName: string;
  recordId?: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
}

export interface ApplicationMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  icon?: string;
}

export interface ApplicationSchema {
  application: ApplicationMetadata;
  tables: TableSchema[];
  relationships: RelationshipSchema[];
  layouts: LayoutSchema[];
  scripts: ScriptSchema[];
  reports: ReportSchema[];
  dashboards: DashboardSchema[];
  roles: UserRole[];
  settings: {
    theme: 'dark' | 'light' | 'technical';
    language: 'pt-BR' | 'en-US' | 'es-ES';
    enforceForeignKeys: boolean;
    autoAudit: boolean;
  };
}

// In-memory or persisted Record store format
export type TableDataStore = Record<string, Record<string, any>[]>;
