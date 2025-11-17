import React from "react";
import { prisma } from "@/lib/prisma";
import AlertsClient from "./alerts-client";

export default async function ReorderAlertsPage() {
  // Fetch ALL categories with inventory items (we'll filter in JS based on actual stock)
  const categories = await prisma.category.findMany({
    where: {
      isHidden: false,
      reorderPoint: {
        gt: 0, // Only categories with a reorder point set
      },
    },
    include: {
      supplier: true,
      inventoryItems: {
        include: {
          location: true,
        },
      },
    },
  });

  // Calculate actual stock from inventory items and filter low stock
  const lowStockCategories = categories
    .map((category) => {
      const actualStock = category.inventoryItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      return {
        ...category,
        actualStock, // Add calculated stock
      };
    })
    .filter((category) => category.actualStock <= category.reorderPoint)
    .sort((a, b) => a.actualStock - b.actualStock); // Sort by actual stock (lowest first)

  // Fetch all suppliers for quick PO creation
  const suppliers = await prisma.supplier.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5">
      <AlertsClient categories={lowStockCategories} suppliers={suppliers} />
    </div>
  )
}
