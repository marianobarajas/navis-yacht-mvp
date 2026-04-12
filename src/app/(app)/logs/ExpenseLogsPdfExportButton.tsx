"use client";

import { useState } from "react";
import type { ExpenseLog } from "@prisma/client";
import { formatDateDDMMYY } from "@/lib/dateUtils";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatUsd(n: number): string {
  return usdFormatter.format(Number.isFinite(n) ? n : 0);
}

function getCostNum(log: { cost: unknown }): number {
  const c = log.cost as { toNumber?: () => number } | number | string;
  if (c != null && typeof c === "object" && typeof (c as { toNumber?: () => number }).toNumber === "function") {
    return (c as { toNumber: () => number }).toNumber();
  }
  if (typeof c === "number") return c;
  const parsed = parseFloat(String(c));
  return Number.isNaN(parsed) ? 0 : parsed;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  PAID: "Paid",
};

function statusLabel(s: string | undefined): string {
  if (!s) return "—";
  return STATUS_LABELS[s] ?? s;
}

export function ExpenseLogsPdfExportButton({
  yachtName,
  periodLabel,
  logs,
}: {
  yachtName: string;
  periodLabel: string;
  logs: ExpenseLog[];
}) {
  const [busy, setBusy] = useState(false);

  async function exportPdf() {
    setBusy(true);
    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      let y = margin;
      doc.setFontSize(16);
      doc.text("Expense log", margin, y);
      y += 22;
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Yacht: ${yachtName}`, margin, y);
      y += 16;
      doc.text(`Period: ${periodLabel}`, margin, y);
      y += 16;
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 28;
      doc.setTextColor(0, 0, 0);

      const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const body = sorted.map((log) => [
        log.service,
        formatUsd(getCostNum(log)),
        formatDateDDMMYY(log.date),
        (log.comments ?? "").replace(/\n/g, " "),
        statusLabel(log.status),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Service", "Amount", "Date", "Comments", "Status"]],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [25, 37, 60] },
        columnStyles: {
          1: { halign: "right" },
        },
      });

      const safe = yachtName.replace(/[^\w\d-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "yacht";
      doc.save(`expenses-${safe}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Could not generate PDF. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void exportPdf()}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-bg-subtle)] disabled:opacity-60"
    >
      {busy ? "Exporting…" : "Export"}
    </button>
  );
}
