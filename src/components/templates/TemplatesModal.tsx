/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Templates & Models Library
 */

import React from 'react';
import {
  BookOpen,
  X,
  Flame,
  Wrench,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ALL_TEMPLATES, TemplateDefinition } from '../../core/schema/templates.ts';
import { ApplicationSchema, TableDataStore } from '../../core/schema/types.ts';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (schema: ApplicationSchema, data: TableDataStore) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#131b2c] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Biblioteca de Modelos Especializados</h3>
              <p className="text-xs text-slate-400">
                Aplicações relacionais completas e pré-configuradas para produção.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {ALL_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-5 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-start justify-between gap-4 transition-all group"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 group-hover:text-cyan-300">
                  {tmpl.id.includes('fire') ? (
                    <Flame className="w-6 h-6 text-rose-400" />
                  ) : (
                    <Wrench className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                    {tmpl.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{tmpl.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {tmpl.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-[11px] font-mono text-slate-500">
                    <span>{tmpl.schema.tables.length} Tabelas</span>
                    <span>·</span>
                    <span>{tmpl.schema.relationships.length} Relacionamentos FK</span>
                    <span>·</span>
                    <span>{tmpl.schema.reports.length} Laudos PDF</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectTemplate(tmpl.schema, tmpl.initialData);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
              >
                <span>Carregar Modelo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
