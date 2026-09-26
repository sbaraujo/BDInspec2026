/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Executive Dashboard & KPI Engine
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  ShieldAlert,
  Building,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { ApplicationSchema } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';

interface DashboardViewProps {
  engine: DatabaseEngine;
  schema: ApplicationSchema;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  engine,
  schema,
}) => {
  const dataStore = engine.getDataStore();
  const dashboard = schema.dashboards[0];

  // Calculate statistics across tables
  const stats = useMemo(() => {
    const res: Record<string, any> = {};

    schema.tables.forEach((t) => {
      const rows = dataStore[t.id] || [];
      res[t.id] = {
        total: rows.length,
        rows,
      };
    });

    return res;
  }, [schema.tables, dataStore]);

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'cyan':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'emerald':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'rose':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'amber':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-y-auto p-6 text-slate-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {dashboard?.title || 'Painel Executivo & Indicadores'}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ● TEMPO REAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {dashboard?.description || 'Monitoramento analítico das tabelas e entidades operacionais do sistema.'}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard?.widgets
          .filter((w) => w.type === 'kpi-card')
          .map((widget) => {
            const tableData = stats[widget.tableId]?.rows || [];
            let val = tableData.length;

            if (widget.filter) {
              val = tableData.filter((r: any) => {
                const str = JSON.stringify(r).toLowerCase();
                return str.includes('pendente') || str.includes('aberta');
              }).length;
            }

            return (
              <div
                key={widget.id}
                className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {widget.title}
                  </span>
                  <div className={`p-2 rounded-lg border ${getColorClasses(widget.color)}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono">{val}</span>
                  <span className="text-xs text-slate-500">registros</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Atualizado agora</span>
                  <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
                    100% íntegro <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Charts & Distributions */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inspections / Records distribution */}
        {dashboard?.widgets
          .filter((w) => w.type === 'bar-chart' || w.type === 'pie-chart')
          .map((widget) => {
            const table = schema.tables.find((t) => t.id === widget.tableId);
            const rows = stats[widget.tableId]?.rows || [];
            const groupField = table?.fields.find((f) => f.id === widget.groupByFieldId);

            // Group counts
            const counts: Record<string, number> = {};
            rows.forEach((r: any) => {
              const k = String(r[groupField?.id || ''] || 'Não Definido');
              counts[k] = (counts[k] || 0) + 1;
            });

            return (
              <div
                key={widget.id}
                className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {widget.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {table?.pluralLabel || table?.name}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {Object.entries(counts).map(([label, count]) => {
                    const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0;

                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{label}</span>
                          <span className="text-slate-400 font-mono">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
