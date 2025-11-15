import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/guard";
import InventoryReportClient from "./report-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getInventoryReportData() {
  // Ensure user is admin
  await assertAdmin();

  // Fetch all inventory items with product and location details
  const inventoryItems = await prisma.inventoryItem.findMany({
    include: {
      product: {
        include: {
          supplier: true,
        },
      },
      location: {
        include: {
          parent: true,
        },
      },
    },
    orderBy: [
      { product: { category: "asc" } },
      { product: { name: "asc" } },
    ],
  });

  // Get all products for category statistics
  const products = await prisma.product.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      reorderPoint: true,
      isMilledRice: true,
      millingYieldRate: true,
      supplier: {
        select: {
          name: true,
        },
      },
    },
  });

  // Get all storage locations
  const locations = await prisma.storageLocation.findMany({
    where: { isActive: true },
    include: {
      parent: true,
      _count: {
        select: {
          inventoryItems: true,
        },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return {
    inventoryItems,
    products,
    locations,
  };
}

export default async function InventoryReportPage() {
  const data = await getInventoryReportData();

  return (
    <div className="container mx-auto py-6">
      <div className="border-transparent w-full bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5">
        <Suspense fallback={<div>Loading inventory report...</div>}>
          <InventoryReportClient
            inventoryItems={data.inventoryItems}
            products={data.products}
            locations={data.locations}
          />
        </Suspense>
      </div>
    </div>
  );
}
