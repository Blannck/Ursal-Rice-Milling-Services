export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    const { lines = [], note } = await request.json();

    // Get location from first line item, or find first warehouse as fallback
    const requestedLocationId = lines[0]?.locationId;
    
    let targetLocation;
    if (requestedLocationId) {
      targetLocation = await prisma.storageLocation.findUnique({
        where: { id: requestedLocationId },
      });
      
      if (!targetLocation || !targetLocation.isActive) {
        return NextResponse.json(
          { ok: false, error: "Selected location not found or inactive" },
          { status: 400 }
        );
      }
    } else {
      // Fallback to first warehouse if no location specified
      targetLocation = await prisma.storageLocation.findFirst({
        where: {
          type: "WAREHOUSE",
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      });

      if (!targetLocation) {
        return NextResponse.json(
          { ok: false, error: "No warehouse location found. Please create a warehouse first." },
          { status: 400 }
        );
      }
    }

    console.log(`\n📦 Inline receive to: ${targetLocation.name} (${targetLocation.type})\n`);

    const result = await prisma.$transaction(async (tx) => {
      for (const l of lines) {
        const poi = await tx.purchaseOrderItem.findUnique({ 
          where: { id: l.purchaseOrderItemId },
          include: { product: true }
        })
        if (!poi) throw new Error("PO line not found")

        const remaining = poi.orderedQty - poi.receivedQty
        const receivedNow = Math.max(0, Math.min(remaining, Number(l.receivedNow) || 0))
        if (receivedNow > 0) {
          console.log(`   📦 ${poi.product?.name || "Unknown"}: Ordered ${poi.orderedQty}, Previously Received ${poi.receivedQty}, Now Receiving ${receivedNow}`);
          
          await tx.purchaseOrderItem.update({
            where: { id: poi.id },
            data: {
              receivedQty: { increment: receivedNow },
              lineStatus: poi.receivedQty + receivedNow >= poi.orderedQty ? "Completed" : "Partial",
            },
          })

          // ✅ CREATE OR UPDATE INVENTORY ITEM AT SELECTED LOCATION
          const existingInventory = await tx.inventoryItem.findUnique({
            where: {
              productId_locationId: {
                productId: poi.productId,
                locationId: targetLocation.id,
              },
            },
          });

          if (existingInventory) {
            const updated = await tx.inventoryItem.update({
              where: { id: existingInventory.id },
              data: {
                quantity: existingInventory.quantity + receivedNow,
              },
            });
            console.log(`   ✅ Updated inventory at ${targetLocation.name}: ${existingInventory.quantity} + ${receivedNow} = ${updated.quantity}`);
          } else {
            const created = await tx.inventoryItem.create({
              data: {
                productId: poi.productId,
                locationId: targetLocation.id,
                quantity: receivedNow,
              },
            });
            console.log(`   ✅ Created inventory at ${targetLocation.name}: ${created.quantity}`);
          }

          let remainingToApply = receivedNow;
if (remainingToApply > 0) {
  const openBackorders = await tx.backorder.findMany({
    where: { purchaseOrderItemId: poi.id, status: { in: ["Open", "Reminded"] } },
    orderBy: { createdAt: "asc" }, // FIFO-ish
  });

  for (const bo of openBackorders) {
    if (remainingToApply <= 0) break;
    const take = Math.min(bo.quantity, remainingToApply);

    // reduce this backorder
    await tx.backorder.update({
      where: { id: bo.id },
      data: { quantity: bo.quantity - take },
    });

    remainingToApply -= take;


    if (bo.quantity - take <= 0) {
      await tx.backorder.update({
        where: { id: bo.id },
        data: { status: "Closed" },
      });
    }
  }
}

const fullyReceived = poi.receivedQty + receivedNow >= poi.orderedQty;
if (fullyReceived) {
  await tx.backorder.updateMany({
    where: { purchaseOrderItemId: poi.id, status: { in: ["Open", "Reminded"] } },
    data: { status: "Closed", quantity: 0 },
  });
}


          await tx.product.update({
            where: { id: poi.productId },
            data: {
              stockOnHand: { increment: receivedNow },
              stockOnOrder: { decrement: receivedNow },
            },
          })
          
          console.log(`   📊 Product stockOnHand updated: +${receivedNow}`);

          await tx.inventoryTransaction.create({
            data: {
              productId: poi.productId,
              locationId: targetLocation.id,
              kind: "STOCK_IN",
              quantity: receivedNow,
              unitPrice: poi.price,
              purchaseOrderId: params.id,
              purchaseOrderItemId: poi.id,
              note: note || `Received inline to ${targetLocation.name}`,
            },
          })
        }

        const short = remaining - receivedNow
        console.log(`   ⚠️  Remaining to receive: ${short} units`);
        
        if (short > 0) {
          const existing = await tx.backorder.findFirst({
            where: { purchaseOrderItemId: poi.id, status: "Open" },
          })
          if (existing) {
            console.log(`   📝 Updating existing backorder: ${existing.quantity} + ${short} = ${existing.quantity + short}`);
            await tx.backorder.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity + short,
                expectedDate: l.expectedDate ? new Date(l.expectedDate) : existing.expectedDate,
              },
            })
          } else {
            console.log(`   🆕 Creating new backorder for ${short} units`);
            await tx.backorder.create({
              data: {
                purchaseOrderItemId: poi.id,
                quantity: short,
                expectedDate: l.expectedDate ? new Date(l.expectedDate) : null,
              },
            })
          }
          await tx.purchaseOrderItem.update({
            where: { id: poi.id },
            data: { lineStatus: "Backordered" },
          })
        }
      }

      const linesNow = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: params.id } })
      const allReceived = linesNow.every(x => x.receivedQty >= x.orderedQty)
      const anyReceived = linesNow.some(x => x.receivedQty > 0)
      
      let newStatus: string;
      if (allReceived) {
        newStatus = "Completed";
        console.log(`\n✅ PO Status: COMPLETED`);
      } else if (anyReceived) {
        newStatus = "Partial";
        console.log(`\n⚠️ PO Status: PARTIAL`);
      } else {
        newStatus = "Ordered";
        console.log(`\n📋 PO Status: ORDERED`);
      }

      await tx.purchaseOrder.update({
        where: { id: params.id },
        data: { status: newStatus },
      })

      return true
    })

    
const backorders = await prisma.backorder.findMany({
  where: {
    purchaseOrderItem: { purchaseOrderId: params.id },
    status: { in: ["Open", "Reminded"] },
  },
  include: {
    purchaseOrderItem: { include: { product: true } },
  },
  orderBy: { createdAt: "desc" },
});

console.log(`\n✅ Inline receive completed\n`);

// Revalidate paths to refresh data
revalidatePath("/admin/purchase-orders");
revalidatePath(`/admin/purchase-orders/${params.id}`);
revalidatePath("/admin/inventory");

return NextResponse.json({ ok: true, data: { backorders } });

    return NextResponse.json({ ok: true, success: true, data: { updated: result } })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e.message || "Failed to receive" }, { status: 500 })
  }
}
