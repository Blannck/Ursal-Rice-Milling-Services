import { prisma } from "@/lib/prisma";
import { ReceiveShipmentClient } from "./receive-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getData() {
  const [purchaseOrders, locations] = await Promise.all([
    // Get POs that have items not fully received (Pending, Ordered, or Partial)
    prisma.purchaseOrder.findMany({
      where: {
        status: { in: ["Pending", "Ordered", "Partial"] },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
    }),
    // Get active storage locations
    prisma.storageLocation.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
  ]);

  return { purchaseOrders, locations };
}

export default async function ReceiveShipmentPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-6">
    < div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
      <ReceiveShipmentClient
        purchaseOrders={data.purchaseOrders}
        locations={data.locations}
      />
    </div>
    </div>
  );
}
