import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function run() {
  try {
    const finance = await prisma.finance.findFirst();
    if (!finance) {
      console.log('Finance record not initialized');
      return;
    }

    const now = new Date();

    const pos = await prisma.purchaseOrder.findMany({
      where: { paymentType: 'MONTHLY', dueDate: { lte: now }, status: { not: 'Cancelled' } },
      include: { items: true, supplier: true },
    });

    for (const po of pos) {
      const totalAmount = po.items.reduce((s: number, it: any) => s + it.orderedQty * it.price, 0);
      const payments = await prisma.financeTransaction.findMany({ where: { purchaseOrderId: po.id, type: 'PAYMENT' } });
      const paidAmount = payments.reduce((s: number, p: any) => s + p.amount, 0);
      const remaining = totalAmount - paidAmount;
      const monthly = po.monthlyTerms ? totalAmount / po.monthlyTerms : 0;

      if (remaining <= 0) {
        console.log(`PO ${po.id} already paid`);
        continue;
      }

      if (finance.accountBalance >= monthly) {
        await prisma.$transaction([
          prisma.financeTransaction.create({ data: { financeId: finance.id, type: 'PAYMENT', amount: monthly, description: `Auto monthly payment for PO ${po.id}`, purchaseOrderId: po.id } }),
          prisma.finance.update({ where: { id: finance.id }, data: { accountBalance: { decrement: monthly }, totalPayables: { decrement: monthly } } }),
          prisma.purchaseOrder.update({ where: { id: po.id }, data: { dueDate: addMonths(po.dueDate || new Date(), 1) } }),
        ]);

        // refresh finance
        const refreshed = await prisma.finance.findUnique({ where: { id: finance.id } });
        if (refreshed) finance.accountBalance = refreshed.accountBalance;

        console.log(`PO ${po.id} paid monthly amount ${monthly}`);
      } else {
        console.log(`PO ${po.id} skipped due to insufficient balance`);
      }
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
