/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Main Header & Top Navigation
 */

import React from 'react';
import {
  Database,
  Sparkles,
  MessageSquare,
  Download,
  Upload,
  Undo2,
  Share2,
  Layers,
  Search,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { ApplicationSchema } from '../../core/schema/types.ts';

interface HeaderProps {
  schema: ApplicationSchema;
  activeView: string;
  onSelectView: (view: string) => void;
  onOpenAiBuilder: () => void;
  onOpenAskAi: () => void;
  onOpenImportExport: () => void;
  onUndo: () => void;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schema,
  activeView,
  onSelectView,
  onOpenAiBuilder,
  onOpenAskAi,
  onOpenImportExport,
  onUndo,
  onOpenCommandPalette,
}) => {
  return (
    <header className="h-14 bg-[#0d131f] border-b border-slate-800 flex items-center justify-between px-4 z-30 select-none text-slate-200">
      {/* Brand & App Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-2.5 py-1.5 rounded-md border border-cyan-500/30">
          <Database className="w-5 h-5 text-cyan-400" />
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-wider text-white uppercase font-mono">
              SYGMA STUDIO
            </span>
            <span className="text-[10px] text-cyan-400/80 -mt-0.5 font-mono">DATABASE AI</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-700 mx-1" />

        {/* Current Project Name & Status */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-100 max-w-[240px] truncate">
                {schema.application.name}
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                v{schema.application.version}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Motor Relacional SQLite Ativo · Integridade FK Ativada
            </span>
          </div>
        </div>
      </div>

      {/* Global Quick Search (Ctrl+K) */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommandPalette}
          className="w-full h-8 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 hover:border-cyan-500/50 rounded-lg px-3 flex items-center justify-between text-xs text-slate-400 transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span>Pesquisar tabelas, registros, comandos...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Primary Actions & AI Tools */}
      <div className="flex items-center gap-2">
        {/* Ask your database */}
        <button
          onClick={onOpenAskAi}
          className="h-8 px-3 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition-all hover:text-white"
          title="Consultar banco com IA em linguagem natural"
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>Perguntar ao Banco</span>
        </button>

        {/* AI App Builder button */}
        <button
          onClick={onOpenAiBuilder}
          className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-900/30 active:scale-95"
          title="Gerar aplicação completa ou tabelas com IA"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-spin-slow" />
          <span>IA App Builder</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-700 mx-1" />

        {/* Undo */}
        <button
          onClick={onUndo}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          title="Desfazer alteração no banco"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Import/Export */}
        <button
          onClick={onOpenImportExport}
          className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
          title="Exportar .sydb, SQL ou importar planilha"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Backup / .sydb</span>
        </button>
      </div>
    </header>
  );
};
