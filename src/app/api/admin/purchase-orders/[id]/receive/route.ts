export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertAdmin } from "@/lib/admin"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin()
    const { lines = [], note } = await request.json()

    const result = await prisma.$transaction(async (tx) => {
      for (const l of lines) {
        const poi = await tx.purchaseOrderItem.findUnique({ where: { id: l.purchaseOrderItemId } })
        if (!poi) throw new Error("PO line not found")

        const remaining = poi.orderedQty - poi.receivedQty
        const receivedNow = Math.max(0, Math.min(remaining, Number(l.receivedNow) || 0))
        if (receivedNow > 0) {
          await tx.purchaseOrderItem.update({
            where: { id: poi.id },
            data: {
              receivedQty: { increment: receivedNow },
              lineStatus: poi.receivedQty + receivedNow >= poi.orderedQty ? "Received" : "PartiallyReceived",
            },
          })

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

          await tx.inventoryTransaction.create({
            data: {
              productId: poi.productId,
              kind: "STOCK_IN",
              quantity: receivedNow,
              unitPrice: poi.price,
              purchaseOrderId: params.id,
              purchaseOrderItemId: poi.id,
              note: note || "Receiving",
            },
          })
        }

        const short = remaining - receivedNow
        if (short > 0) {
          const existing = await tx.backorder.findFirst({
            where: { purchaseOrderItemId: poi.id, status: "Open" },
          })
          if (existing) {
            await tx.backorder.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity + short,
                expectedDate: l.expectedDate ? new Date(l.expectedDate) : existing.expectedDate,
              },
            })
          } else {
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
      

      await tx.purchaseOrder.update({
        where: { id: params.id },
        data: { status: allReceived ? "Received" : anyReceived ? "Ordered" : "Pending" },
      })

      return true
    })

    return NextResponse.json({ ok: true, success: true, data: { updated: result } })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e.message || "Failed to receive" }, { status: 500 })
  }
}
