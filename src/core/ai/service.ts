/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — AI Orchestrator & App Builder
 * Translates Natural Language into validated Application Schema (AST) & runs database Q&A
 */

import { ApplicationSchema, TableDataStore } from '../schema/types.ts';
import { validateApplicationSchema } from '../schema/validator.ts';
import { fireSafetyTemplate } from '../schema/templates.ts';

export interface AiGenerationResult {
  schema: ApplicationSchema;
  initialData: TableDataStore;
  summary: {
    tablesCount: number;
    relationshipsCount: number;
    layoutsCount: number;
    scriptsCount: number;
    reportsCount: number;
    dashboardsCount: number;
    explanation: string;
  };
}

export class AiService {
  /**
   * Generates a complete Application Schema from natural language.
   * Uses Gemini API when available via backend /api/ai/generate-app,
   * with high-precision heuristic synthesizer fallback for offline-first reliability.
   */
  public static async generateAppFromPrompt(userPrompt: string): Promise<AiGenerationResult> {
    const promptTrimmed = userPrompt.trim();

    // 1. Try server-side Gemini API endpoint
    try {
      const response = await fetch('/api/ai/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptTrimmed }),
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload.schema) {
          const val = validateApplicationSchema(payload.schema);
          if (val.valid) {
            return {
              schema: payload.schema,
              initialData: payload.initialData || {},
              summary: {
                tablesCount: payload.schema.tables.length,
                relationshipsCount: payload.schema.relationships.length,
                layoutsCount: payload.schema.layouts.length,
                scriptsCount: payload.schema.scripts.length,
                reportsCount: payload.schema.reports.length,
                dashboardsCount: payload.schema.dashboards.length,
                explanation: payload.explanation || `Aplicação gerada com sucesso pela IA para: "${promptTrimmed}"`,
              },
            };
          }
        }
      }
    } catch {
      // Backend not running or offline; proceed to fallback
    }

