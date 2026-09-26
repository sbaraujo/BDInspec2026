/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Left Explorer & Navigation Sidebar
 */

import React from 'react';
import {
  Table2,
  GitFork,
  LayoutTemplate,
  SearchCode,
  LineChart,
  FileSpreadsheet,
  Zap,
  ShieldAlert,
  Code2,
  FolderKanban,
  Plus,
  BookOpen,
} from 'lucide-react';
import { ApplicationSchema, TableDataStore } from '../../core/schema/types.ts';

interface SidebarProps {
  schema: ApplicationSchema;
  dataStore: TableDataStore;
  activeView: string;
  selectedTableId: string;
  onSelectView: (view: string) => void;
  onSelectTable: (tableId: string) => void;
  onAddNewTable: () => void;
  onOpenTemplates: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  schema,
  dataStore,
  activeView,
  selectedTableId,
  onSelectView,
  onSelectTable,
  onAddNewTable,
  onOpenTemplates,
}) => {
  return (
    <aside className="w-64 bg-[#0a0f18] border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] select-none text-slate-300">
      {/* Primary Navigation Views */}
      <div className="p-3 border-b border-slate-800/80 space-y-1">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeView === 'dashboard'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LineChart className="w-4 h-4 text-cyan-400" />
            <span>Painel Executivo / KPIs</span>
          </div>
        </button>

        <button
          onClick={() => onSelectView('relationships')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeView === 'relationships'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <GitFork className="w-4 h-4 text-purple-400" />
            <span>Diagrama ER Relacional</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {schema.relationships.length} FKs
          </span>
        </button>

        <button
          onClick={() => onSelectView('layouts')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeView === 'layouts'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="w-4 h-4 text-emerald-400" />
            <span>Formulários & Portais</span>
          </div>
        </button>

        <button
          onClick={() => onSelectView('query')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeView === 'query'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <SearchCode className="w-4 h-4 text-amber-400" />
            <span>Construtor SQL & Consultas</span>
          </div>
        </button>

        <button
          onClick={() => onSelectView('reports')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeView === 'reports'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>Relatórios & PDF</span>
          </div>
        </button>
      </div>

      {/* Relational Tables Explorer */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Tabelas do Banco ({schema.tables.length})
          </span>
          <button
            onClick={onAddNewTable}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Criar nova tabela"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {schema.tables.map((table) => {
            const rowCount = (dataStore[table.id] || []).length;
            const isSelected = activeView === 'data' && selectedTableId === table.id;

            return (
              <button
                key={table.id}
                onClick={() => {
                  onSelectTable(table.id);
                  onSelectView('data');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all group ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Table2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  />
                  <span className="truncate">{table.pluralLabel || table.name}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                  {rowCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Auxiliary Tools */}
      <div className="p-3 border-t border-slate-800 space-y-1 bg-[#080c14]">
        <button
          onClick={() => onSelectView('scripts')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
            activeView === 'scripts'
              ? 'bg-cyan-500/15 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Scripts & Automação</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">{schema.scripts.length}</span>
        </button>

        <button
          onClick={() => onSelectView('audit')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
            activeView === 'audit'
              ? 'bg-cyan-500/15 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Trilha de Auditoria</span>
          </div>
        </button>

        <button
          onClick={() => onSelectView('code')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
            activeView === 'code'
              ? 'bg-cyan-500/15 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Inspecionar Código & DDL</span>
          </div>
        </button>

        <button
          onClick={onOpenTemplates}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-400" />
          <span>Modelos & Templates</span>
        </button>
      </div>
    </aside>
  );
};
