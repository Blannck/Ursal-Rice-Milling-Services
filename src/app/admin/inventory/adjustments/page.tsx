import React from "react";
import { prisma } from "@/lib/prisma";
import AdjustmentsClient from "./adjustments-client";

// Inventory Adjustments - Manual stock corrections with audit trail
export default async function AdjustmentsPage() {
  // Fetch categories with their inventory items
  const categories = await prisma.category.findMany({
    where: {
      isHidden: false,
    },
    include: {
      inventoryItems: {
        include: {
          location: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all active storage locations
  const locations = await prisma.storageLocation.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return <AdjustmentsClient categories={categories} locations={locations} />;
}
