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
  
  const [locations, categories, inventoryItems] = await Promise.all([
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
    prisma.category.findMany({
      // Remove isHidden filter to show all categories in inventory management
      include: {
        supplier: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryItem.findMany({
      include: {
        category: {
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

  return { locations, categories, inventoryItems };
}

export default async function InventoryManagementPage() {
  const data = await getInventoryData();

  return (
    <div className="container mx-auto py-6">
    < div className="border-transparent w-12/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
      <Suspense fallback={<div>Loading...</div>}>
        <InventoryClient
          initialLocations={data.locations}
          initialCategories={data.categories}
          initialInventoryItems={data.inventoryItems}
        />
      </Suspense>
    </div>
    </div>
  );
}
