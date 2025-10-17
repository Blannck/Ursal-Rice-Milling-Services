import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { InventoryClient } from "./inventory-client";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getInventoryData() {
  // Force fresh data fetch by checking headers
  const headersList = headers();
  const timestamp = headersList.get('x-timestamp') || Date.now();
  
  console.log(`🔄 Fetching inventory data at ${new Date().toISOString()}`);
  
  const [locations, products, inventoryItems] = await Promise.all([
    prisma.storageLocation.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        _count: {
          select: {
            inventoryItems: true,
            children: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: { isHidden: false },
      include: {
        supplier: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryItem.findMany({
      include: {
        product: {
          include: {
            supplier: true,
          },
        },
        location: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  console.log(`📊 Fetched ${inventoryItems.length} inventory items, Total Qty: ${inventoryItems.reduce((sum, item) => sum + item.quantity, 0)}`);

  return { locations, products, inventoryItems };
}

export default async function InventoryManagementPage() {
  const data = await getInventoryData();

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <InventoryClient
          initialLocations={data.locations}
          initialProducts={data.products}
          initialInventoryItems={data.inventoryItems}
        />
      </Suspense>
    </div>
  );
}
