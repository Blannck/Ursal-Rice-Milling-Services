export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    await assertAdmin();

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { status: { not: "Cancelled" } },
      include: {
        supplier: { select: { name: true } },
        items: { select: { orderedQty: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const payments = await prisma.financeTransaction.findMany({
      where: { type: "PAYMENT" },
    });

    function addMonths(d: Date, months: number) {
      const dt = new Date(d);
      dt.setMonth(dt.getMonth() + months);
      return dt;
    }

    const payables = purchaseOrders.map((po) => {
      const totalAmount = po.items.reduce((s, it) => s + it.orderedQty * it.price, 0);
      const paymentsForPO = payments
        .filter((p) => p.purchaseOrderId === po.id)
        .sort((a, b) => (a.createdAt as any) - (b.createdAt as any));
      const paidAmount = paymentsForPO.reduce((s, p) => s + p.amount, 0);
      const remainingAmount = totalAmount - paidAmount;
      const monthlyPayment = po.paymentType === "MONTHLY" && po.monthlyTerms ? totalAmount / po.monthlyTerms : null;

      // Build installments schedule for MONTHLY plans
      let installments: Array<{ index: number; dueDate: string; paid: boolean; paidAmount: number }> = [];
      let remainingMonths = 0;

      if (po.paymentType === "MONTHLY" && po.monthlyTerms && monthlyPayment !== null) {
        // reference date: use po.dueDate if present (represents next due date), otherwise orderDate or createdAt
        const refDate = (po.dueDate ?? po.orderDate ?? po.createdAt) as Date;

        // Number of installments already paid (map payments sequentially)
        const paymentsQueue = paymentsForPO.slice();

        for (let i = 1; i <= po.monthlyTerms; i++) {
          // compute due date relative to the reference date where the installment index that equals (paidCount+1) aligns with refDate
          const paidCount = paymentsForPO.length;
          const offset = i - (paidCount + 1);
          const due = addMonths(refDate, offset);

          const paymentForThisInstallment = paymentsQueue.shift();
          const paid = !!paymentForThisInstallment;
          const paidAmt = paymentForThisInstallment ? paymentForThisInstallment.amount : 0;

          if (!paid) remainingMonths += 1;

          installments.push({ index: i, dueDate: due.toISOString(), paid, paidAmount: paidAmt });
        }
      }

      return {
        id: po.id,
        supplier: po.supplier.name,
        orderDate: po.orderDate?.toISOString() || null,
        paymentType: po.paymentType,
        monthlyTerms: po.monthlyTerms,
        dueDate: po.dueDate?.toISOString() || null,
        totalAmount,
        paidAmount,
        remainingAmount,
        monthlyPayment,
        status: po.status,
        installments,
        remainingMonths,
      };
    });

    return NextResponse.json({ ok: true, data: payables.filter(p => p.remainingAmount > 0) });
  } catch (e: any) {
    console.error("GET /api/admin/finance/payables error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Failed" }, { status: 500 });
  }
}
