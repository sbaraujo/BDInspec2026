/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SYGMA DATABASE STUDIO AI — Professional PDF Report Generator
 * Generates technical, publication-quality A4 PDF reports with tables, headers, and signature lines.
 */

import { jsPDF } from 'jspdf';
import { ReportSchema, TableSchema } from '../schema/types.ts';

export function exportReportToPDF(
  report: ReportSchema,
  table: TableSchema,
  rows: Record<string, any>[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // 1. Header banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SYGMA DATABASE STUDIO AI', margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('RELATÓRIO TÉCNICO OFICIAL DE CONFORMIDADE', margin, 18);

  const nowStr = new Date().toLocaleString('pt-BR');
  doc.text(`Emitido em: ${nowStr}`, pageWidth - margin - 50, 18);

  currentY = 38;

  // 2. Report Titles
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(report.title.toUpperCase(), margin, currentY);
  currentY += 7;

  if (report.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(report.subtitle, margin, currentY);
    currentY += 8;
  }

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 3. Metadata summary
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Tabela Base: ${table.singularLabel || table.name} · Registros listados: ${rows.length}`, margin, currentY);
  currentY += 8;

  // 4. Data Table
  const activeCols = report.columns.map((c) => {
    const field = table.fields.find((f) => f.id === c.fieldId);
    return {
      id: c.fieldId,
      header: c.header || field?.label || field?.name || 'Coluna',
    };
  });

  const colWidth = (pageWidth - margin * 2) / Math.max(activeCols.length, 1);
  const rowHeight = 8;

  // Table Header Row
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  activeCols.forEach((col, idx) => {
    const colX = margin + idx * colWidth + 2;
    doc.text(col.header, colX, currentY + 5.5, { maxWidth: colWidth - 4 });
  });

  currentY += rowHeight;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rows.forEach((row, rowIndex) => {
    // Check page overflow
    if (currentY + rowHeight > pageHeight - 35) {
      doc.addPage();
      currentY = margin + 10;
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F');
    }

    doc.setTextColor(51, 65, 85);
    activeCols.forEach((col, colIdx) => {
      const colX = margin + colIdx * colWidth + 2;
      const rawVal = row[col.id];
      const valStr = rawVal === null || rawVal === undefined ? '—' : String(rawVal);
      doc.text(valStr, colX, currentY + 5.5, { maxWidth: colWidth - 4 });
    });

    currentY += rowHeight;
  });

  currentY += 10;

  // 5. Signature Block
  if (report.includeSignatureBlock) {
    if (currentY + 30 > pageHeight - 20) {
      doc.addPage();
      currentY = margin + 20;
    }

    currentY += 10;
    const sigWidth = 70;
    const sigX1 = margin + 15;
    const sigX2 = pageWidth - margin - sigWidth - 15;

    doc.setDrawColor(148, 163, 184);
    doc.line(sigX1, currentY, sigX1 + sigWidth, currentY);
    doc.line(sigX2, currentY, sigX2 + sigWidth, currentY);

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Responsável Técnico / Inspetor', sigX1 + 5, currentY + 5);
    doc.text('CREA / CAU Responsável', sigX1 + 10, currentY + 9);

    doc.text('Contratante / Administrador', sigX2 + 8, currentY + 5);
    doc.text('Ciente e de Acordo', sigX2 + 18, currentY + 9);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sygma Database Studio AI — Página ${p} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Trigger download
  const safeName = report.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  doc.save(`${safeName}_${Date.now()}.pdf`);
}
