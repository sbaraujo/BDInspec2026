/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Ask Your Database (Natural Language Data Chat)
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Table as TableIcon,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ApplicationSchema } from '../../core/schema/types.ts';
import { DatabaseEngine } from '../../core/database/engine.ts';
import { AiService } from '../../core/ai/service.ts';

interface AskDatabasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  engine: DatabaseEngine;
  schema: ApplicationSchema;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  matchedRows?: Record<string, any>[];
  tableName?: string;
}

export const AskDatabasePanel: React.FC<AskDatabasePanelProps> = ({
  isOpen,
  onClose,
  engine,
  schema,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Olá! Sou o assistente de inteligência artificial do Sygma Studio. Você pode me fazer qualquer pergunta sobre as tabelas e registros da sua aplicação em português ou inglês.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (qText?: string) => {
    const question = qText || inputQuestion;
    if (!question.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await AiService.queryDatabase(question, schema, engine.getDataStore());
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedRows: res.matchedRows,
        tableName: res.tableName,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'assistant',
        text: `Erro ao consultar o banco de dados: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-50 bg-[#0d131f] border-l border-slate-800 shadow-2xl flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-[#0a0f18] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Ask Your Database
            </h3>
            <p className="text-[10px] text-slate-400">Consultas inteligentes em dados reais</p>
          </div>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested prompts chips */}
      <div className="p-3 bg-[#0a0f18]/60 border-b border-slate-800 space-y-1.5">
        <span className="text-[10px] text-slate-500 uppercase font-mono">Sugestões:</span>
        <div className="flex flex-col gap-1 text-[11px]">
          <button
            onClick={() => handleSend('Quais inspeções foram reprovadas?')}
            className="text-left text-cyan-300 hover:underline truncate"
          >
            • "Quais inspeções foram reprovadas?"
          </button>
          <button
            onClick={() => handleSend('Existem não conformidades pendentes críticas?')}
            className="text-left text-cyan-300 hover:underline truncate"
          >
            • "Não conformidades pendentes?"
          </button>
          <button
            onClick={() => handleSend('Quantas edificações estão cadastradas?')}
            className="text-left text-cyan-300 hover:underline truncate"
          >
            • "Quantas edificações cadastradas?"
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Matched rows mini table if any */}
              {msg.matchedRows && msg.matchedRows.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-700/80 font-mono text-[10px]">
                  <div className="text-cyan-400 font-semibold mb-1">
                    Registros identificados ({msg.matchedRows.length}):
                  </div>
                  <div className="max-h-36 overflow-auto space-y-1">
                    {msg.matchedRows.map((r, i) => (
                      <div key={i} className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
                        {Object.entries(r).slice(0, 3).map(([k, v]) => (
                          <div key={k} className="truncate text-slate-400">
                            <span className="text-slate-200">{k}:</span> {String(v)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Consultando dados e restrições relacionais...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-[#0a0f18]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Faça uma pergunta sobre seus dados..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            className="flex-1 h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || loading}
            className="h-9 w-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
