export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

// POST - Receive items from purchase order into storage locations
export async function POST(request: Request) {
  try {
    await assertAdmin();

    const body = await request.json();
    const { purchaseOrderId, items } = body;

    // Validate request
    if (!purchaseOrderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Purchase Order ID and items are required" },
        { status: 400 }
      );
    }

    // Fetch the purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: {
          include: {
            product: true,
            backorders: true,
          },
        },
        supplier: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: "Purchase order not found" },
        { status: 404 }
      );
    }

    // Process each received item
    const results = [];
    const errors = [];

    for (const receivedItem of items) {
      const { poItemId, locationId, quantity } = receivedItem;

      if (!poItemId || !locationId || !quantity || quantity <= 0) {
        errors.push(`Invalid data for item ${poItemId}`);
        continue;
      }

      // Find the PO item
      const poItem = purchaseOrder.items.find((item) => item.id === poItemId);
      if (!poItem) {
        errors.push(`PO item ${poItemId} not found`);
        continue;
      }

      // Validate location exists
      const location = await prisma.storageLocation.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        errors.push(`Location ${locationId} not found for item ${poItem.product?.name || poItemId}`);
        continue;
      }

      try {
        console.log(`\n📦 Processing receipt: ${poItem.product?.name || 'Unknown'}`);
        console.log(`   Ordered: ${poItem.orderedQty}, Previously Received: ${poItem.receivedQty}, Now Receiving: ${quantity}`);
        
        // Update PO item receivedQty
        const updatedPoItem = await prisma.purchaseOrderItem.update({
          where: { id: poItemId },
          data: {
            receivedQty: poItem.receivedQty + quantity,
          },
        });

        // Update line status based on quantities
        let lineStatus = "Pending";
        if (updatedPoItem.receivedQty >= updatedPoItem.orderedQty) {
          lineStatus = "Completed";
          console.log(`   ✅ Line Status: COMPLETED (${updatedPoItem.receivedQty}/${updatedPoItem.orderedQty})`);
        } else if (updatedPoItem.receivedQty > 0) {
          lineStatus = "Partial";
          console.log(`   ⚠️ Line Status: PARTIAL (${updatedPoItem.receivedQty}/${updatedPoItem.orderedQty}) - BACKORDER: ${updatedPoItem.orderedQty - updatedPoItem.receivedQty}`);
        }

        await prisma.purchaseOrderItem.update({
          where: { id: poItemId },
          data: { lineStatus },
        });

        // Update or create inventory item at location
        const existingInventoryItem = await prisma.inventoryItem.findUnique({
          where: {
            productId_locationId: {
              productId: poItem.productId,
              locationId: locationId,
            },
          },
        });

        if (existingInventoryItem) {
          // Update existing inventory
          const updatedInventory = await prisma.inventoryItem.update({
            where: { id: existingInventoryItem.id },
            data: {
              quantity: existingInventoryItem.quantity + quantity,
            },
          });
          console.log(`   📦 Updated inventory at ${location.name}: ${existingInventoryItem.quantity} + ${quantity} = ${updatedInventory.quantity}`);
        } else {
          // Create new inventory item
          const newInventory = await prisma.inventoryItem.create({
            data: {
              productId: poItem.productId,
              locationId: locationId,
              quantity: quantity,
            },
          });
          console.log(`   📦 Created new inventory at ${location.name}: ${newInventory.quantity}`);
        }

        // Update product stockOnHand
        const updatedProduct = await prisma.product.update({
          where: { id: poItem.productId },
          data: {
            stockOnHand: {
              increment: quantity,
            },
          },
        });
        console.log(`   📊 Product stockOnHand updated: +${quantity} (New total: ${updatedProduct.stockOnHand})`);

        // Create inventory transaction
        await prisma.inventoryTransaction.create({
          data: {
            productId: poItem.productId,
            locationId: locationId,
            kind: "STOCK_IN",
            quantity: quantity,
            unitPrice: poItem.price,
            purchaseOrderId: purchaseOrderId,
            purchaseOrderItemId: poItemId,
            note: `Received from PO: ${purchaseOrder.id} - ${purchaseOrder.supplier.name} - Location: ${location.name}`,
          },
        });

        // Check and update backorders
        const openBackorders = await prisma.backorder.findMany({
          where: {
            purchaseOrderItemId: poItemId,
            status: { in: ["Open", "Partial"] },
          },
        });

        for (const backorder of openBackorders) {
          let backorderStatus = "Open";
          if (updatedPoItem.receivedQty >= updatedPoItem.orderedQty) {
            backorderStatus = "Fulfilled";
          } else if (updatedPoItem.receivedQty > 0) {
            backorderStatus = "Partial";
          }

          await prisma.backorder.update({
            where: { id: backorder.id },
            data: { status: backorderStatus },
          });
        }

        results.push({
          poItemId,
          productName: poItem.product?.name || "Unknown Product",
          quantity,
          location: location.name,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error processing item ${poItemId}:`, error);
        errors.push(`Failed to process ${poItem.product?.name || poItemId}: ${error.message}`);
      }
    }

    // Update purchase order status based on received quantities
    const allItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId },
    });

    const allCompleted = allItems.every((item) => item.receivedQty >= item.orderedQty);
    const anyReceived = allItems.some((item) => item.receivedQty > 0);

    let poStatus: string;
    if (allCompleted) {
      // All items fully received
      poStatus = "Completed";
      console.log(`\n✅ Purchase Order Status: COMPLETED - All items fully received`);
    } else if (anyReceived) {
      // Some items received, some still pending (backorders exist)
      poStatus = "Partial";
      console.log(`\n⚠️ Purchase Order Status: PARTIAL - Some items have backorders`);
    } else {
      // No items received yet, keep as Ordered
      poStatus = "Ordered";
      console.log(`\n📋 Purchase Order Status: ORDERED - No items received yet`);
    }

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: poStatus },
    });

    console.log(`\n📋 Summary: ${results.length} items received successfully${errors.length > 0 ? `, ${errors.length} errors` : ''}\n`);

    // Revalidate paths
    revalidatePath("/admin/purchase-orders");
    revalidatePath(`/admin/purchase-orders/${purchaseOrderId}`);
    revalidatePath("/admin/inventory");

    return NextResponse.json({
      success: true,
      message: `Successfully received ${results.length} items`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      purchaseOrderStatus: poStatus,
    });
  } catch (error: any) {
    console.error("POST /api/admin/stock-in/receive error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to receive stock" },
      { status: 500 }
    );
  }
}
