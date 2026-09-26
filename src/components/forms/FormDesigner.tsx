/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Form & Layout Designer (Master-Detail & Portal Engine)
 */

import React, { useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Table as TableIcon,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ApplicationSchema, TableSchema, LayoutSchema, LayoutComponent } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';

interface FormDesignerProps {
  engine: DatabaseEngine;
  schema: ApplicationSchema;
  onRefresh: () => void;
}

export const FormDesigner: React.FC<FormDesignerProps> = ({
  engine,
  schema,
  onRefresh,
}) => {
  // Find a table with 1:N children (like Edificações) or first table
  const defaultTable =
    schema.tables.find((t) => schema.relationships.some((r) => r.sourceTableId === t.id)) ||
    schema.tables[0];

  const [selectedTableId, setSelectedTableId] = useState(defaultTable?.id || '');
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [mode, setMode] = useState<'run' | 'design'>('run');
  const [isAddPortalChildOpen, setIsAddPortalChildOpen] = useState<string | null>(null);
  const [newChildData, setNewChildData] = useState<Record<string, any>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentTable = schema.tables.find((t) => t.id === selectedTableId) || defaultTable;
  const tableRows = engine.getDataStore()[currentTable?.id || ''] || [];
  const activeRecord = tableRows[selectedRecordIndex] || {};
  const activeRecordId = activeRecord ? activeRecord[currentTable?.primaryKeyFieldId || ''] : null;

  // Find relationships where this table is parent
  const childRels = schema.relationships.filter((r) => r.sourceTableId === currentTable?.id);

  const handleNextRecord = () => {
    if (selectedRecordIndex < tableRows.length - 1) {
      setSelectedRecordIndex((i) => i + 1);
    }
  };

  const handlePrevRecord = () => {
    if (selectedRecordIndex > 0) {
      setSelectedRecordIndex((i) => i - 1);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    if (!activeRecordId) return;
    const res = engine.update(currentTable.id, activeRecordId, { [fieldId]: value }, 'Usuário');
    if (res.success) {
      setStatusMessage('Registro salvo automaticamente.');
      setTimeout(() => setStatusMessage(null), 2000);
      onRefresh();
    }
  };

  const handleAddChildRecord = (rel: typeof childRels[0]) => {
    const childTable = schema.tables.find((t) => t.id === rel.targetTableId);
    if (!childTable || !activeRecordId) return;

    const dataToInsert = {
      ...newChildData,
      [rel.targetFieldId]: activeRecordId, // Bind FK
    };

    const res = engine.insert(childTable.id, dataToInsert, 'Usuário');
    if (res.success) {
      setIsAddPortalChildOpen(null);
      setNewChildData({});
      setStatusMessage(`Novo registro adicionado no portal: ${childTable.singularLabel || childTable.name}`);
      setTimeout(() => setStatusMessage(null), 2500);
      onRefresh();
    } else {
      alert(`Erro: ${res.error}`);
    }
  };

  if (!currentTable) {
    return <div className="p-8 text-slate-400">Nenhuma tabela cadastrada.</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-y-auto text-slate-200">
      {/* Form Top Control Bar */}
      <div className="h-14 bg-[#0d131f] border-b border-slate-800 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase font-mono">Tabela Mestre:</span>
            <select
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                setSelectedRecordIndex(0);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:border-cyan-500"
            >
              {schema.tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.singularLabel || t.name} ({t.name})
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-[1px] bg-slate-800" />

          {/* Record Navigator */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={handlePrevRecord}
              disabled={selectedRecordIndex === 0}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Registro anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">
              Registro {tableRows.length > 0 ? selectedRecordIndex + 1 : 0} de {tableRows.length}
            </span>
            <button
              onClick={handleNextRecord}
              disabled={selectedRecordIndex >= tableRows.length - 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Próximo registro"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {statusMessage && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {statusMessage}
            </span>
          )}
        </div>

        {/* Mode switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setMode('run')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mode === 'run' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Modo Aplicação (Run)
            </button>
            <button
              onClick={() => setMode('design')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mode === 'design' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Designer de Layout
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Form Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-[#141e30] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentTable.singularLabel || currentTable.name}:{' '}
                {activeRecord ? activeRecord[currentTable.fields[1]?.id || ''] || activeRecordId : 'Nenhum registro selecionado'}
              </h3>
              <p className="text-xs text-slate-400">
                Formulário interativo com vinculação de integridade referencial.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
              PK: {String(activeRecordId ?? 'N/A')}
            </span>
          </div>

          {/* Form Fields Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentTable.fields.map((field) => {
              const val = activeRecord ? activeRecord[field.id] : '';
              const isReadOnly = field.primaryKey || field.type === 'formula';

              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>{field.label || field.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{field.type}</span>
                  </label>

                  {field.validation?.options ? (
                    <select
                      value={val ?? ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      disabled={isReadOnly}
                      className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
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
                      type={field.type === 'number' || field.type === 'decimal' ? 'number' : 'text'}
                      value={val ?? ''}
                      onChange={(e) =>
                        handleFieldChange(
                          field.id,
                          field.type === 'number' || field.type === 'decimal'
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                      readOnly={isReadOnly}
                      className={`w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 ${
                        isReadOnly ? 'bg-slate-950 text-slate-400 cursor-not-allowed font-mono' : ''
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Portals Section: Related Child Records (e.g. Inspeções or Vistorias) */}
        {childRels.length > 0 && (
          <div className="space-y-6">
            {childRels.map((rel) => {
              const childTable = schema.tables.find((t) => t.id === rel.targetTableId);
              if (!childTable) return null;

              const relatedRows = engine.getRelatedRecords(rel.id, activeRecordId);

              return (
                <div
                  key={rel.id}
                  className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl overflow-hidden"
                >
                  {/* Portal Header */}
                  <div className="bg-[#131b2c] px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          Portal de Registros Relacionados: {childTable.pluralLabel || childTable.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {relatedRows.length} registro(s) vinculado(s) à chave "{activeRecordId}" ({rel.name})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAddPortalChildOpen(rel.id)}
                      className="px-3 py-1 rounded text-xs font-semibold bg-purple-600/80 hover:bg-purple-600 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar em {childTable.singularLabel || childTable.name}</span>
                    </button>
                  </div>

                  {/* Portal Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
                          {childTable.fields.slice(0, 6).map((f) => (
                            <th key={f.id} className="py-2 px-4 font-medium">
                              {f.label || f.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                        {relatedRows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                              Nenhum registro relacionado para esta entidade.
                            </td>
                          </tr>
                        ) : (
                          relatedRows.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                              {childTable.fields.slice(0, 6).map((f) => (
                                <td key={f.id} className="py-2 px-4 text-slate-300">
                                  {String(r[f.id] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal to add row into Portal */}
                  {isAddPortalChildOpen === rel.id && (
                    <div className="p-4 bg-slate-900/90 border-t border-slate-800 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-white">
                          Novo registro para {childTable.singularLabel || childTable.name}
                        </span>
                        <button
                          onClick={() => setIsAddPortalChildOpen(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {childTable.fields
                          .filter((f) => !f.primaryKey && f.id !== rel.targetFieldId && f.type !== 'formula')
                          .map((f) => (
                            <div key={f.id}>
                              <label className="text-[11px] text-slate-400">{f.label || f.name}</label>
                              {f.validation?.options ? (
                                <select
                                  value={newChildData[f.id] || ''}
                                  onChange={(e) =>
                                    setNewChildData({ ...newChildData, [f.id]: e.target.value })
                                  }
                                  className="w-full h-7 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white"
                                >
                                  <option value="">Selecione...</option>
                                  {f.validation.options.map((o) => (
                                    <option key={o} value={o}>
                                      {o}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                  value={newChildData[f.id] || ''}
                                  onChange={(e) =>
                                    setNewChildData({ ...newChildData, [f.id]: e.target.value })
                                  }
                                  className="w-full h-7 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white"
                                />
                              )}
                            </div>
                          ))}
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleAddChildRecord(rel)}
                          className="px-3 py-1 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
                        >
                          Inserir no Portal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
