export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    await assertAdmin();

    let finance = await prisma.finance.findFirst({ include: { transactions: { orderBy: { createdAt: "desc" } } } });
    if (!finance) {
      finance = await prisma.finance.create({ data: { totalPayables: 0, accountBalance: 0 }, include: { transactions: true } });
    }

    return NextResponse.json({ ok: true, data: {
      id: finance.id,
      totalPayables: finance.totalPayables,
      accountBalance: finance.accountBalance,
      createdAt: finance.createdAt.toISOString(),
      updatedAt: finance.updatedAt.toISOString(),
      transactions: finance.transactions.map(t => ({ id: t.id, type: t.type, amount: t.amount, description: t.description, orderId: t.orderId, purchaseOrderId: t.purchaseOrderId, createdAt: t.createdAt.toISOString() }))
    }});
  } catch (e: any) {
    console.error("GET /api/admin/finance/summary error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Failed" }, { status: 500 });
  }
}
