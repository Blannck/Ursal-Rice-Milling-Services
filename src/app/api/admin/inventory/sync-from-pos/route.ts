export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

/**
 * POST - Sync inventory from already received purchase orders
 * This will:
 * 1. Find all PO items with receivedQty > 0
 * 2. Check if inventory exists for those items
 * 3. Create missing inventory items at appropriate locations
 */
export async function POST(request: Request) {
  try {
    await assertAdmin();

    const body = await request.json();
    const { defaultLocationId } = body;

    if (!defaultLocationId) {
      return NextResponse.json(
        { success: false, error: "Default location ID is required" },
        { status: 400 }
      );
    }

    // Verify location exists
    const defaultLocation = await prisma.storageLocation.findUnique({
      where: { id: defaultLocationId },
    });

    if (!defaultLocation) {
      return NextResponse.json(
        { success: false, error: "Default location not found" },
        { status: 404 }
      );
    }

    console.log(`\n🔄 Starting inventory sync from received POs...`);
    console.log(`   Default location: ${defaultLocation.name} (${defaultLocation.type})`);

    // Get all PO items that have been received (receivedQty > 0)
    const receivedPOItems = await prisma.purchaseOrderItem.findMany({
      where: {
        receivedQty: { gt: 0 },
      },
      include: {
        category: true,
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
    });

    console.log(`   Found ${receivedPOItems.length} received PO items to check`);

    const results = [];
    const skipped = [];
    const errors = [];

    for (const poItem of receivedPOItems) {
      try {
        // Check if inventory already exists at any location for this category
        const existingInventory = await prisma.inventoryItem.findMany({
          where: {
            categoryId: poItem.categoryId,
          },
          include: {
            location: true,
          },
        });

        const totalInventoryQty = existingInventory.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        // If inventory quantity matches or exceeds received quantity, skip
        if (totalInventoryQty >= poItem.receivedQty) {
          skipped.push({
            category: poItem.category?.name || "Unknown",
            receivedQty: poItem.receivedQty,
            inventoryQty: totalInventoryQty,
            reason: "Already synced",
          });
          continue;
        }

        // Calculate missing quantity
        const missingQty = poItem.receivedQty - totalInventoryQty;

        console.log(`\n   📦 ${poItem.category?.name || "Unknown"}`);
        console.log(`      Received: ${poItem.receivedQty}, In Inventory: ${totalInventoryQty}, Missing: ${missingQty}`);

        // Check if inventory exists at default location
        const inventoryAtDefault = existingInventory.find(
          (item) => item.locationId === defaultLocationId
        );

        if (inventoryAtDefault) {
          // Update existing inventory at default location
          const updated = await prisma.inventoryItem.update({
            where: { id: inventoryAtDefault.id },
            data: {
              quantity: inventoryAtDefault.quantity + missingQty,
            },
          });

          console.log(`      ✅ Updated inventory at ${defaultLocation.name}: ${inventoryAtDefault.quantity} + ${missingQty} = ${updated.quantity}`);

          results.push({
            category: poItem.category?.name || "Unknown",
            action: "updated",
            location: defaultLocation.name,
            previousQty: inventoryAtDefault.quantity,
            addedQty: missingQty,
            newQty: updated.quantity,
          });
        } else {
          // Create new inventory at default location
          const created = await prisma.inventoryItem.create({
            data: {
              categoryId: poItem.categoryId,
              locationId: defaultLocationId,
              quantity: missingQty,
            },
          });

          console.log(`      ✅ Created inventory at ${defaultLocation.name}: ${created.quantity}`);

          results.push({
            category: poItem.category?.name || "Unknown",
            action: "created",
            location: defaultLocation.name,
            addedQty: missingQty,
            newQty: created.quantity,
          });
        }

        // Update category stockOnHand if needed
        const category = await prisma.category.findUnique({
          where: { id: poItem.categoryId },
        });

        if (category) {
          // Calculate what stockOnHand should be
          const expectedStockOnHand = totalInventoryQty + missingQty;

          if (category.stockOnHand !== expectedStockOnHand) {
            await prisma.category.update({
              where: { id: poItem.categoryId },
              data: {
                stockOnHand: expectedStockOnHand,
              },
            });

            console.log(`      📊 Updated category stockOnHand: ${category.stockOnHand} → ${expectedStockOnHand}`);
          }
        }

        // Create transaction record for audit trail
        await prisma.inventoryTransaction.create({
          data: {
            categoryId: poItem.categoryId,
            locationId: defaultLocationId,
            kind: "STOCK_IN",
            quantity: missingQty,
            unitPrice: poItem.price,
            purchaseOrderId: poItem.purchaseOrderId,
            purchaseOrderItemId: poItem.id,
            note: `Synced from PO: ${poItem.purchaseOrder.id} - ${poItem.purchaseOrder.supplier.name} (Auto-sync)`,
          },
        });
      } catch (error: any) {
        console.error(`      ❌ Error syncing ${poItem.category?.name}:`, error);
        errors.push({
          category: poItem.category?.name || "Unknown",
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Sync completed:`);
    console.log(`   - Created/Updated: ${results.length} items`);
    console.log(`   - Skipped (already synced): ${skipped.length} items`);
    console.log(`   - Errors: ${errors.length} items\n`);

    // Revalidate inventory page
    revalidatePath("/admin/inventory");

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${results.length} inventory items`,
      results,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        processed: receivedPOItems.length,
        synced: results.length,
        skipped: skipped.length,
        errors: errors.length,
      },
    });
  } catch (error: any) {
    console.error("POST /api/admin/inventory/sync-from-pos error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync inventory" },
      { status: 500 }
    );
  }
}
