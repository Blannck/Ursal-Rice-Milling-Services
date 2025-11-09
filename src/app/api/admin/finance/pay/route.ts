export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    await assertAdmin();
    const { purchaseOrderId, amount, paymentType } = await request.json();

    if (!purchaseOrderId || !amount || !paymentType) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const finance = await prisma.finance.findFirst();
    if (!finance) return NextResponse.json({ ok: false, error: "Finance not initialized" }, { status: 500 });

    if (finance.accountBalance < amount) {
      return NextResponse.json({ ok: false, error: "Insufficient balance" }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId }, include: { supplier: true, items: true } });
    if (!po) return NextResponse.json({ ok: false, error: "Purchase order not found" }, { status: 404 });

    const totalAmount = po.items.reduce((s, it) => s + it.orderedQty * it.price, 0);
    const existingPayments = await prisma.financeTransaction.findMany({ where: { purchaseOrderId, type: "PAYMENT" } });
    const paidAmount = existingPayments.reduce((s, p) => s + p.amount, 0);
    const remainingAmount = totalAmount - paidAmount;

    if (amount > remainingAmount) {
      return NextResponse.json({ ok: false, error: "Amount exceeds remaining balance" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.financeTransaction.create({
        data: {
          financeId: finance.id,
          type: "PAYMENT",
          amount,
          description: `Payment for PO from ${po.supplier.name} (${paymentType})`,
          purchaseOrderId,
        },
      }),
      prisma.finance.update({ where: { id: finance.id }, data: { accountBalance: { decrement: amount }, totalPayables: { decrement: amount } } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/admin/finance/pay error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Failed" }, { status: 500 });
  }
}
