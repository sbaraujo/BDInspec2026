/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Visual Relationship Graph (ER Diagram)
 * Interactive canvas with draggable entity cards, SVG connectors, cardinality indicators, and FK actions.
 */

import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Key,
  Link as LinkIcon,
  ShieldAlert,
  X,
  LayoutGrid,
} from 'lucide-react';
import { ApplicationSchema, RelationshipSchema, TableSchema, Cardinality, ReferentialAction } from '../../core/schema/types.ts';

interface RelationshipGraphProps {
  schema: ApplicationSchema;
  onUpdateSchema: (updatedSchema: ApplicationSchema) => void;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  schema,
  onUpdateSchema,
}) => {
  const [zoom, setZoom] = useState(1);
  const [tablePositions, setTablePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    schema.tables.forEach((t, i) => {
      pos[t.id] = t.position || {
        x: 60 + (i % 3) * 360,
        y: 60 + Math.floor(i / 3) * 360,
      };
    });
    return pos;
  });

  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New relationship state
  const [sourceTableId, setSourceTableId] = useState('');
  const [sourceFieldId, setSourceFieldId] = useState('');
  const [targetTableId, setTargetTableId] = useState('');
  const [targetFieldId, setTargetFieldId] = useState('');
  const [cardinality, setCardinality] = useState<Cardinality>('1:N');
  const [onDelete, setOnDelete] = useState<ReferentialAction>('CASCADE');
  const [onUpdate, setOnUpdate] = useState<ReferentialAction>('CASCADE');

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    setDraggingTableId(tableId);
    const pos = tablePositions[tableId] || { x: 0, y: 0 };
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTableId) return;
    const newX = Math.max(20, e.clientX - dragOffset.x);
    const newY = Math.max(20, e.clientY - dragOffset.y);

    setTablePositions((prev) => ({
      ...prev,
      [draggingTableId]: { x: newX, y: newY },
    }));
  };

  const handleMouseUp = () => {
    if (draggingTableId) {
      // Save table positions back to schema
      const updatedTables = schema.tables.map((t) => {
        if (tablePositions[t.id]) {
          return { ...t, position: tablePositions[t.id] };
        }
        return t;
      });
      onUpdateSchema({ ...schema, tables: updatedTables });
    }
    setDraggingTableId(null);
  };

  const handleAutoLayout = () => {
    const newPos: Record<string, { x: number; y: number }> = {};
    schema.tables.forEach((t, i) => {
      newPos[t.id] = {
        x: 60 + (i % 3) * 380,
        y: 60 + Math.floor(i / 3) * 380,
      };
    });
    setTablePositions(newPos);
    const updatedTables = schema.tables.map((t) => ({ ...t, position: newPos[t.id] }));
    onUpdateSchema({ ...schema, tables: updatedTables });
  };

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTableId || !targetTableId || !sourceFieldId || !targetFieldId) {
      alert('Selecione todas as tabelas e campos do relacionamento.');
      return;
    }

    const srcTable = schema.tables.find((t) => t.id === sourceTableId);
    const tgtTable = schema.tables.find((t) => t.id === targetTableId);

    const newRel: RelationshipSchema = {
      id: `rel_${Date.now()}`,
      name: `${srcTable?.singularLabel || srcTable?.name} -> ${tgtTable?.singularLabel || tgtTable?.name}`,
      sourceTableId,
      sourceFieldId,
      targetTableId,
      targetFieldId,
      cardinality,
      onDelete,
      onUpdate,
    };

    onUpdateSchema({
      ...schema,
      relationships: [...schema.relationships, newRel],
    });

    setIsAddModalOpen(false);
  };

  const handleDeleteRelationship = (relId: string) => {
    if (!confirm('Deseja excluir esta restrição de chave estrangeira?')) return;
    onUpdateSchema({
      ...schema,
      relationships: schema.relationships.filter((r) => r.id !== relId),
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e17] overflow-hidden select-none relative">
      {/* ER Diagram Toolbar */}
      <div className="h-12 bg-[#0c121e] border-b border-slate-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Diagrama Entidade-Relacionamento (ER) · {schema.relationships.length} Conexões
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoLayout}
            className="px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            title="Auto-organizar entidades no canvas"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
            <span>Auto-Layout</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-2 text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded text-slate-400 hover:text-white border-l border-slate-700 ml-0.5"
              title="Redefinir Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-purple-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Relacionamento</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-auto relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            width: '2800px',
            height: '2400px',
            position: 'relative',
          }}
        >
          {/* SVG Connectors for Relationships */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#a855f7" />
              </marker>
            </defs>

            {schema.relationships.map((rel) => {
              const srcPos = tablePositions[rel.sourceTableId] || { x: 100, y: 100 };
              const tgtPos = tablePositions[rel.targetTableId] || { x: 450, y: 100 };

              // Center coordinates of cards
              const x1 = srcPos.x + 280; // right edge of source card
              const y1 = srcPos.y + 70;
              const x2 = tgtPos.x; // left edge of target card
              const y2 = tgtPos.y + 70;

              // Bezier curve
              const dx = Math.abs(x2 - x1) * 0.5;
              const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g key={rel.id} className="pointer-events-auto group">
                  {/* Outer glow line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray={rel.cardinality === '1:1' ? '4,4' : undefined}
                    className="opacity-80 group-hover:opacity-100 group-hover:stroke-cyan-400 transition-all cursor-pointer"
                  />
                  {/* Badge in middle */}
                  <g
                    transform={`translate(${midX - 35}, ${midY - 12})`}
                    className="cursor-pointer"
                    onClick={() => handleDeleteRelationship(rel.id)}
                  >
                    <rect
                      width="70"
                      height="24"
                      rx="4"
                      fill="#0f172a"
                      stroke="#a855f7"
                      strokeWidth="1"
                    />
                    <text
                      x="35"
                      y="16"
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {rel.cardinality} FK
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Draggable Table Cards */}
          {schema.tables.map((table) => {
            const pos = tablePositions[table.id] || { x: 100, y: 100 };

            return (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '280px',
                }}
                className="absolute z-10 bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden cursor-move transition-shadow hover:shadow-cyan-900/30 hover:border-cyan-500/50"
              >
                {/* Table Header */}
                <div className="bg-[#152033] px-3.5 py-2.5 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {table.pluralLabel || table.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {table.fields.length} cols
                  </span>
                </div>

                {/* Fields List */}
                <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
                  {table.fields.map((field) => {
                    const isPk = field.primaryKey || field.id === table.primaryKeyFieldId;
                    const isFk = schema.relationships.some(
                      (r) =>
                        (r.targetTableId === table.id && r.targetFieldId === field.id) ||
                        (r.sourceTableId === table.id && r.sourceFieldId === field.id)
                    );

                    return (
                      <div
                        key={field.id}
                        className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isPk ? (
                            <Key className="w-3 h-3 text-cyan-400 shrink-0" />
                          ) : isFk ? (
                            <LinkIcon className="w-3 h-3 text-purple-400 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0 ml-1 mr-0.5" />
                          )}
                          <span
                            className={`truncate ${
                              isPk ? 'text-white font-semibold' : 'text-slate-300'
                            }`}
                          >
                            {field.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">{field.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Relationship Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Criar Relacionamento Entre Tabelas</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRelationship} className="space-y-4">
              {/* Source (Pai) */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">
                  Tabela Primária (Pai / PK)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400">Tabela Origem</label>
                    <select
                      value={sourceTableId}
                      onChange={(e) => {
                        setSourceTableId(e.target.value);
                        const tbl = schema.tables.find((t) => t.id === e.target.value);
                        setSourceFieldId(tbl?.primaryKeyFieldId || '');
                      }}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white"
                      required
                    >
                      <option value="">Selecione...</option>
                      {schema.tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.pluralLabel || t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Campo PK</label>
                    <select
                      value={sourceFieldId}
                      onChange={(e) => setSourceFieldId(e.target.value)}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white font-mono"
                      required
                    >
                      <option value="">Selecione...</option>
                      {schema.tables
                        .find((t) => t.id === sourceTableId)
                        ?.fields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.type})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Target (Filha / FK) */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-purple-400 uppercase font-semibold">
                  Tabela Dependente (Filha / FK)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400">Tabela Destino</label>
                    <select
                      value={targetTableId}
                      onChange={(e) => setTargetTableId(e.target.value)}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white"
                      required
                    >
                      <option value="">Selecione...</option>
                      {schema.tables
                        .filter((t) => t.id !== sourceTableId)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.pluralLabel || t.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Campo Estrangeiro (FK)</label>
                    <select
                      value={targetFieldId}
                      onChange={(e) => setTargetFieldId(e.target.value)}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white font-mono"
                      required
                    >
                      <option value="">Selecione...</option>
                      {schema.tables
                        .find((t) => t.id === targetTableId)
                        ?.fields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.type})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Cardinality & Referential Action */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Cardinalidade</label>
                  <select
                    value={cardinality}
                    onChange={(e) => setCardinality(e.target.value as Cardinality)}
                    className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white font-mono"
                  >
                    <option value="1:N">1:N (Um para Muitos)</option>
                    <option value="1:1">1:1 (Um para Um)</option>
                    <option value="N:N">N:N (Muitos para Muitos)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">ON DELETE</label>
                  <select
                    value={onDelete}
                    onChange={(e) => setOnDelete(e.target.value as ReferentialAction)}
                    className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white font-mono"
                  >
                    <option value="CASCADE">CASCADE (Exclusão em cascata)</option>
                    <option value="RESTRICT">RESTRICT (Bloquear exclusão)</option>
                    <option value="SET NULL">SET NULL (Anular chave)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">ON UPDATE</label>
                  <select
                    value={onUpdate}
                    onChange={(e) => setOnUpdate(e.target.value as ReferentialAction)}
                    className="mt-1 w-full h-8 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white font-mono"
                  >
                    <option value="CASCADE">CASCADE</option>
                    <option value="RESTRICT">RESTRICT</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Confirmar Relacionamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
