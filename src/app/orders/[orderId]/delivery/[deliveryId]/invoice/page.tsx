import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import InvoiceView from "@/components/InvoiceView";
import { requireActiveUser } from "@/lib/guard";

export default async function DeliveryInvoicePage({
  params,
}: {
  params: { orderId: string; deliveryId: string };
}) {
  // Check if user is active
  const check = await requireActiveUser();
  if ('redirect' in check && check.redirect) {
    redirect(check.redirect);
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id: params.deliveryId },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!delivery || delivery.orderId !== params.orderId) {
    notFound();
  }

  // For backorder deliveries (deliveryNumber > 1), check stock availability
  if (delivery.deliveryNumber > 1 && delivery.status === 'pending') {
    for (const item of delivery.items) {
      const product = item.orderItem.product;
      
      // Get available inventory for this product
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          productId: product.id,
          quantity: { gt: 0 },
        },
      });

      const availableStock = inventoryItems.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      // Calculate needed stock (convert to kg for milled rice)
      const neededKg = product.isMilledRice ? item.quantity * 50 : item.quantity;
      
      if (availableStock < neededKg) {
        // Stock not available - show unavailable page
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invoice Not Available Yet
              </h1>
              <p className="text-gray-600 mb-4">
                This is a backorder delivery and the invoice will be available once stock becomes available.
              </p>
              <p className="text-sm text-gray-500">
                Delivery #{delivery.deliveryNumber} - Waiting for stock
              </p>
              <div className="mt-6">
                <a
                  href={`/orders/${params.orderId}`}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Order Details
                </a>
              </div>
            </div>
          </div>
        );
      }
    }
  }

  // Calculate delivery total
  const deliveryTotal = delivery.items.reduce(
    (sum, item) => sum + item.orderItem.price * item.quantity,
    0
  );

  // Create a modified order object with only this delivery's items
  const deliveryOrder = {
    ...delivery.order,
    total: deliveryTotal,
    items: delivery.items.map((item) => ({
      id: item.id,
      userId: item.orderItem.userId,
      orderId: item.orderItem.orderId,
      productId: item.orderItem.productId,
      quantity: item.quantity,
      quantityFulfilled: item.orderItem.quantityFulfilled,
      quantityPending: item.orderItem.quantityPending,
      price: item.orderItem.price,
      product: item.orderItem.product,
    })),
    deliveryNumber: delivery.deliveryNumber,
    deliveryStatus: delivery.status,
    shipmentStatus: delivery.shipmentStatus,
  };

  // Get stock-out transactions for this delivery (if fulfilled)
  const stockOutTransactions = delivery.status === 'fulfilled'
    ? await prisma.inventoryTransaction.findMany({
        where: {
          kind: "STOCK_OUT",
          note: {
            contains: `Delivery ${delivery.deliveryNumber}`,
          },
        },
        include: {
          product: true,
          location: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      })
    : [];

  const serializedTransactions = stockOutTransactions.map((txn) => ({
    id: txn.id,
    productId: txn.productId,
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
      order={deliveryOrder}
      stockOutTransactions={serializedTransactions}
    />
  );
}
