/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Script & Automation Editor
 */

import React, { useState } from 'react';
import {
  Zap,
  Play,
  Terminal,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Code,
} from 'lucide-react';
import { ApplicationSchema, ScriptSchema } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';
import { ScriptEngine, ScriptExecutionResult } from '../../core/scripts/interpreter.ts';

interface ScriptEditorProps {
  engine: DatabaseEngine;
  schema: ApplicationSchema;
  onUpdateSchema: (updatedSchema: ApplicationSchema) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  engine,
  schema,
  onUpdateSchema,
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState(schema.scripts[0]?.id || '');
  const [executionResult, setExecutionResult] = useState<ScriptExecutionResult | null>(null);

  const activeScript = schema.scripts.find((s) => s.id === selectedScriptId) || schema.scripts[0];

  const handleTestScript = () => {
    if (!activeScript) return;

    const interpreter = new ScriptEngine(engine);
    // Grab sample record from table
    const tableRows = activeScript.tableId ? engine.getDataStore()[activeScript.tableId] || [] : [];
    const sampleRecord = tableRows[0] || {};

    const result = interpreter.executeScript(activeScript, {
      tableId: activeScript.tableId,
      record: { ...sampleRecord, status_parecer: 'Reprovado' }, // test condition
      user: 'Engenheiro Teste',
      triggerEvent: activeScript.trigger,
    });

    setExecutionResult(result);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-y-auto p-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Motor de Scripts & Automações Orientadas a Eventos
            </h2>
            <p className="text-xs text-slate-400">
              Configure regras de negócio, gatilhos de validação e alertas automáticos executados no banco de dados.
            </p>
          </div>
        </div>

        {activeScript && (
          <button
            onClick={handleTestScript}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 transition-all shadow-md shadow-amber-900/40 active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Testar Script Agora</span>
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scripts List */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Scripts Cadastrados ({schema.scripts.length})
          </h3>

          <div className="space-y-1">
            {schema.scripts.map((scr) => (
              <button
                key={scr.id}
                onClick={() => {
                  setSelectedScriptId(scr.id);
                  setExecutionResult(null);
                }}
                className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  scr.id === activeScript?.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{scr.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    Gatilho: {scr.trigger}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Script Details & Execution Output */}
        <div className="lg:col-span-2 space-y-6">
          {activeScript && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeScript.name}</h3>
                  <p className="text-xs text-slate-400">{activeScript.description}</p>
                </div>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
                  {activeScript.trigger}
                </span>
              </div>

              {/* Action Pipeline */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase font-mono">
                  Sequência de Ações:
                </span>
                <div className="space-y-2">
                  {activeScript.actions.map((act, i) => (
                    <div
                      key={act.id || i}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1 font-mono"
                    >
                      <div className="flex items-center gap-2 text-cyan-400 font-bold">
                        <span>Ação {i + 1}: {act.type}()</span>
                      </div>
                      {act.expression && (
                        <div className="text-slate-300">
                          Condição: <span className="text-pink-300">{act.expression}</span>
                        </div>
                      )}
                      {act.subActions?.map((sub, si) => (
                        <div key={si} className="pl-4 text-emerald-400">
                          ↳ {sub.type}("{sub.message}")
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Execution Terminal Console */}
          <div className="bg-[#070b12] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#101726] px-4 py-2 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-semibold">Console de Execução de Scripts</span>
              </div>
              {executionResult && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Sucesso
                </span>
              )}
            </div>

            <div className="p-4 font-mono text-xs text-slate-300 space-y-1 max-h-56 overflow-y-auto">
              {!executionResult ? (
                <div className="text-slate-600 italic">
                  Clique em "Testar Script Agora" para simular a execução e visualizar os logs de eventos.
                </div>
              ) : (
                <>
                  {executionResult.logs.map((log, i) => (
                    <div key={i} className="text-cyan-300">
                      [LOG {new Date().toLocaleTimeString()}] {log}
                    </div>
                  ))}
                  {executionResult.notifications.map((note, i) => (
                    <div key={i} className="text-yellow-300 bg-yellow-950/40 p-2 rounded border border-yellow-800/60 my-1">
                      🔔 DIALOG ALERT: "{note}"
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
