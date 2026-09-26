/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Table & Field Designer
 */

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Key,
  Hash,
  Type,
  Calendar,
  CheckSquare,
  DollarSign,
  Binary,
  Calculator,
  ArrowLeft,
  Save,
  AlertCircle,
} from 'lucide-react';
import { ApplicationSchema, TableSchema, FieldSchema, FieldType } from '../../core/schema/types.ts';

interface TableDesignerProps {
  schema: ApplicationSchema;
  table: TableSchema;
  onBack: () => void;
  onUpdateTable: (updatedTable: TableSchema) => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({
  schema,
  table,
  onBack,
  onUpdateTable,
}) => {
  const [currentTable, setCurrentTable] = useState<TableSchema>(JSON.parse(JSON.stringify(table)));
  const [isNewFieldOpen, setIsNewFieldOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldUnique, setNewFieldUnique] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldFormula, setNewFieldFormula] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const safeName = newFieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const fieldId = `fld_${currentTable.name}_${safeName}`;

    const newField: FieldSchema = {
      id: fieldId,
      name: safeName,
      label: newFieldLabel.trim() || newFieldName.trim(),
      type: newFieldType,
      validation: {
        required: newFieldRequired,
        unique: newFieldUnique,
        options: newFieldOptions.trim() ? newFieldOptions.split(',').map((s) => s.trim()) : undefined,
      },
      formulaExpression: newFieldType === 'formula' ? newFieldFormula : undefined,
    };

    const updated = {
      ...currentTable,
      fields: [...currentTable.fields, newField],
    };

    setCurrentTable(updated);
    setIsNewFieldOpen(false);
    // Reset form
    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldUnique(false);
    setNewFieldOptions('');
    setNewFieldFormula('');
  };

  const handleRemoveField = (fieldId: string) => {
    if (fieldId === currentTable.primaryKeyFieldId) {
      alert('Não é possível remover o campo de chave primária.');
      return;
    }
    const updated = {
      ...currentTable,
      fields: currentTable.fields.filter((f) => f.id !== fieldId),
    };
    setCurrentTable(updated);
  };

  const handleSaveAll = () => {
    onUpdateTable(currentTable);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const getTypeIcon = (type: FieldType) => {
    switch (type) {
      case 'text':
      case 'email':
      case 'phone':
        return <Type className="w-3.5 h-3.5 text-slate-400" />;
      case 'number':
      case 'decimal':
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case 'currency':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'date':
      case 'datetime':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'boolean':
        return <CheckSquare className="w-3.5 h-3.5 text-amber-400" />;
      case 'formula':
        return <Calculator className="w-3.5 h-3.5 text-pink-400" />;
      case 'uuid':
        return <Binary className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d131f] overflow-y-auto p-6 text-slate-200">
      {/* Top action header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Voltar para a grade de dados"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Modelador de Estrutura: {currentTable.pluralLabel || currentTable.name}
            </h2>
            <p className="text-xs text-slate-400">
              Configure metadados, colunas, chaves primárias e tipos de dados do banco de dados relacional.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              ✓ Alterações salvas no Schema!
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Estrutura</span>
          </button>
        </div>
      </div>

      {/* Table Metadata Card */}
      <div className="mt-6 bg-[#090d16] border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Metadados da Tabela
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400">Nome no Banco (Identificador SQL)</label>
            <input
              type="text"
              value={currentTable.name}
              onChange={(e) => setCurrentTable({ ...currentTable, name: e.target.value.toLowerCase() })}
              className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Rótulo Singular (Interface)</label>
            <input
              type="text"
              value={currentTable.singularLabel}
              onChange={(e) => setCurrentTable({ ...currentTable, singularLabel: e.target.value })}
              className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Rótulo Plural (Menu & Listas)</label>
            <input
              type="text"
              value={currentTable.pluralLabel}
              onChange={(e) => setCurrentTable({ ...currentTable, pluralLabel: e.target.value })}
              className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Fields List */}
      <div className="mt-6 bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Campos da Tabela ({currentTable.fields.length})
            </h3>
          </div>
          <button
            onClick={() => setIsNewFieldOpen(true)}
            className="px-3 py-1 rounded text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Campo</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {currentTable.fields.map((field) => {
            const isPk = field.primaryKey || field.id === currentTable.primaryKeyFieldId;

            return (
              <div
                key={field.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-800 border border-slate-700">
                    {getTypeIcon(field.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{field.label || field.name}</span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {field.name}
                      </span>
                      {isPk && (
                        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800 flex items-center gap-1">
                          <Key className="w-2.5 h-2.5" /> Chave Primária
                        </span>
                      )}
                      {field.validation?.required && !isPk && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                          NOT NULL
                        </span>
                      )}
                      {field.validation?.unique && !isPk && (
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/60">
                          UNIQUE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="uppercase text-[10px] font-mono text-cyan-400">{field.type}</span>
                      {field.type === 'formula' && (
                        <span className="text-[11px] text-pink-300 font-mono">
                          Fórmula: {field.formulaExpression}
                        </span>
                      )}
                      {field.validation?.options && (
                        <span className="text-[11px] text-slate-400">
                          Opções: {field.validation.options.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isPk && (
                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Excluir campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Field Modal */}
      {isNewFieldOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Adicionar Novo Campo</h3>

            <form onSubmit={handleAddField} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Nome da Coluna (SQL)</label>
                <input
                  type="text"
                  placeholder="ex: data_validade, valor_total"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Rótulo Visual (Interface)</label>
                <input
                  type="text"
                  placeholder="ex: Data de Validade"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Tipo de Dado Relacional</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                  className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white"
                >
                  <option value="text">Texto (VARCHAR)</option>
                  <option value="number">Número Inteiro (INTEGER)</option>
                  <option value="decimal">Número Decimal (REAL / NUMERIC)</option>
                  <option value="currency">Moeda (R$)</option>
                  <option value="percentage">Percentual (%)</option>
                  <option value="date">Data (DATE)</option>
                  <option value="datetime">Data e Hora (TIMESTAMP)</option>
                  <option value="boolean">Booleano (Sim/Não)</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="uuid">Identificador UUID</option>
                  <option value="formula">Campo Calculado (Fórmula)</option>
                </select>
              </div>

              {newFieldType === 'formula' && (
                <div>
                  <label className="text-xs text-pink-300">Expressão de Cálculo (JavaScript / SQL)</label>
                  <input
                    type="text"
                    placeholder="ex: area * 1.5 ou preco - desconto"
                    value={newFieldFormula}
                    onChange={(e) => setNewFieldFormula(e.target.value)}
                    className="mt-1 w-full h-8 bg-slate-900 border border-pink-700/60 rounded px-2.5 text-xs text-pink-200 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400">Opções Pré-definidas (Separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: Baixo, Médio, Alto, Crítico"
                  value={newFieldOptions}
                  onChange={(e) => setNewFieldOptions(e.target.value)}
                  className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Obrigatório (NOT NULL)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldUnique}
                    onChange={(e) => setNewFieldUnique(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Valor Exclusivo (UNIQUE)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewFieldOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Inserir Campo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
