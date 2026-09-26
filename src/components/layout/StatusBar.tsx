/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Bottom Status Bar
 */

import React from 'react';
import { Database, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { ApplicationSchema, TableDataStore } from '../../core/schema/types.ts';

interface StatusBarProps {
  schema: ApplicationSchema;
  dataStore: TableDataStore;
}

export const StatusBar: React.FC<StatusBarProps> = ({ schema, dataStore }) => {
  const totalRecords = Object.values(dataStore).reduce((acc, rows) => acc + rows.length, 0);

  return (
    <footer className="h-6 bg-[#080c14] border-t border-slate-800/80 px-3 flex items-center justify-between text-[10px] font-mono text-slate-400 select-none z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Database className="w-3 h-3" />
          <span>SQLite Engine: ONLINE</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>FK INTEGRITY: STRICT (ON DELETE CASCADE)</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        <span>{schema.tables.length} Tabelas Relacionais</span>
        <span>·</span>
        <span>{schema.relationships.length} Chaves Estrangeiras</span>
        <span>·</span>
        <span>{totalRecords} Registros no Banco</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-slate-500">UTF-8 · JSON AST v1.0</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400 font-semibold">{schema.application.author}</span>
      </div>
    </footer>
  );
};
