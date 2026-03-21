"use client";
/**
 * SERVICIO CLIENTE: ReciboGenerador
 * Contiene toda la lógica de generación de PDF con jsPDF.
 * SOLO SE USA EN EL NAVEGADOR — nunca en Server Components ni Server Actions.
 */
import type { ReciboPago } from "@/lib/models/ReciboPago";

const NIT = "NIT: 900.123.456-7";
const ESTABLECIMIENTO = "GymAccess Cloud - Sede Central";
const DIRECCION = "Cra. 15 #93-47, Bogotá D.C., Colombia";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getMetodoPagoLabel(id: number): string {
  switch (id) {
    case 1: return "Efectivo";
    case 2: return "Tarjeta Débito/Crédito";
    case 3: return "Transferencia Bancaria";
    default: return "Otro";
  }
}

async function buildDoc(recibo: ReciboPago): Promise<any> {
  // @ts-ignore
  const module = await import("jspdf/dist/jspdf.umd.js");
  const jsPDF = module.jsPDF || module.default.jsPDF || module.default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const d = recibo.datos;

  const azul: [number, number, number] = [0, 83, 219];
  const gris: [number, number, number] = [100, 100, 100];
  const negro: [number, number, number] = [20, 20, 20];
  const verde: [number, number, number] = [22, 163, 74];
  const bgGris: [number, number, number] = [248, 249, 250];
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;

  // ── HEADER ──
  doc.setFillColor(...azul);
  doc.rect(0, 0, pageW, 50, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(ESTABLECIMIENTO, margin, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(NIT, margin, 28);
  doc.text(DIRECCION, margin, 34);

  // Badge PAGADO
  doc.setFillColor(...verde);
  doc.roundedRect(pageW - margin - 36, 15, 36, 12, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("✓  PAGADO", pageW - margin - 33, 23);

  // ── TÍTULO RECIBO ──
  doc.setTextColor(...negro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RECIBO DE PAGO", margin, 66);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...azul);
  doc.text(`N.° ${recibo.numeroRecibo}`, pageW - margin, 60, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gris);
  doc.text(`Generado: ${formatDateTime(recibo.fechaGeneracion)}`, pageW - margin, 66, { align: "right" });

  doc.setDrawColor(...azul);
  doc.setLineWidth(0.5);
  doc.line(margin, 72, pageW - margin, 72);

  // ── DATOS DEL CLIENTE ──
  let y = 82;
  doc.setFillColor(...bgGris);
  doc.roundedRect(margin, y - 6, contentW, 36, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gris);
  doc.text("CLIENTE", margin + 5, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...negro);
  doc.text(d.clienteNombre, margin + 5, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gris);
  doc.text(`Identificación: ${d.clienteIdentificacion}`, margin + 5, y + 15);
  doc.text(`UUID: ${d.clienteId}`, margin + 5, y + 21);

  // ── DETALLE DEL PAGO ──
  y += 46;
  const renderRow = (label: string, value: string, yPos: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gris);
    doc.text(label, margin + 5, yPos);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...negro);
    doc.text(value, pageW - margin - 5, yPos, { align: "right" });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos + 3, pageW - margin, yPos + 3);
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...negro);
  doc.text("DETALLE DEL PAGO", margin, y);
  y += 8;

  renderRow("Tipo de Membresía", d.tipoMembresia, y);               y += 12;
  renderRow("Método de Pago", getMetodoPagoLabel(d.metodoPagoId), y); y += 12;
  renderRow("Fecha de Pago", formatDateTime(d.fechaPago), y);          y += 12;
  renderRow("Vigencia Desde", formatDate(d.fechaInicio), y);           y += 12;
  renderRow("Vigencia Hasta", formatDate(d.fechaFin), y);              y += 12;

  // Total
  y += 6;
  doc.setFillColor(...azul);
  doc.roundedRect(margin, y - 6, contentW, 16, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("VALOR PAGADO", margin + 5, y + 4);
  doc.text(formatCurrency(d.monto), pageW - margin - 5, y + 4, { align: "right" });

  // ── FOOTER ──
  y = pageH - 25;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gris);
  doc.text("Este documento es un comprobante de pago oficial de GymAccess Cloud.", pageW / 2, y, { align: "center" });
  doc.text(`ID de Transacción: ${d.transaccionId}`, pageW / 2, y + 5, { align: "center" });

  return doc;
}

export const ReciboGenerador = {
  async descargar(recibo: ReciboPago): Promise<void> {
    const doc = await buildDoc(recibo);
    doc.save(`recibo-${recibo.numeroRecibo}.pdf`);
  },

  async imprimir(recibo: ReciboPago): Promise<void> {
    const doc = await buildDoc(recibo);
    const pdfUrl = doc.output("bloburl") as string;
    const win = window.open(pdfUrl, "_blank");
    if (win) {
      win.onload = () => win.print();
    }
  },
};
