import React from "react";
import { prisma } from "@/lib/prisma";
import AlertsClient from "./alerts-client";

export default async function ReorderAlertsPage() {
  // Fetch ALL products with inventory items (we'll filter in JS based on actual stock)
  const products = await prisma.product.findMany({
    where: {
      isHidden: false,
      reorderPoint: {
        gt: 0, // Only products with a reorder point set
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
  const lowStockProducts = products
    .map((product) => {
      const actualStock = product.inventoryItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      return {
        ...product,
        actualStock, // Add calculated stock
      };
    })
    .filter((product) => product.actualStock <= product.reorderPoint)
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
  < div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
  <AlertsClient products={lowStockProducts} suppliers={suppliers} />
</div>
  )
}
