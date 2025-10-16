export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertAdmin } from "@/lib/admin"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin()
    const { reason, items = [] } = await request.json()

    const result = await prisma.$transaction(async (tx) => {
      const ret = await tx.purchaseReturn.create({
        data: { purchaseOrderId: params.id, reason: reason || null },
      })

      for (const it of items) {
        const poi = await tx.purchaseOrderItem.findUnique({ where: { id: it.purchaseOrderItemId } })
        if (!poi) throw new Error("PO line not found")
        const maxReturnable = poi.receivedQty - poi.returnedQty
        const qty = Math.max(0, Math.min(maxReturnable, Number(it.quantity) || 0))
        if (qty <= 0) continue

        await tx.purchaseReturnItem.create({
          data: {
            purchaseReturnId: ret.id,
            purchaseOrderItemId: poi.id,
            quantity: qty,
            note: it.note || null,
          },
        })

        await tx.purchaseOrderItem.update({
          where: { id: poi.id },
          data: { returnedQty: { increment: qty } },
        })

        await tx.product.update({
          where: { id: poi.productId },
          data: { stockOnHand: { decrement: qty } },
        })

        await tx.inventoryTransaction.create({
          data: {
            productId: poi.productId,
            kind: "RETURN_OUT",
            quantity: qty,
            unitPrice: poi.price,
            purchaseOrderId: params.id,
            purchaseReturnId: ret.id,
            note: reason || "Returned to supplier",
          },
        })
      }

      return { ok: true, purchaseReturnId: ret.id }
    })

    return NextResponse.json({ ok: true, success: true, data: result })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e.message || "Failed to create return" }, { status: 500 })
  }
}
