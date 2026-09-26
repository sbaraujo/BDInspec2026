/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Command Palette (Ctrl + K Global Navigation)
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Table as TableIcon,
  GitFork,
  LayoutTemplate,
  FileSpreadsheet,
  LineChart,
  Code2,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { ApplicationSchema } from '../../core/schema/types.ts';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  schema: ApplicationSchema;
  onSelectView: (view: string) => void;
  onSelectTable: (tableId: string) => void;
  onOpenAiBuilder: () => void;
  onOpenAskAi: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  schema,
  onSelectView,
  onSelectTable,
  onOpenAiBuilder,
  onOpenAskAi,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // toggle handled by caller or close
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'act_ai',
      label: 'Gerar Nova Aplicação com IA',
      category: 'Inteligência Artificial',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      run: () => {
        onOpenAiBuilder();
        onClose();
      },
    },
    {
      id: 'act_ask',
      label: 'Perguntar ao Banco (Ask Your Database)',
      category: 'Inteligência Artificial',
      icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
      run: () => {
        onOpenAskAi();
        onClose();
      },
    },
    {
      id: 'act_er',
      label: 'Abrir Diagrama Entidade-Relacionamento (ER)',
      category: 'Modelagem',
      icon: <GitFork className="w-4 h-4 text-purple-400" />,
      run: () => {
        onSelectView('relationships');
        onClose();
      },
    },
    {
      id: 'act_dash',
      label: 'Ver Painel Executivo de Indicadores (KPIs)',
      category: 'Visão Geral',
      icon: <LineChart className="w-4 h-4 text-cyan-400" />,
      run: () => {
        onSelectView('dashboard');
        onClose();
      },
    },
    {
      id: 'act_rep',
      label: 'Gerar Laudos e Relatórios em PDF',
      category: 'Relatórios',
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-400" />,
      run: () => {
        onSelectView('reports');
        onClose();
      },
    },
    {
      id: 'act_code',
      label: 'Inspecionar DDL SQLite & PostgreSQL',
      category: 'Desenvolvimento',
      icon: <Code2 className="w-4 h-4 text-indigo-400" />,
      run: () => {
        onSelectView('code');
        onClose();
      },
    },
    {
      id: 'act_audit',
      label: 'Ver Trilha de Auditoria & Governança',
      category: 'Segurança',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      run: () => {
        onSelectView('audit');
        onClose();
      },
    },
  ];

  // Also include tables
  const tableItems = schema.tables.map((t) => ({
    id: `tbl_${t.id}`,
    label: `Tabela: ${t.pluralLabel || t.name}`,
    category: 'Tabelas do Banco',
    icon: <TableIcon className="w-4 h-4 text-cyan-400" />,
    run: () => {
      onSelectTable(t.id);
      onSelectView('data');
      onClose();
    },
  }));

  const allItems = [...actions, ...tableItems].filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-20 p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="p-3 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Digite para buscar tabelas, relatórios ou ações..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            allItems.map((item) => (
              <button
                key={item.id}
                onClick={item.run}
                className="w-full p-2 rounded-lg flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
