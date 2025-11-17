export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    await assertAdmin();

    const { deliveryId, shipmentStatus } = await request.json();

    if (!deliveryId || !shipmentStatus) {
      return NextResponse.json(
        { ok: false, error: "Delivery ID and shipment status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["Processing Order", "In Transit", "Delivered"];
    if (!validStatuses.includes(shipmentStatus)) {
      return NextResponse.json(
        { ok: false, error: "Invalid shipment status" },
        { status: 400 }
      );
    }

    // Fetch delivery with items to check if it's a backorder
    const deliveryData = await prisma.delivery.findUnique({
      where: { id: deliveryId },
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
    });

    if (!deliveryData) {
      return NextResponse.json(
        { ok: false, error: "Delivery not found" },
        { status: 404 }
      );
    }

    // If this is a backorder (deliveryNumber > 1), check stock availability
    if (deliveryData.deliveryNumber > 1) {
      const stockErrors: string[] = [];

      for (const item of deliveryData.items) {
        const category = item.orderItem.category;
        
        // Get available inventory for this category
        const inventoryItems = await prisma.inventoryItem.findMany({
          where: {
            categoryId: category.id,
            quantity: { gt: 0 },
          },
          orderBy: { createdAt: "asc" }, // FIFO
        });

        const availableStock = inventoryItems.reduce(
          (sum, inv) => sum + inv.quantity,
          0
        );

        // Calculate needed stock (convert to kg for milled rice)
        const neededKg = category.isMilledRice ? item.quantity * 50 : item.quantity;
        
        if (availableStock < neededKg) {
          if (category.isMilledRice) {
            const availableSacks = Math.floor(availableStock / 50);
            const neededSacks = item.quantity;
            stockErrors.push(
              `Insufficient stock for ${category.name}. Available: ${availableSacks} sacks (${availableStock} kg), Needed: ${neededSacks} sacks (${neededKg} kg)`
            );
          } else {
            stockErrors.push(
              `Insufficient stock for ${category.name}. Available: ${availableStock} units, Needed: ${neededKg} units`
            );
          }
        }
      }

      if (stockErrors.length > 0) {
        return NextResponse.json(
          { 
            ok: false, 
            error: "Cannot update shipment status for backorder: " + stockErrors.join("; "),
          },
          { status: 400 }
        );
      }
    }

    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { 
        shipmentStatus,
      },
    });

    console.log(`📦 Delivery ${deliveryId} shipment status updated to: ${shipmentStatus}`);

    return NextResponse.json({ ok: true, delivery });
  } catch (e: any) {
    console.error("Delivery shipment status update failed:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to update delivery shipment status" },
      { status: 500 }
    );
  }
}
