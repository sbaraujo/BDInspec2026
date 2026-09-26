/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Backup, .sydb Package, and CSV Import/Export
 */

import React, { useState } from 'react';
import {
  Download,
  Upload,
  FileArchive,
  FileSpreadsheet,
  Database,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ApplicationSchema, TableDataStore } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';
import { generateSQLiteDDL, generateInsertSQL } from '../../core/database/sql-generator.ts';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: ApplicationSchema;
  engine: DatabaseEngine;
  onLoadPackage: (schema: ApplicationSchema, data: TableDataStore) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  schema,
  engine,
  onLoadPackage,
}) => {
  const [tab, setTab] = useState<'export' | 'import' | 'csv'>('export');
  const [csvContent, setCsvContent] = useState('');
  const [csvTableName, setCsvTableName] = useState('');
  const [importedJson, setImportedJson] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export .sydb package
  const handleExportSydb = () => {
    const sydbPackage = {
      manifest: {
        format: 'SYGMA_DATABASE_PACKAGE',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        appName: schema.application.name,
      },
      schema,
      data: engine.getDataStore(),
    };

    const blob = new Blob([JSON.stringify(sydbPackage, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.application.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.sydb`;
    a.click();
    setFeedback('Arquivo .sydb gerado e baixado com sucesso!');
  };

  // Export Full SQL
  const handleExportSQL = () => {
    const ddl = generateSQLiteDDL(schema);
    const dml = generateInsertSQL(schema, engine.getDataStore());
    const fullSql = `${ddl}\n\n${dml}`;

    const blob = new Blob([fullSql], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.application.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_backup.sql`;
    a.click();
    setFeedback('Backup completo SQLite (.sql) baixado!');
  };

  // Import .sydb
  const handleImportSydb = () => {
    try {
      const parsed = JSON.parse(importedJson);
      if (parsed.schema && parsed.data) {
        onLoadPackage(parsed.schema, parsed.data);
        setFeedback('Pacote .sydb restaurado com sucesso!');
        setTimeout(onClose, 1500);
      } else {
        alert('Estrutura de arquivo .sydb inválida. Deve conter schema e data.');
      }
    } catch (e: any) {
      alert(`Erro no formato JSON: ${e.message}`);
    }
  };

  // Import CSV to New Table
  const handleImportCSV = () => {
    if (!csvContent.trim() || !csvTableName.trim()) {
      alert('Informe o nome da tabela e o conteúdo CSV.');
      return;
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      alert('CSV deve conter pelo menos cabeçalho e 1 linha de dados.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        obj[`fld_${h}`] = values[i] ?? '';
      });
      return obj;
    });

    const safeTableName = csvTableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const tableId = `tbl_${safeTableName}`;

    const newTable = {
      id: tableId,
      name: safeTableName,
      singularLabel: csvTableName,
      pluralLabel: csvTableName,
      primaryKeyFieldId: `fld_id`,
      fields: [
        { id: 'fld_id', name: 'id', label: 'ID', type: 'uuid' as const, primaryKey: true },
        ...headers.map((h) => ({
          id: `fld_${h}`,
          name: h,
          label: h,
          type: 'text' as const,
        })),
      ],
    };

    // Add generated PK to rows
    const dataStore = engine.getDataStore();
    dataStore[tableId] = rows.map((r, i) => ({
      ...r,
      fld_id: `id_${Date.now()}_${i}`,
    }));

    const updatedSchema = {
      ...schema,
      tables: [...schema.tables, newTable],
    };

    onLoadPackage(updatedSchema, dataStore);
    setFeedback(`Tabela "${csvTableName}" criada a partir da planilha com ${rows.length} registros!`);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#131b2c] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Central de Backup, .sydb e Importação</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 text-xs">
          <button
            onClick={() => setTab('export')}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              tab === 'export' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Exportar Backup (.sydb / SQL)
          </button>
          <button
            onClick={() => setTab('import')}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              tab === 'import' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Restaurar .sydb
          </button>
          <button
            onClick={() => setTab('csv')}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              tab === 'csv' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Planilha → Aplicativo (CSV)
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="m-4 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {tab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Exporte todo o projeto em formato aberto e portável. O formato <strong>.sydb</strong> preserva tabelas, relacionamentos, dados, layouts, relatórios e automações.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleExportSydb}
                  className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
                >
                  <FileArchive className="w-8 h-8 text-cyan-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold text-white">Pacote Completo .sydb</span>
                  <span className="text-[10px] text-slate-400">Schema + Dados + Layouts</span>
                </button>

                <button
                  onClick={handleExportSQL}
                  className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
                >
                  <Database className="w-8 h-8 text-blue-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold text-white">Script SQL Completo</span>
                  <span className="text-[10px] text-slate-400">DDL + DML SQLite puro</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'import' && (
            <div className="space-y-3">
              <label className="text-xs text-slate-400">Cole o conteúdo JSON do arquivo .sydb:</label>
              <textarea
                rows={6}
                value={importedJson}
                onChange={(e) => setImportedJson(e.target.value)}
                placeholder='{"manifest": {...}, "schema": {...}, "data": {...}}'
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleImportSydb}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restaurar Aplicação</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'csv' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Nome da Nova Tabela:</label>
                <input
                  type="text"
                  placeholder="ex: Clientes_Importados, Equipamentos"
                  value={csvTableName}
                  onChange={(e) => setCsvTableName(e.target.value)}
                  className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Cole os dados CSV (com cabeçalho na primeira linha):</label>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="nome,empresa,cidade,telefone&#10;Torre Alfa,Alfa Adm,São Paulo,(11) 98888-0000"
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImportCSV}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Gerar Tabela & Importar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
