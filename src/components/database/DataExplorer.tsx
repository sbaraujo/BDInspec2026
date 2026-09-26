/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Data Explorer (High-Density CRUD Grid)
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Settings,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Table as TableIcon,
} from 'lucide-react';
import { ApplicationSchema, TableSchema, FieldSchema } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';

interface DataExplorerProps {
  engine: DatabaseEngine;
  schema: ApplicationSchema;
  table: TableSchema;
  onOpenTableSettings: (table: TableSchema) => void;
  onOpenRecordDetail?: (table: TableSchema, record: Record<string, any>) => void;
  onRefresh: () => void;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({
  engine,
  schema,
  table,
  onOpenTableSettings,
  onOpenRecordDetail,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<Record<string, any>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch current rows
  const queryResult = useMemo(() => {
    return engine.query({
      tableId: table.id,
      search: searchTerm,
      sortBy: sortField || undefined,
      sortDirection: sortAsc ? 'ASC' : 'DESC',
    });
  }, [engine, table.id, searchTerm, sortField, sortAsc, engine.getDataStore()]);

  const rows = queryResult.rows;

  const handleSort = (fieldId: string) => {
    if (sortField === fieldId) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(fieldId);
      setSortAsc(true);
    }
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = engine.insert(table.id, newRowData, 'Usuário');
    if (!res.success) {
      setErrorMessage(res.error || 'Erro ao inserir registro.');
      return;
    }
    setNewRowData({});
    setIsAddModalOpen(false);
    onRefresh();
  };

  const handleStartEdit = (row: Record<string, any>) => {
    const pk = row[table.primaryKeyFieldId];
    setEditingRowId(String(pk));
    setEditRowData({ ...row });
    setErrorMessage(null);
  };

  const handleSaveEdit = (recordId: any) => {
    setErrorMessage(null);
    const res = engine.update(table.id, recordId, editRowData, 'Usuário');
    if (!res.success) {
      setErrorMessage(res.error || 'Erro ao salvar alterações.');
      return;
    }
    setEditingRowId(null);
    onRefresh();
  };

  const handleDelete = (recordId: any) => {
    if (!confirm('Deseja realmente excluir este registro? Esta operação verificará integridade referencial.')) {
      return;
    }
    setErrorMessage(null);
    const res = engine.delete(table.id, recordId, 'Usuário');
    if (!res.success) {
      setErrorMessage(res.error || 'Erro ao excluir.');
      return;
    }
    onRefresh();
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const headers = table.fields.map((f) => `"${f.name}"`).join(',');
    const csvRows = rows.map((r) =>
      table.fields
        .map((f) => {
          const val = r[f.id];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const blob = new Blob([[headers, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}_export.csv`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d131f] overflow-hidden text-slate-200">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-[#0a0f18] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                {table.pluralLabel || table.name}
              </h2>
              <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                {table.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {table.description || `${rows.length} registros persistidos no motor relacional`}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar dados na tabela..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            onClick={() => onOpenTableSettings(table)}
            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Configurar campos e regras da tabela"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Estrutura</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Exportar registros como CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => {
              setNewRowData({});
              setIsAddModalOpen(true);
            }}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Error message alert */}
      {errorMessage && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid Container */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg border border-slate-800 bg-[#090d16] overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0f172a] border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 w-12 text-center font-mono">#</th>
                {table.fields.map((field) => (
                  <th
                    key={field.id}
                    onClick={() => handleSort(field.id)}
                    className="py-2.5 px-3 font-medium hover:text-slate-200 cursor-pointer select-none transition-colors border-r border-slate-800/60"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold">{field.label || field.name}</span>
                        {field.primaryKey && (
                          <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1 py-0.2 rounded border border-cyan-800">
                            PK
                          </span>
                        )}
                        {field.type === 'formula' && (
                          <span className="text-[9px] font-mono bg-amber-950 text-amber-400 px-1 py-0.2 rounded border border-amber-800">
                            FX
                          </span>
                        )}
                      </div>
                      <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400" />
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-3 w-24 text-center font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={table.fields.length + 2} className="py-12 text-center text-slate-500">
                    Nenhum registro encontrado nesta tabela. Clique em "+ Novo Registro" para cadastrar.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const pkVal = row[table.primaryKeyFieldId];
                  const isEditing = editingRowId === String(pkVal);

                  return (
                    <tr
                      key={String(pkVal || index)}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isEditing ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {table.fields.map((field) => {
                        const cellValue = isEditing ? editRowData[field.id] : row[field.id];

                        return (
                          <td
                            key={field.id}
                            className="py-2 px-3 border-r border-slate-800/60 text-slate-300 font-mono text-[11px]"
                          >
                            {isEditing && !field.primaryKey && field.type !== 'formula' ? (
                              <input
                                type={field.type === 'number' || field.type === 'decimal' ? 'number' : 'text'}
                                value={cellValue ?? ''}
                                onChange={(e) =>
                                  setEditRowData({
                                    ...editRowData,
                                    [field.id]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-cyan-500/80 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                              />
                            ) : (
                              <span className="truncate block max-w-xs">
                                {cellValue === null || cellValue === undefined ? (
                                  <span className="text-slate-600 italic">null</span>
                                ) : field.type === 'currency' ? (
                                  `R$ ${Number(cellValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                ) : (
                                  String(cellValue)
                                )}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Action buttons */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(pkVal)}
                                className="p-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40"
                                title="Salvar"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingRowId(null)}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(row)}
                                className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                                title="Editar linha"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(pkVal)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="Excluir linha"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Novo Registro em: {table.singularLabel || table.name}
                </h3>
                <p className="text-xs text-slate-400">Preencha os campos conforme as regras de validação e FK.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {table.fields.map((field) => {
                  if (field.type === 'formula') return null;

                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                        <span>{field.label || field.name}</span>
                        {field.validation?.required && (
                          <span className="text-[10px] text-amber-400 font-mono">*obrigatório</span>
                        )}
                      </label>

                      {field.validation?.options && field.validation.options.length > 0 ? (
                        <select
                          value={newRowData[field.id] || ''}
                          onChange={(e) => setNewRowData({ ...newRowData, [field.id]: e.target.value })}
                          className="w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Selecione...</option>
                          {field.validation.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            field.type === 'number' || field.type === 'decimal' || field.type === 'currency'
                              ? 'number'
                              : field.type === 'date'
                              ? 'date'
                              : field.type === 'email'
                              ? 'email'
                              : 'text'
                          }
                          placeholder={field.description || `Digite ${field.label || field.name}`}
                          value={newRowData[field.id] ?? ''}
                          onChange={(e) =>
                            setNewRowData({
                              ...newRowData,
                              [field.id]:
                                field.type === 'number' || field.type === 'decimal' || field.type === 'currency'
                                  ? Number(e.target.value)
                                  : e.target.value,
                            })
                          }
                          className="w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Gravar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
