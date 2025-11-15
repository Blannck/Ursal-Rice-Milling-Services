export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function POST(request: NextRequest) {
  try {
    await assertAdmin();

    const finance = await prisma.finance.findFirst();
    if (!finance) return NextResponse.json({ ok: false, error: "Finance not initialized" }, { status: 500 });

    const now = new Date();

    // Find monthly POs with dueDate <= now and remainingAmount > 0
    const pos = await prisma.purchaseOrder.findMany({
      where: { paymentType: "MONTHLY", dueDate: { lte: now }, status: { not: "Cancelled" } },
      include: { items: true, supplier: true },
    });

    const results: Array<any> = [];

    for (const po of pos) {
      const totalAmount = po.items.reduce((s: number, it: any) => s + it.orderedQty * it.price, 0);
      const payments = await prisma.financeTransaction.findMany({ where: { purchaseOrderId: po.id, type: "PAYMENT" } });
      const paidAmount = payments.reduce((s: number, p: any) => s + p.amount, 0);
      const remaining = totalAmount - paidAmount;
      const monthly = po.monthlyTerms ? totalAmount / po.monthlyTerms : 0;

      if (remaining <= 0) {
        results.push({ id: po.id, status: "already_paid" });
        continue;
      }

      if (finance.accountBalance >= monthly) {
        // perform payment
        await prisma.$transaction([
          prisma.financeTransaction.create({ data: { financeId: finance.id, type: "PAYMENT", amount: monthly, description: `Auto monthly payment for PO ${po.id}`, purchaseOrderId: po.id } }),
          prisma.finance.update({ where: { id: finance.id }, data: { accountBalance: { decrement: monthly }, totalPayables: { decrement: monthly } } }),
          prisma.purchaseOrder.update({ where: { id: po.id }, data: { dueDate: addMonths(po.dueDate || new Date(), 1) } }),
        ]);

        // refresh finance var for next iteration
        const refreshedFinance = await prisma.finance.findUnique({ where: { id: finance.id } });
        if (refreshedFinance) finance.accountBalance = refreshedFinance.accountBalance;

        results.push({ id: po.id, status: "paid", amount: monthly });
      } else {
        results.push({ id: po.id, status: "insufficient_balance" });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    console.error("POST /api/admin/finance/run-scheduler error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Failed" }, { status: 500 });
  }
}
