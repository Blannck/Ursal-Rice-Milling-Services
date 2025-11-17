import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InvoiceView from "@/components/InvoiceView";

export default async function InvoicePage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Get stock-out transactions for this order
  const stockOutTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      kind: "STOCK_OUT",
      note: {
        contains: `#${order.id.slice(0, 8)}`,
      },
    },
    include: {
      category: true,
      location: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Serialize data for client component
  const serializedOrder = {
    ...order,
    createdAt: order.createdAt,
  };

  const serializedTransactions = stockOutTransactions.map((txn) => ({
    id: txn.id,
    categoryId: txn.categoryId,
    quantity: txn.quantity,
    location: txn.location
      ? {
          name: txn.location.name,
          type: txn.location.type,
        }
      : null,
  }));

  return (
    <InvoiceView
      order={serializedOrder}
      stockOutTransactions={serializedTransactions}
    />
  );
}
