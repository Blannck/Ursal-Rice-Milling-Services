import React from "react";
import { prisma } from "@/lib/prisma";
import OrdersHistoryClient from "./history-client";

export const dynamic = "force-dynamic";

export default async function OrdersHistoryPage() {
  // Fetch only fulfilled orders (orders where all deliveries are fulfilled)
  const orders = await prisma.order.findMany({
    where: {
      deliveries: {
        every: {
          status: "fulfilled"
        }
      }
    },
    include: {
      items: {
        include: {
          category: true,
        },
      },
      deliveries: {
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          deliveryNumber: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serialize dates for client component
  const serializedOrders = JSON.parse(JSON.stringify(orders));

  return (
    <div className="min-h-screen">
      <div className="border-transparent mt-20 w-12/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <OrdersHistoryClient orders={serializedOrders} />
        </div>
      </div>
    </div>
  );
}
