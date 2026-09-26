/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Visual Query Builder & SQL Console
 */

import React, { useState, useMemo } from 'react';
import {
  Play,
  Terminal,
  Filter,
  ArrowUpDown,
  Table as TableIcon,
  Check,
  Download,
  Code2,
} from 'lucide-react';
import { ApplicationSchema } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';

interface QueryBuilderProps {
  engine: DatabaseEngine;
  schema: ApplicationSchema;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  engine,
  schema,
}) => {
  const [selectedTableId, setSelectedTableId] = useState(schema.tables[0]?.id || '');
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [filterFieldId, setFilterFieldId] = useState('');
  const [filterOperator, setFilterOperator] = useState('=');
  const [filterValue, setFilterValue] = useState('');
  const [sortFieldId, setSortFieldId] = useState('');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [limit, setLimit] = useState(50);

  const [queryResults, setQueryResults] = useState<Record<string, any>[] | null>(null);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);

  const currentTable = schema.tables.find((t) => t.id === selectedTableId) || schema.tables[0];

  // Generate SQL statement in real-time
  const generatedSQL = useMemo(() => {
    if (!currentTable) return '';

    const cols =
      selectedFieldIds.length > 0
        ? selectedFieldIds
            .map((fid) => currentTable.fields.find((f) => f.id === fid)?.name)
            .filter(Boolean)
            .map((n) => `"${n}"`)
            .join(', ')
        : '*';

    let sql = `SELECT ${cols}\nFROM "${currentTable.name}"`;

    if (filterFieldId && filterValue.trim()) {
      const field = currentTable.fields.find((f) => f.id === filterFieldId);
      if (field) {
        const valFormatted =
          field.type === 'number' || field.type === 'decimal'
            ? filterValue
            : filterOperator === 'LIKE'
            ? `'%${filterValue.replace(/'/g, "''")}%'`
            : `'${filterValue.replace(/'/g, "''")}'`;

        sql += `\nWHERE "${field.name}" ${filterOperator} ${valFormatted}`;
      }
    }

    if (sortFieldId) {
      const sortField = currentTable.fields.find((f) => f.id === sortFieldId);
      if (sortField) {
        sql += `\nORDER BY "${sortField.name}" ${sortDirection}`;
      }
    }

    sql += `\nLIMIT ${limit};`;
    return sql;
  }, [currentTable, selectedFieldIds, filterFieldId, filterOperator, filterValue, sortFieldId, sortDirection, limit]);

  const handleExecute = () => {
    const startTime = performance.now();
    const allRows = engine.getDataStore()[currentTable.id] || [];

    let filtered = [...allRows];

    // Filter
    if (filterFieldId && filterValue.trim()) {
      filtered = filtered.filter((r) => {
        const raw = r[filterFieldId];
        if (filterOperator === '=') return String(raw ?? '').toLowerCase() === filterValue.toLowerCase();
        if (filterOperator === '!=') return String(raw ?? '').toLowerCase() !== filterValue.toLowerCase();
        if (filterOperator === '>') return Number(raw) > Number(filterValue);
        if (filterOperator === '<') return Number(raw) < Number(filterValue);
        if (filterOperator === '>=') return Number(raw) >= Number(filterValue);
        if (filterOperator === '<=') return Number(raw) <= Number(filterValue);
        if (filterOperator === 'LIKE') return String(raw ?? '').toLowerCase().includes(filterValue.toLowerCase());
        return true;
      });
    }

    // Sort
    if (sortFieldId) {
      filtered.sort((a, b) => {
        const va = a[sortFieldId];
        const vb = b[sortFieldId];
        if (va === vb) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return sortDirection === 'ASC' ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
      });
    }

    filtered = filtered.slice(0, limit);

    const endTime = performance.now();
    setExecTimeMs(Math.round((endTime - startTime) * 100) / 100);
    setQueryResults(filtered);
  };

  const toggleFieldSelect = (fId: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(fId) ? prev.filter((id) => id !== fId) : [...prev, fId]
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-y-auto p-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Construtor Visual de Consultas & Console SQL
            </h2>
            <p className="text-xs text-slate-400">
              Monte consultas relacionais visualmente ou inspecione o SQL nativo SQLite / ANSI correspondente.
            </p>
          </div>
        </div>

        <button
          onClick={handleExecute}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 transition-all shadow-md shadow-cyan-900/40 active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Executar Consulta SQL</span>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Query Parameters */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Parâmetros da Consulta
          </h3>

          {/* Table select */}
          <div>
            <label className="text-xs text-slate-400">Tabela de Consulta (FROM)</label>
            <select
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                setSelectedFieldIds([]);
                setFilterFieldId('');
                setSortFieldId('');
              }}
              className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white"
            >
              {schema.tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.pluralLabel || t.name} ({t.name})
                </option>
              ))}
            </select>
          </div>

          {/* Columns selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-400">Colunas Selecionadas (SELECT)</label>
              <button
                onClick={() => setSelectedFieldIds([])}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Todas (*)
              </button>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg max-h-36 overflow-y-auto space-y-1">
              {currentTable?.fields.map((f) => {
                const checked = selectedFieldIds.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFieldSelect(f.id)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>{f.label || f.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filter condition (WHERE) */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Filtro Condicional (WHERE)</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={filterFieldId}
                onChange={(e) => setFilterFieldId(e.target.value)}
                className="h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white col-span-1"
              >
                <option value="">Campo...</option>
                {currentTable?.fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white font-mono col-span-1"
              >
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value="LIKE">LIKE</option>
              </select>

              <input
                type="text"
                placeholder="Valor..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white col-span-1"
              />
            </div>
          </div>

          {/* Sort (ORDER BY) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Ordenação (ORDER BY)</label>
              <select
                value={sortFieldId}
                onChange={(e) => setSortFieldId(e.target.value)}
                className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white"
              >
                <option value="">Nenhuma</option>
                {currentTable?.fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Direção</label>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'ASC' | 'DESC')}
                className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white"
              >
                <option value="ASC">ASC (Crescente)</option>
                <option value="DESC">DESC (Decrescente)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Live SQL Editor & Result Grid */}
        <div className="lg:col-span-2 space-y-5">
          {/* SQL Terminal Box */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-[#101726] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  SQL Gerado em Tempo Real (SQLite / PostgreSQL)
                </span>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedSQL)}
                className="text-[11px] font-mono text-cyan-400 hover:underline"
              >
                Copiar SQL
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-cyan-300 bg-[#070b12] overflow-x-auto leading-relaxed">
              {generatedSQL}
            </pre>
          </div>

          {/* Query Results */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-[#141e30] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white font-mono uppercase">
                  Resultado da Execução
                </h4>
                {queryResults && (
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                    {queryResults.length} linha(s) em {execTimeMs}ms
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-auto">
              {!queryResults ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Configure os filtros ao lado e clique em "Executar Consulta SQL".
                </div>
              ) : queryResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Nenhum registro correspondeu aos critérios do filtro.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                      {Object.keys(queryResults[0] || {}).map((col) => (
                        <th key={col} className="py-2 px-3 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-[11px]">
                    {queryResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        {Object.values(row).map((v, i) => (
                          <td key={i} className="py-2 px-3 text-slate-300">
                            {String(v ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
