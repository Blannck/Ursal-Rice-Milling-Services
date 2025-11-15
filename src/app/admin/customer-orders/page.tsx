import React from "react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import ManageOrdersClient from "./manage-orders-client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
      deliveries: {
        include: {
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ManageOrdersClient orders={serializedOrders} />
      </div>
    </div>
  );
}
