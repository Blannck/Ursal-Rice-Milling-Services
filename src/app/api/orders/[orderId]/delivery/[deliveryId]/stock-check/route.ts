import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string; deliveryId: string } }
) {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: params.deliveryId },
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

    if (!delivery || delivery.orderId !== params.orderId) {
      return NextResponse.json(
        { available: false, error: "Delivery not found" },
        { status: 404 }
      );
    }

    // If already fulfilled, stock is available
    if (delivery.status === 'fulfilled') {
      return NextResponse.json({ available: true });
    }

    // For backorders, check if stock is available
    if (delivery.deliveryNumber > 1) {
      for (const item of delivery.items) {
        const category = item.orderItem.category;
        
        // Get available inventory for this category
        const inventoryItems = await prisma.inventoryItem.findMany({
          where: {
            categoryId: category.id,
            quantity: { gt: 0 },
          },
        });

        const availableStock = inventoryItems.reduce(
          (sum, inv) => sum + inv.quantity,
          0
        );

        // Calculate needed stock (convert to kg for milled rice)
        const neededKg = category.isMilledRice ? item.quantity * 50 : item.quantity;
        
        if (availableStock < neededKg) {
          return NextResponse.json({ 
            available: false,
            reason: `Insufficient stock for ${category.name}`,
          });
        }
      }
    }

    return NextResponse.json({ available: true });
  } catch (error: any) {
    console.error("Stock check failed:", error);
    return NextResponse.json(
      { available: false, error: error.message },
      { status: 500 }
    );
  }
}
