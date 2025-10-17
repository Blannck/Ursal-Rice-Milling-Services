import React from "react";
import { prisma } from "@/lib/prisma";
import OrdersClient from "./orders-client";

// Admin page for order fulfillment - Stock-Out UI
export default async function AdminOrdersPage() {
  // Fetch orders that need fulfillment (completed status but not fulfilled yet)
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { status: "completed" },
        { status: "pending" },
        { status: "processing" },
      ],
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch all active storage locations with inventory items
  const locations = await prisma.storageLocation.findMany({
    where: {
      isActive: true,
    },
    include: {
      inventoryItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return <OrdersClient orders={orders} locations={locations} />;
}
