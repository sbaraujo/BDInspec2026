/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Audit Trail & Security Logs View
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Database,
  Trash2,
} from 'lucide-react';
import { DatabaseEngine } from '../../core/database/engine.ts';

interface AuditLogViewProps {
  engine: DatabaseEngine;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ engine }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const logs = engine.getAuditLog();

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.tableName.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.user.toLowerCase().includes(term) ||
      String(l.recordId || '').toLowerCase().includes(term)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-mono">INSERT</span>;
      case 'UPDATE':
        return <span className="bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded text-[10px] font-mono">UPDATE</span>;
      case 'DELETE':
        return <span className="bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded text-[10px] font-mono">DELETE</span>;
      default:
        return <span className="bg-slate-900 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">{action}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-hidden text-slate-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-[#0d131f] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Trilha de Auditoria & Governança de Dados
            </h2>
            <p className="text-xs text-slate-400">
              Registro imutável de todas as inserções, modificações e exclusões no motor relacional.
            </p>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar eventos por tabela ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Data / Hora</th>
                <th className="py-2.5 px-4 font-semibold">Usuário</th>
                <th className="py-2.5 px-4 font-semibold">Ação</th>
                <th className="py-2.5 px-4 font-semibold">Tabela</th>
                <th className="py-2.5 px-4 font-semibold">Registro ID</th>
                <th className="py-2.5 px-4 font-semibold">Campo / Modificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Nenhum registro de auditoria no momento.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-4 text-slate-400">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-4 text-slate-300 font-semibold">{log.user}</td>
                    <td className="py-2 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-2 px-4 text-cyan-300">{log.tableName}</td>
                    <td className="py-2 px-4 text-slate-400 truncate max-w-[120px]">
                      {log.recordId}
                    </td>
                    <td className="py-2 px-4 text-slate-300">
                      {log.action === 'UPDATE' && log.fieldName ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold">{log.fieldName}:</span>
                          <span className="text-rose-400 line-through truncate max-w-[100px]">
                            {String(log.oldValue ?? 'null')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-emerald-400 truncate max-w-[100px]">
                            {String(log.newValue ?? 'null')}
                          </span>
                        </div>
                      ) : log.action === 'INSERT' ? (
                        <span className="text-emerald-400">Novo registro gravado</span>
                      ) : (
                        <span className="text-rose-400">Registro removido do banco</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
