/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Main Application Orchestrator
 * AI-Powered Low-Code/No-Code Relational Application Builder
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ApplicationSchema, TableDataStore, TableSchema } from './core/schema/types.ts';
import { fireSafetyTemplate } from './core/schema/templates.ts';
import { DatabaseEngine } from './core/database/engine.ts';

// Layout & Navigation
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { StatusBar } from './components/layout/StatusBar.tsx';
import { CommandPalette } from './components/layout/CommandPalette.tsx';

// Core Feature Views
import { DataExplorer } from './components/database/DataExplorer.tsx';
import { TableDesigner } from './components/database/TableDesigner.tsx';
import { RelationshipGraph } from './components/relationships/RelationshipGraph.tsx';
import { FormDesigner } from './components/forms/FormDesigner.tsx';
import { QueryBuilder } from './components/query/QueryBuilder.tsx';
import { ReportDesigner } from './components/reports/ReportDesigner.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { ScriptEditor } from './components/automations/ScriptEditor.tsx';
import { AuditLogView } from './components/audit/AuditLogView.tsx';
import { CodeInspector } from './components/code/CodeInspector.tsx';

// Modals
import { AiAppBuilderModal } from './components/ai/AiAppBuilderModal.tsx';
import { AskDatabasePanel } from './components/ai/AskDatabasePanel.tsx';
import { ImportExportModal } from './components/import-export/ImportExportModal.tsx';
import { TemplatesModal } from './components/templates/TemplatesModal.tsx';

const STORAGE_KEY_SCHEMA = 'sygma_studio_schema_v1';
const STORAGE_KEY_DATA = 'sygma_studio_data_v1';

