/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Script & Automation Engine
 * Low-Code Script Interpreter for Events, Automations, and Business Rules
 */

import { DatabaseEngine } from '../database/engine.ts';
import { ScriptAction, ScriptSchema } from '../schema/types.ts';

export interface ScriptExecutionContext {
  tableId?: string;
  record?: Record<string, any>;
  oldRecord?: Record<string, any>;
  user?: string;
  triggerEvent: string;
}

export interface ScriptExecutionResult {
  success: boolean;
  scriptName: string;
  logs: string[];
  notifications: string[];
  error?: string;
}

export class ScriptEngine {
  private engine: DatabaseEngine;

  constructor(engine: DatabaseEngine) {
    this.engine = engine;
  }

  public executeScript(script: ScriptSchema, context: ScriptExecutionContext): ScriptExecutionResult {
    const logs: string[] = [`Iniciando execução do script: "${script.name}" (Gatilho: ${script.trigger})`];
    const notifications: string[] = [];

    try {
      for (const action of script.actions) {
        this.runAction(action, context, logs, notifications);
      }
      logs.push(`Script "${script.name}" concluído com sucesso.`);
      return { success: true, scriptName: script.name, logs, notifications };
    } catch (err: any) {
      logs.push(`Erro fatal na execução: ${err.message || String(err)}`);
      return {
        success: false,
        scriptName: script.name,
        logs,
        notifications,
        error: err.message || String(err),
      };
    }
  }

  private runAction(
    action: ScriptAction,
    context: ScriptExecutionContext,
    logs: string[],
    notifications: string[]
  ) {
    switch (action.type) {
      case 'ShowDialog': {
        const msg = action.message || 'Alerta de automação do sistema.';
        logs.push(`[ShowDialog] Mensagem emitida: "${msg}"`);
        notifications.push(msg);
        break;
      }

      case 'If': {
        const condition = action.expression || 'true';
        let conditionMet = false;
        try {
          const fn = new Function('record', 'oldRecord', `with(record || {}) { return Boolean(${condition}); }`);
          conditionMet = fn(context.record, context.oldRecord);
        } catch (e: any) {
          logs.push(`[If] Erro ao avaliar condição "${condition}": ${e.message}`);
        }

        logs.push(`[If] Condição "${condition}" avaliada como: ${conditionMet}`);
        if (conditionMet && action.subActions) {
          for (const sub of action.subActions) {
            this.runAction(sub, context, logs, notifications);
          }
        }
        break;
      }

      case 'SetField': {
        if (!action.targetTableId || !action.targetFieldId) {
          logs.push('[SetField] Tabela ou campo de destino ausente.');
          return;
        }
        logs.push(`[SetField] Atualizando campo ${action.targetFieldId} com expressão: ${action.expression}`);
        // If current record matches target table
        if (context.record && context.tableId === action.targetTableId) {
          try {
            const fn = new Function('record', `with(record) { return (${action.expression}); }`);
            const val = fn(context.record);
            context.record[action.targetFieldId] = val;
            logs.push(`[SetField] Novo valor atribuído: ${val}`);
          } catch (e: any) {
            logs.push(`[SetField] Erro: ${e.message}`);
          }
        }
        break;
      }

      case 'NewRecord': {
        if (!action.targetTableId) {
          logs.push('[NewRecord] Tabela de destino ausente.');
          return;
        }
        logs.push(`[NewRecord] Criando novo registro na tabela ${action.targetTableId}`);
        const res = this.engine.insert(action.targetTableId, {}, context.user || 'Automação');
        if (res.success) {
          logs.push(`[NewRecord] Registro criado com sucesso ID: ${JSON.stringify(res.data)}`);
        } else {
          logs.push(`[NewRecord] Falha ao criar registro: ${res.error}`);
        }
        break;
      }

      default:
        logs.push(`[Action] Comando não implementado ou neutro: ${action.type}`);
    }
  }
}
