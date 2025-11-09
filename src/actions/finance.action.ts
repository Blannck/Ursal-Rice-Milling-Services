"use server";

import { prisma } from "@/lib/prisma";

export async function getFinanceData() {
  try {
    // Get or create finance record
    let finance = await prisma.finance.findFirst({
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!finance) {
      finance = await prisma.finance.create({
        data: {
          totalPayables: 0,
          accountBalance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    // Serialize dates for client
    return {
      id: finance.id,
      totalPayables: finance.totalPayables,
      accountBalance: finance.accountBalance,
      createdAt: finance.createdAt.toISOString(),
      updatedAt: finance.updatedAt.toISOString(),
      transactions: finance.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        orderId: t.orderId,
        purchaseOrderId: t.purchaseOrderId,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching finance data:", error);
    throw error;
  }
}

export async function createPayableTransaction(
  amount: number,
  purchaseOrderId: string,
  description: string
) {
  try {
    const finance = await prisma.finance.findFirst();
    if (!finance) throw new Error("Finance record not found");

    // Create transaction and update totals
    await prisma.$transaction([
      prisma.financeTransaction.create({
        data: {
          financeId: finance.id,
          type: "PAYABLE",
          amount,
          description,
          purchaseOrderId,
        },
      }),
      prisma.finance.update({
        where: { id: finance.id },
        data: {
          totalPayables: { increment: amount },
        },
      }),
    ]);
  } catch (error) {
    console.error("Error creating payable transaction:", error);
    throw error;
  }
}

export async function createSaleTransaction(
  amount: number,
  orderId: string,
  description: string
) {
  try {
    const finance = await prisma.finance.findFirst();
    if (!finance) throw new Error("Finance record not found");

    // Create transaction and update account balance
    await prisma.$transaction([
      prisma.financeTransaction.create({
        data: {
          financeId: finance.id,
          type: "SALE",
          amount,
          description,
          orderId,
        },
      }),
      prisma.finance.update({
        where: { id: finance.id },
        data: {
          accountBalance: { increment: amount },
        },
      }),
    ]);
  } catch (error) {
    console.error("Error creating sale transaction:", error);
    throw error;
  }
}

export async function getPayablePurchaseOrders() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: { not: "Cancelled" },
      },
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            orderedQty: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get finance record to check for payments
    const financeTransactions = await prisma.financeTransaction.findMany({
      where: {
        type: "PAYMENT",
      },
    });

    // Calculate paid amounts for each PO
    const purchaseOrdersWithPayments = purchaseOrders.map((po) => {
      const totalAmount = po.items.reduce(
        (sum, item) => sum + item.orderedQty * item.price,
        0
      );

      const paidAmount = financeTransactions
        .filter((t) => t.purchaseOrderId === po.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const remainingAmount = totalAmount - paidAmount;

      let monthlyPayment = null;
      if (po.paymentType === "MONTHLY" && po.monthlyTerms) {
        monthlyPayment = totalAmount / po.monthlyTerms;
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
      };
    });

    return purchaseOrdersWithPayments.filter((po) => po.remainingAmount > 0);
  } catch (error) {
    console.error("Error fetching payable purchase orders:", error);
    throw error;
  }
}

export async function payPurchaseOrder(
  purchaseOrderId: string,
  amount: number,
  paymentType: "FULL" | "MONTHLY"
) {
  try {
    const finance = await prisma.finance.findFirst();
    if (!finance) throw new Error("Finance record not found");

    // Check if sufficient balance
    if (finance.accountBalance < amount) {
      throw new Error("Insufficient balance");
    }

    // Get purchase order details
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: { select: { name: true } },
        items: true,
      },
    });

    if (!po) throw new Error("Purchase order not found");

    const totalAmount = po.items.reduce(
      (sum, item) => sum + item.orderedQty * item.price,
      0
    );

    // Get existing payments
    const existingPayments = await prisma.financeTransaction.findMany({
      where: {
        purchaseOrderId,
        type: "PAYMENT",
      },
    });

    const paidAmount = existingPayments.reduce((sum, t) => sum + t.amount, 0);
    const remainingAmount = totalAmount - paidAmount;

    if (amount > remainingAmount) {
      throw new Error("Payment amount exceeds remaining balance");
    }

    // Create payment transaction
    await prisma.$transaction([
      prisma.financeTransaction.create({
        data: {
          financeId: finance.id,
          type: "PAYMENT",
          amount,
          description: `Payment for PO from ${po.supplier.name} (${paymentType === "FULL" ? "Full Payment" : "Monthly Installment"})`,
          purchaseOrderId,
        },
      }),
      prisma.finance.update({
        where: { id: finance.id },
        data: {
          accountBalance: { decrement: amount },
          totalPayables: { decrement: amount },
        },
      }),
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("Error paying purchase order:", error);
    throw error;
  }
}