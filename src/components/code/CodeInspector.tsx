/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Code & DDL Inspector
 */

import React, { useState, useMemo } from 'react';
import {
  Code2,
  Copy,
  Download,
  Check,
  FileJson,
  Database,
} from 'lucide-react';
import { ApplicationSchema } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';
import { generateSQLiteDDL, generatePostgresDDL, generateInsertSQL } from '../../core/database/sql-generator.ts';

interface CodeInspectorProps {
  schema: ApplicationSchema;
  engine: DatabaseEngine;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({
  schema,
  engine,
}) => {
  const [tab, setTab] = useState<'schema' | 'sqlite' | 'postgres' | 'dml'>('sqlite');
  const [copied, setCopied] = useState(false);

  const sqliteCode = useMemo(() => generateSQLiteDDL(schema), [schema]);
  const postgresCode = useMemo(() => generatePostgresDDL(schema), [schema]);
  const jsonCode = useMemo(() => JSON.stringify(schema, null, 2), [schema]);
  const dmlCode = useMemo(() => generateInsertSQL(schema, engine.getDataStore()), [schema, engine.getDataStore()]);

  const activeContent =
    tab === 'schema'
      ? jsonCode
      : tab === 'sqlite'
      ? sqliteCode
      : tab === 'postgres'
      ? postgresCode
      : dmlCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = tab === 'schema' ? 'json' : 'sql';
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.application.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${tab}.${ext}`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-hidden text-slate-200">
      {/* Top Header & Tabs */}
      <div className="h-14 bg-[#0d131f] border-b border-slate-800 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Inspecionar Código Gerado & Definições DDL
            </h2>
            <p className="text-[11px] text-slate-400">
              Transparência total sem vendor lock-in. Exporte seus esquemas em SQL ou JSON Schema.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setTab('sqlite')}
              className={`px-3 py-1 rounded transition-colors ${
                tab === 'sqlite' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              SQLite DDL
            </button>
            <button
              onClick={() => setTab('postgres')}
              className={`px-3 py-1 rounded transition-colors ${
                tab === 'postgres' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              PostgreSQL DDL
            </button>
            <button
              onClick={() => setTab('dml')}
              className={`px-3 py-1 rounded transition-colors ${
                tab === 'dml' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inserts SQL (DML)
            </button>
            <button
              onClick={() => setTab('schema')}
              className={`px-3 py-1 rounded transition-colors ${
                tab === 'schema' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Application Schema (JSON)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Arquivo</span>
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 p-6 overflow-auto">
        <pre className="p-6 bg-[#070b12] border border-slate-800/80 rounded-xl font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto shadow-2xl selection:bg-cyan-800 selection:text-white">
          {activeContent}
        </pre>
      </div>
    </div>
  );
};
