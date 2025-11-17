import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = params;
    const { deliveryId } = await req.json();

    if (!deliveryId) {
      return NextResponse.json(
        { error: "Delivery ID is required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get delivery with items
      const delivery = await tx.delivery.findUnique({
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
          order: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!delivery) {
        throw new Error("Delivery not found");
      }

      if (delivery.status === "fulfilled") {
        throw new Error("Delivery already fulfilled");
      }

      if (delivery.shipmentStatus !== "Delivered") {
        throw new Error(`Delivery must be marked as 'Delivered' before fulfillment. Current status: ${delivery.shipmentStatus}`);
      }

      // Process each delivery item
      for (const deliveryItem of delivery.items) {
        const orderItem = deliveryItem.orderItem;
        const category = orderItem.category;

        // Calculate kg to deduct
        const kgToDeduct = category.isMilledRice
          ? deliveryItem.quantity * 50
          : deliveryItem.quantity;

        console.log(
          `\n   📦 Fulfilling: ${category.name} x ${deliveryItem.quantity}${
            category.isMilledRice
              ? " sacks (" + kgToDeduct + " kg)"
              : " kg"
          }`
        );

        // Get inventory items (FIFO)
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            categoryId: category.id,
            quantity: { gt: 0 },
          },
          include: { location: true },
          orderBy: { createdAt: "asc" },
        });

        const totalAvailableKg = inventoryItems.reduce(
          (sum, inv) => sum + inv.quantity,
          0
        );

        if (totalAvailableKg < kgToDeduct) {
          if (category.isMilledRice) {
            const availableSacks = Math.floor(totalAvailableKg / 50);
            const neededSacks = Math.ceil(kgToDeduct / 50);
            throw new Error(
              `Insufficient stock for ${category.name}. Available: ${availableSacks} sacks (${totalAvailableKg} kg), Needed: ${neededSacks} sacks (${kgToDeduct} kg)`
            );
          } else {
            throw new Error(
              `Insufficient stock for ${category.name}. Available: ${totalAvailableKg} kg, Needed: ${kgToDeduct} kg`
            );
          }
        }

        // Deduct from inventory (FIFO)
        let remainingToFulfill = kgToDeduct;
        for (const inventoryItem of inventoryItems) {
          if (remainingToFulfill <= 0) break;

          const toDeduct = Math.min(inventoryItem.quantity, remainingToFulfill);

          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantity: inventoryItem.quantity - toDeduct },
          });

          await tx.inventoryTransaction.create({
            data: {
              categoryId: category.id,
              locationId: inventoryItem.locationId,
              kind: "STOCK_OUT",
              quantity: toDeduct,
              unitPrice: orderItem.price,
              note: `Delivery ${delivery.deliveryNumber} fulfillment for Order #${delivery.orderId.slice(0, 8)}${
                category.isMilledRice ? ` (${deliveryItem.quantity} sacks)` : ""
              }`,
              createdBy: user.id,
            },
          });

          console.log(
            `      ✅ Deducted ${toDeduct} kg from ${inventoryItem.location.name}`
          );

          remainingToFulfill -= toDeduct;
        }

        // Update category stock
        await tx.category.update({
          where: { id: category.id },
          data: {
            stockOnHand: { decrement: kgToDeduct },
            stockAllocated: { increment: kgToDeduct },
          },
        });

        // Update order item fulfilled quantity
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            quantityFulfilled: { increment: deliveryItem.quantity },
            quantityPending: { decrement: deliveryItem.quantity },
          },
        });

        console.log(
          `      📊 Updated order item: +${deliveryItem.quantity} fulfilled`
        );
      }

      // Mark delivery as fulfilled
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: "fulfilled",
          fulfilledAt: new Date(),
          fulfilledBy: user.id,
        },
      });

      // Check if all deliveries are fulfilled
      const allDeliveries = await tx.delivery.findMany({
        where: { orderId: delivery.orderId },
      });

      const allFulfilled = allDeliveries.every((d) => d.status === "fulfilled");
      const anyFulfilled = allDeliveries.some((d) => d.status === "fulfilled");

      // Update order status
      let newOrderStatus = "processing";
      let newFulfillmentStatus = "pending";

      if (allFulfilled) {
        newOrderStatus = "completed";
        newFulfillmentStatus = "fulfilled";
      } else if (anyFulfilled) {
        newOrderStatus = "partial";
        newFulfillmentStatus = "partial";
      }

      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          status: newOrderStatus,
          fulfillmentStatus: newFulfillmentStatus,
        },
      });

      console.log(
        `   ✅ Delivery ${delivery.deliveryNumber} fulfilled. Order status: ${newOrderStatus}`
      );

      return {
        success: true,
        orderStatus: newOrderStatus,
        fulfillmentStatus: newFulfillmentStatus,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fulfilling delivery:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fulfill delivery" },
      { status: 500 }
    );
  }
}