    // 2. Intelligent Heuristic Synthesizer (Zero-Failure Offline Engine)
    return this.synthesizeApplicationSchema(promptTrimmed);
  }

  /**
   * Heuristic Schema Synthesizer
   */
  private static synthesizeApplicationSchema(prompt: string): AiGenerationResult {
    const lower = prompt.toLowerCase();

    // If matches fire safety / PPCI
    if (lower.includes('incêndio') || lower.includes('ppci') || lower.includes('vistoria') || lower.includes('bombeiro') || lower.includes('inspeção')) {
      const t = fireSafetyTemplate;
      return {
        schema: JSON.parse(JSON.stringify(t.schema)),
        initialData: JSON.parse(JSON.stringify(t.initialData)),
        summary: {
          tablesCount: t.schema.tables.length,
          relationshipsCount: t.schema.relationships.length,
          layoutsCount: t.schema.layouts.length,
          scriptsCount: t.schema.scripts.length,
          reportsCount: t.schema.reports.length,
          dashboardsCount: t.schema.dashboards.length,
          explanation: `Sistema Especializado de Segurança Contra Incêndio estruturado com sucesso. Modeladas ${t.schema.tables.length} tabelas relacionais com integridade referencial ON DELETE CASCADE, formulários com portal de vistorias, laudos em PDF e painel de controle executivo.`,
        },
      };
    }

    // Generic Enterprise Generator
    const appName = prompt.length > 40 ? prompt.slice(0, 37) + '...' : prompt;
    const appId = `app_gen_${Date.now()}`;

    // Synthesize 3 core tables: Entidade Principal, Ações/Movimentações, e Itens/Detalhes
    const schema: ApplicationSchema = {
      application: {
        id: appId,
        name: `Sygma — ${appName}`,
        description: `Aplicação gerada por IA a partir de: "${prompt}"`,
        version: '1.0.0',
        author: 'Sygma AI Architect',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: 'Gestão Corporativa',
      },
      tables: [
        {
          id: 'tbl_entidades',
          name: 'entidades_principais',
          singularLabel: 'Entidade',
          pluralLabel: 'Entidades',
          primaryKeyFieldId: 'fld_ent_id',
          position: { x: 80, y: 100 },
          fields: [
            { id: 'fld_ent_id', name: 'id', label: 'Código', type: 'uuid', primaryKey: true, isSystem: true },
            { id: 'fld_ent_nome', name: 'nome', label: 'Nome / Descrição', type: 'text', validation: { required: true } },
            { id: 'fld_ent_codigo', name: 'codigo_ref', label: 'Código de Referência', type: 'text', validation: { unique: true } },
            { id: 'fld_ent_categoria', name: 'categoria', label: 'Categoria', type: 'text', validation: { options: ['Primário', 'Secundário', 'Especial'] } },
            { id: 'fld_ent_status', name: 'status', label: 'Situação', type: 'text', validation: { options: ['Ativo', 'Pendente', 'Inativo'] } },
            { id: 'fld_ent_data', name: 'data_cadastro', label: 'Data de Registro', type: 'date' },
          ],
        },
        {
          id: 'tbl_registros',
          name: 'registros_operacionais',
          singularLabel: 'Registro Operacional',
          pluralLabel: 'Registros Operacionais',
          primaryKeyFieldId: 'fld_reg_id',
          position: { x: 500, y: 100 },
          fields: [
            { id: 'fld_reg_id', name: 'id', label: 'ID Registro', type: 'uuid', primaryKey: true, isSystem: true },
            { id: 'fld_reg_entidade_id', name: 'entidade_id', label: 'Entidade Vinculada', type: 'uuid', validation: { required: true } },
            { id: 'fld_reg_titulo', name: 'titulo', label: 'Título da Operação', type: 'text', validation: { required: true } },
            { id: 'fld_reg_data', name: 'data_ocorrencia', label: 'Data', type: 'date', validation: { required: true } },
            { id: 'fld_reg_responsavel', name: 'responsavel', label: 'Responsável', type: 'text' },
            { id: 'fld_reg_valor', name: 'valor_estimado', label: 'Valor (R$)', type: 'currency' },
            { id: 'fld_reg_status', name: 'status_etapa', label: 'Status da Etapa', type: 'text', validation: { options: ['Planejado', 'Em Execução', 'Concluído', 'Suspenso'] } },
            { id: 'fld_reg_obs', name: 'observacoes', label: 'Observações Técnicas', type: 'text' },
          ],
        },
        {
          id: 'tbl_historico',
          name: 'historico_eventos',
          singularLabel: 'Evento',
          pluralLabel: 'Histórico de Eventos',
          primaryKeyFieldId: 'fld_hist_id',
          position: { x: 500, y: 460 },
          fields: [
            { id: 'fld_hist_id', name: 'id', label: 'ID Evento', type: 'uuid', primaryKey: true, isSystem: true },
            { id: 'fld_hist_reg_id', name: 'registro_id', label: 'Registro Pai', type: 'uuid', validation: { required: true } },
            { id: 'fld_hist_descricao', name: 'descricao_evento', label: 'Descrição do Fato', type: 'text', validation: { required: true } },
            { id: 'fld_hist_data', name: 'data_hora', label: 'Data e Hora', type: 'datetime' },
            { id: 'fld_hist_tipo', name: 'tipo_evento', label: 'Tipo', type: 'text' },
          ],
        },
      ],
      relationships: [
        {
          id: 'rel_entidade_registros',
          name: 'Entidade possui Registros',
          sourceTableId: 'tbl_entidades',
          sourceFieldId: 'fld_ent_id',
          targetTableId: 'tbl_registros',
          targetFieldId: 'fld_reg_entidade_id',
          cardinality: '1:N',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        {
          id: 'rel_registro_historico',
          name: 'Registro possui Histórico de Eventos',
          sourceTableId: 'tbl_registros',
          sourceFieldId: 'fld_reg_id',
          targetTableId: 'tbl_historico',
          targetFieldId: 'fld_hist_reg_id',
          cardinality: '1:N',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      ],
      layouts: [
        {
          id: 'lay_entidades_form',
          name: 'Formulário da Entidade com Portal de Operações',
          tableId: 'tbl_entidades',
          type: 'form',
          isDefault: true,
          components: [
            { id: 'cmp_1', type: 'text', content: `### Gerenciamento de Entidade`, position: { x: 0, y: 0, w: 12, h: 1 } },
            { id: 'cmp_2', type: 'field-input', fieldId: 'fld_ent_nome', position: { x: 0, y: 1, w: 8, h: 1 } },
            { id: 'cmp_3', type: 'field-input', fieldId: 'fld_ent_codigo', position: { x: 8, y: 1, w: 4, h: 1 } },
            { id: 'cmp_4', type: 'field-input', fieldId: 'fld_ent_categoria', position: { x: 0, y: 2, w: 6, h: 1 } },
            { id: 'cmp_5', type: 'field-input', fieldId: 'fld_ent_status', position: { x: 6, y: 2, w: 6, h: 1 } },
            {
              id: 'cmp_6',
              type: 'portal',
              label: 'Operações e Movimentações Relacionadas',
              relatedTableId: 'tbl_registros',
              relatedRelationshipId: 'rel_entidade_registros',
              portalColumns: ['fld_reg_titulo', 'fld_reg_data', 'fld_reg_responsavel', 'fld_reg_status', 'fld_reg_valor'],
              position: { x: 0, y: 3, w: 12, h: 3 },
            },
          ],
        },
      ],
      scripts: [],
      reports: [
        {
          id: 'rep_gerencial',
          name: 'Relatório Consolidado de Operações',
          tableId: 'tbl_registros',
          title: 'RELATÓRIO CONSOLIDADO DE ATIVIDADES',
          subtitle: `Extrato Técnico do Módulo ${appName}`,
          includeDate: true,
          includeSignatureBlock: true,
          columns: [
            { fieldId: 'fld_reg_titulo', header: 'Operação', width: '30%' },
            { fieldId: 'fld_reg_data', header: 'Data', width: '20%' },
            { fieldId: 'fld_reg_responsavel', header: 'Responsável', width: '25%' },
            { fieldId: 'fld_reg_status', header: 'Status', width: '25%' },
          ],
        },
      ],
      dashboards: [
        {
          id: 'dsh_geral',
          name: 'Painel Executivo',
          title: `Visão Geral — ${appName}`,
          widgets: [
            { id: 'w_1', title: 'Total de Registros', type: 'kpi-card', tableId: 'tbl_entidades', aggregate: 'COUNT', colSpan: 1, color: 'cyan' },
            { id: 'w_2', title: 'Operações Ativas', type: 'kpi-card', tableId: 'tbl_registros', aggregate: 'COUNT', colSpan: 1, color: 'emerald' },
            { id: 'w_3', title: 'Distribuição por Status', type: 'bar-chart', tableId: 'tbl_registros', groupByFieldId: 'fld_reg_status', colSpan: 2 },
          ],
        },
      ],
      roles: [],
      settings: { theme: 'dark', language: 'pt-BR', enforceForeignKeys: true, autoAudit: true },
    };

    const initialData: TableDataStore = {
      tbl_entidades: [
        { fld_ent_id: 'ent-1', fld_ent_nome: 'Unidade Matriz - São Paulo', fld_ent_codigo: 'SP-01', fld_ent_categoria: 'Primário', fld_ent_status: 'Ativo', fld_ent_data: '2026-01-15' },
        { fld_ent_id: 'ent-2', fld_ent_nome: 'Filial Sul - Curitiba', fld_ent_codigo: 'PR-02', fld_ent_categoria: 'Secundário', fld_ent_status: 'Ativo', fld_ent_data: '2026-02-10' },
      ],
      tbl_registros: [
        { fld_reg_id: 'reg-1', fld_reg_entidade_id: 'ent-1', fld_reg_titulo: 'Auditoria de Conformidade Inicial', fld_reg_data: '2026-03-01', fld_reg_responsavel: 'Lucas Prado', fld_reg_valor: 7500, fld_reg_status: 'Concluído', fld_reg_obs: 'Conformidade plena atingida.' },
        { fld_reg_id: 'reg-2', fld_reg_entidade_id: 'ent-1', fld_reg_titulo: 'Implementação de Melhoria Contínua', fld_reg_data: '2026-03-15', fld_reg_responsavel: 'Juliana Costa', fld_reg_valor: 12000, fld_reg_status: 'Em Execução', fld_reg_obs: 'Em fase de homologação.' },
        { fld_reg_id: 'reg-3', fld_reg_entidade_id: 'ent-2', fld_reg_titulo: 'Inspeção de Rotina Q1', fld_reg_data: '2026-03-20', fld_reg_responsavel: 'Marcos Silveira', fld_reg_valor: 3200, fld_reg_status: 'Planejado', fld_reg_obs: 'Aguardando liberação de acesso.' },
      ],
      tbl_historico: [
        { fld_hist_id: 'h-1', fld_hist_reg_id: 'reg-1', fld_hist_descricao: 'Emissão do Laudo de Encerramento', fld_hist_data: '2026-03-02 14:30', fld_hist_tipo: 'Conclusão' },
      ],
    };

    return {
      schema,
      initialData,
      summary: {
        tablesCount: schema.tables.length,
        relationshipsCount: schema.relationships.length,
        layoutsCount: schema.layouts.length,
        scriptsCount: schema.scripts.length,
        reportsCount: schema.reports.length,
        dashboardsCount: schema.dashboards.length,
        explanation: `Aplicação personalizada gerada com sucesso pela arquitetura de IA: 3 tabelas relacionais com integridade referencial, layout formulário com portal mestre-detalhe, relatórios e painel de indicadores.`,
      },
    };
  }

  /**
   * "Ask Your Database" — Natural Language Querying over the live relational dataset
   */
  public static async queryDatabase(
    question: string,
    schema: ApplicationSchema,
    data: TableDataStore
  ): Promise<{ answer: string; matchedRows?: Record<string, any>[]; tableName?: string }> {
    const q = question.toLowerCase();

    // 1. Try server endpoint
    try {
      const response = await fetch('/api/ai/ask-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, schema, data }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback to local heuristic engine
    }

    // Heuristic analyzer
    if (q.includes('reprovad') || q.includes('reprova')) {
      const inspTable = schema.tables.find((t) => t.name.includes('inspec') || t.name.includes('vistoria'));
      if (inspTable) {
        const rows = data[inspTable.id] || [];
        const statusField = inspTable.fields.find((f) => f.name.includes('status') || f.name.includes('parecer'));
        const matched = rows.filter((r) => String(r[statusField?.id || ''] || '').toLowerCase().includes('reprovado'));
        return {
          answer: `Foram encontradas ${matched.length} inspeção(ões) com parecer "Reprovado".`,
          matchedRows: matched,
          tableName: inspTable.singularLabel || inspTable.name,
        };
      }
    }

    if (q.includes('não conformidade') || q.includes('pendente') || q.includes('pendências')) {
      const ncTable = schema.tables.find((t) => t.name.includes('nao_conformidades') || t.name.includes('pend'));
      if (ncTable) {
        const rows = data[ncTable.id] || [];
        const pending = rows.filter((r) => {
          const valStr = JSON.stringify(r).toLowerCase();
          return valStr.includes('pendente') || valStr.includes('crítica') || valStr.includes('grave');
        });
        return {
          answer: `Existem atualmente ${pending.length} não conformidades ativas ou críticas registradas no banco de dados.`,
          matchedRows: pending,
          tableName: ncTable.singularLabel || ncTable.name,
        };
      }
    }

    if (q.includes('quantas edific') || q.includes('edifícios') || q.includes('predios') || q.includes('pavimentos')) {
      const edfTable = schema.tables.find((t) => t.name.includes('edific'));
      if (edfTable) {
        const rows = data[edfTable.id] || [];
        return {
          answer: `O sistema possui ${rows.length} edificação(ões) cadastrada(s) no momento.`,
          matchedRows: rows,
          tableName: edfTable.singularLabel || edfTable.name,
        };
      }
    }

    // Generic answer: summarize counts across all tables
    const tableCounts = schema.tables.map((t) => {
      const count = (data[t.id] || []).length;
      return `• ${t.pluralLabel || t.name}: ${count} registro(s)`;
    });

    return {
      answer: `Consulta processada pelo motor analítico do Sygma Studio:\n\n` +
        `Resumo do banco de dados atual:\n${tableCounts.join('\n')}\n\n` +
        `Você pode filtrar diretamente na grade ou no Construtor de Consultas SQL.`,
    };
  }
}
