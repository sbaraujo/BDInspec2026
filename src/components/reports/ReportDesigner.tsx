/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Report Designer & PDF Publisher
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Plus,
  Settings,
  CheckCircle,
  FileCheck,
  Printer,
} from 'lucide-react';
import { ApplicationSchema, ReportSchema } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';
import { exportReportToPDF } from '../../core/reports/pdf-generator.ts';

interface ReportDesignerProps {
  engine: DatabaseEngine;
  schema: ApplicationSchema;
  onUpdateSchema: (updatedSchema: ApplicationSchema) => void;
}

export const ReportDesigner: React.FC<ReportDesignerProps> = ({
  engine,
  schema,
  onUpdateSchema,
}) => {
  const [selectedReportId, setSelectedReportId] = useState(schema.reports[0]?.id || '');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const activeReport = schema.reports.find((r) => r.id === selectedReportId) || schema.reports[0];
  const targetTable = schema.tables.find((t) => t.id === activeReport?.tableId);
  const tableRows = targetTable ? engine.getDataStore()[targetTable.id] || [] : [];

  const handleExportPDF = () => {
    if (!activeReport || !targetTable) return;
    exportReportToPDF(activeReport, targetTable, tableRows);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleToggleSignature = () => {
    if (!activeReport) return;
    const updatedReports = schema.reports.map((r) =>
      r.id === activeReport.id ? { ...r, includeSignatureBlock: !r.includeSignatureBlock } : r
    );
    onUpdateSchema({ ...schema, reports: updatedReports });
  };

  if (!activeReport) {
    return (
      <div className="flex-1 p-8 text-center text-slate-400">
        Nenhum modelo de relatório configurado nesta aplicação.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-y-auto p-6 text-slate-200">
      {/* Top action header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Construtor de Relatórios & Publicação de PDF
            </h2>
            <p className="text-xs text-slate-400">
              Gere laudos técnicos, extratos gerenciais e relatórios com assinatura digital e cabeçalhos normativos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {downloadSuccess && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> PDF gerado com sucesso!
            </span>
          )}

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-all shadow-md shadow-blue-900/40 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Laudo Oficial em PDF</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Report Selector & Settings */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Modelos de Relatórios
          </h3>

          <div className="space-y-1">
            {schema.reports.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  rep.id === activeReport.id
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">{rep.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300">Configuração de Impressão</h4>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={activeReport.includeSignatureBlock ?? true}
                onChange={handleToggleSignature}
                className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
              />
              <span>Incluir Campo de Assinatura</span>
            </label>

            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400 space-y-1">
              <div>Tabela Fonte: <span className="text-white font-mono">{targetTable?.pluralLabel || targetTable?.name}</span></div>
              <div>Colunas: <span className="text-white font-mono">{activeReport.columns.length}</span></div>
              <div>Total de Registros: <span className="text-white font-mono">{tableRows.length}</span></div>
            </div>
          </div>
        </div>

        {/* Right 3 Cols: Printable Document Preview */}
        <div className="lg:col-span-3 bg-[#070b12] border border-slate-800 rounded-xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-sm shadow-xl p-10 font-sans space-y-6 min-h-[600px]">
            {/* Header Document Banner */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-widest text-slate-500 font-bold uppercase font-mono">
                  SYGMA DATABASE STUDIO AI · LAUDO TÉCNICO
                </span>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  {activeReport.title}
                </h1>
                {activeReport.subtitle && (
                  <p className="text-xs text-slate-600 mt-0.5">{activeReport.subtitle}</p>
                )}
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono">
                <div>DATA: {new Date().toLocaleDateString('pt-BR')}</div>
                <div>AUTOR: {schema.application.author}</div>
              </div>
            </div>

            {/* Document Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    {activeReport.columns.map((col) => (
                      <th key={col.fieldId} className="p-2 border-r border-slate-300 last:border-none">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeReport.columns.length} className="p-4 text-center text-slate-400">
                        Nenhum registro para exibir.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                        {activeReport.columns.map((col) => (
                          <td
                            key={col.fieldId}
                            className="p-2 border-r border-slate-300 last:border-none font-mono text-[11px]"
                          >
                            {String(row[col.fieldId] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Block */}
            {activeReport.includeSignatureBlock && (
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
                <div>
                  <div className="border-t border-slate-400 pt-2 font-medium">
                    Responsável Técnico / Engenheiro
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">CREA / Registro Profissional</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 font-medium">
                    Contratante / Administrador
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Ciente e De Acordo</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