export default function App() {
  // Load persisted state or fallback to Fire Safety PPCI flagship template
  const [schema, setSchema] = useState<ApplicationSchema>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEMA);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return fireSafetyTemplate.schema;
  });

  const [initialData] = useState<TableDataStore>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return fireSafetyTemplate.initialData;
  });

  // Relational Database Engine instance
  const engine = useMemo(() => {
    return new DatabaseEngine(schema, initialData);
  }, []);

  // UI state
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    return schema.tables[1]?.id || schema.tables[0]?.id || '';
  });
  const [editingTable, setEditingTable] = useState<TableSchema | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Re-render trigger
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    // Persist data
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(engine.getDataStore()));
      localStorage.setItem(STORAGE_KEY_SCHEMA, JSON.stringify(schema));
    } catch {
      // ignore
    }
  }, [engine, schema]);

  // Sync schema changes to engine and storage
  const handleUpdateSchema = useCallback(
    (newSchema: ApplicationSchema) => {
      setSchema(newSchema);
      engine.setSchema(newSchema);
      try {
        localStorage.setItem(STORAGE_KEY_SCHEMA, JSON.stringify(newSchema));
      } catch {
        // ignore
      }
      triggerRefresh();
    },
    [engine, triggerRefresh]
  );

  // Replace whole application from AI Builder, Template, or .sydb Package
  const handleLoadApplicationPackage = useCallback(
    (newSchema: ApplicationSchema, newData: TableDataStore) => {
      setSchema(newSchema);
      engine.setSchema(newSchema);
      // Replace engine data
      const ds = engine.getDataStore();
      Object.keys(ds).forEach((k) => delete ds[k]);
      Object.assign(ds, newData);

      if (newSchema.tables.length > 0) {
        setSelectedTableId(newSchema.tables[0].id);
      }
      setActiveView('dashboard');
      triggerRefresh();
    },
    [engine, triggerRefresh]
  );

  // Undo
  const handleUndo = useCallback(() => {
    const success = engine.undo();
    if (success) {
      triggerRefresh();
    } else {
      alert('Não há mais ações para desfazer.');
    }
  }, [engine, triggerRefresh]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Add new table handler
  const handleAddNewTable = useCallback(() => {
    const name = prompt('Informe o nome da nova tabela:');
    if (!name || !name.trim()) return;

    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const tableId = `tbl_${safeName}`;

    const newTable: TableSchema = {
      id: tableId,
      name: safeName,
      singularLabel: name.trim(),
      pluralLabel: name.trim() + 's',
      primaryKeyFieldId: `fld_${safeName}_id`,
      fields: [
        {
          id: `fld_${safeName}_id`,
          name: 'id',
          label: 'ID',
          type: 'uuid',
          primaryKey: true,
          isSystem: true,
        },
        {
          id: `fld_${safeName}_nome`,
          name: 'nome',
          label: 'Nome',
          type: 'text',
          validation: { required: true },
        },
      ],
      position: {
        x: 100 + (schema.tables.length % 3) * 350,
        y: 100 + Math.floor(schema.tables.length / 3) * 350,
      },
    };

    const updatedSchema = {
      ...schema,
      tables: [...schema.tables, newTable],
    };

    handleUpdateSchema(updatedSchema);
    setSelectedTableId(tableId);
    setActiveView('data');
  }, [schema, handleUpdateSchema]);

  const selectedTable = schema.tables.find((t) => t.id === selectedTableId) || schema.tables[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0e17] text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        schema={schema}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
        onOpenAskAi={() => setIsAskAiOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onUndo={handleUndo}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          schema={schema}
          dataStore={engine.getDataStore()}
          activeView={activeView}
          selectedTableId={selectedTableId}
          onSelectView={(v) => {
            setEditingTable(null);
            setActiveView(v);
          }}
          onSelectTable={(tId) => {
            setSelectedTableId(tId);
            setEditingTable(null);
          }}
          onAddNewTable={handleAddNewTable}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
        />

        {/* Central Workspace Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'dashboard' && (
            <DashboardView engine={engine} schema={schema} />
          )}

          {activeView === 'data' && selectedTable && !editingTable && (
            <DataExplorer
              engine={engine}
              schema={schema}
              table={selectedTable}
              onOpenTableSettings={(t) => setEditingTable(t)}
              onRefresh={triggerRefresh}
            />
          )}

          {editingTable && (
            <TableDesigner
              schema={schema}
              table={editingTable}
              onBack={() => setEditingTable(null)}
              onUpdateTable={(updated) => {
                const updatedTables = schema.tables.map((t) =>
                  t.id === updated.id ? updated : t
                );
                handleUpdateSchema({ ...schema, tables: updatedTables });
                setEditingTable(updated);
              }}
            />
          )}

          {activeView === 'relationships' && (
            <RelationshipGraph schema={schema} onUpdateSchema={handleUpdateSchema} />
          )}

          {activeView === 'layouts' && (
            <FormDesigner engine={engine} schema={schema} onRefresh={triggerRefresh} />
          )}

          {activeView === 'query' && (
            <QueryBuilder engine={engine} schema={schema} />
          )}

          {activeView === 'reports' && (
            <ReportDesigner
              engine={engine}
              schema={schema}
              onUpdateSchema={handleUpdateSchema}
            />
          )}

          {activeView === 'scripts' && (
            <ScriptEditor
              engine={engine}
              schema={schema}
              onUpdateSchema={handleUpdateSchema}
            />
          )}

          {activeView === 'audit' && <AuditLogView engine={engine} />}

          {activeView === 'code' && <CodeInspector schema={schema} engine={engine} />}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar schema={schema} dataStore={engine.getDataStore()} />

      {/* Floating / Modals */}
      <AiAppBuilderModal
        isOpen={isAiBuilderOpen}
        onClose={() => setIsAiBuilderOpen(false)}
        onApplyApp={handleLoadApplicationPackage}
      />

      <AskDatabasePanel
        isOpen={isAskAiOpen}
        onClose={() => setIsAskAiOpen(false)}
        engine={engine}
        schema={schema}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        schema={schema}
        engine={engine}
        onLoadPackage={handleLoadApplicationPackage}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleLoadApplicationPackage}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        schema={schema}
        onSelectView={setActiveView}
        onSelectTable={setSelectedTableId}
        onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
        onOpenAskAi={() => setIsAskAiOpen(true)}
      />
    </div>
  );
}
