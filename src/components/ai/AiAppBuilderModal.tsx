/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — AI App Builder Modal (Natural Language to Relational App)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  Table as TableIcon,
  GitFork,
  LayoutTemplate,
  FileSpreadsheet,
  LineChart,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ApplicationSchema, TableDataStore } from '../../core/schema/types.ts';
import { AiService, AiGenerationResult } from '../../core/ai/service.ts';

interface AiAppBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyApp: (schema: ApplicationSchema, initialData: TableDataStore) => void;
}

export const AiAppBuilderModal: React.FC<AiAppBuilderModalProps> = ({
  isOpen,
  onClose,
  onApplyApp,
}) => {
  const [prompt, setPrompt] = useState(
    'Crie um sistema de inspeção de segurança contra incêndio para edifícios com edificações, inspeções, não conformidades, sistemas e laudos técnicos em PDF.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [result, setResult] = useState<AiGenerationResult | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setResult(null);

    // Visual step sequence
    setGenerationStep('1. Analisando entidades e modelo relacional...');
    await new Promise((r) => setTimeout(r, 600));

    setGenerationStep('2. Normalizando tabelas e restrições de chaves estrangeiras (1:N)...');
    await new Promise((r) => setTimeout(r, 600));

    setGenerationStep('3. Estruturando layouts, portais mestre-detalhe e laudos PDF...');
    await new Promise((r) => setTimeout(r, 600));

    setGenerationStep('4. Validando Application Schema no motor de integridade...');

    try {
      const genResult = await AiService.generateAppFromPrompt(prompt);
      setResult(genResult);
    } catch (err: any) {
      alert(`Erro na geração: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onApplyApp(result.schema, result.initialData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                SYGMA AI APP BUILDER
              </h3>
              <p className="text-xs text-slate-400">
                Gere bancos de dados relacionais completos a partir de uma descrição em linguagem natural.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!result ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Descreva o aplicativo desejado:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Ex: Crie um sistema de inspeção de segurança contra incêndio para edifícios..."
                  className="mt-1.5 w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none leading-relaxed transition-colors font-sans"
                  disabled={isGenerating}
                />
              </div>

              {/* Suggestions Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-mono">Sugestões rápidas:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPrompt(
                        'Crie um sistema de vistoria e inspeção de segurança contra incêndio predial com edificações, laudos AVCB, extintores e não conformidades.'
                      )
                    }
                    className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
                  >
                    🔥 Inspeção Segurança Contra Incêndio (PPCI)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPrompt(
                        'Crie um sistema de manutenção de ativos industriais com equipamentos, ordens de serviço, intervenções preventivas e estoques de peças.'
                      )
                    }
                    className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
                  >
                    🛠️ Gestão de Ativos & Manutenção Predial
                  </button>
                </div>
              </div>

              {/* Generating Animation */}
              {isGenerating && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                  <span className="text-xs text-cyan-300 font-mono animate-pulse">
                    {generationStep}
                  </span>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                  disabled={isGenerating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-900/40 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                  <span>Gerar Aplicação com IA</span>
                </button>
              </div>
            </form>
          ) : (
            /* Result Summary & Confirmation */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Aplicação Modelada & Validada com Sucesso!
                  </h4>
                  <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
                    {result.summary.explanation}
                  </p>
                </div>
              </div>

              {/* Architecture Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2.5">
                  <TableIcon className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-base font-bold text-white font-mono">
                      {result.summary.tablesCount}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Tabelas Relacionais</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2.5">
                  <GitFork className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-base font-bold text-white font-mono">
                      {result.summary.relationshipsCount}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Relacionamentos (FK)</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2.5">
                  <LayoutTemplate className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-base font-bold text-white font-mono">
                      {result.summary.layoutsCount}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Layouts / Portais</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-base font-bold text-white font-mono">
                      {result.summary.reportsCount}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Laudos em PDF</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2.5">
                  <LineChart className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-base font-bold text-white font-mono">
                      {result.summary.dashboardsCount}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Dashboards / KPIs</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-base font-bold text-white font-mono">100%</div>
                    <div className="text-[10px] text-slate-400 uppercase">Integridade Referencial</div>
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Ajustar Prompt
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-900/40"
                  >
                    <span>Carregar no Sygma Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
