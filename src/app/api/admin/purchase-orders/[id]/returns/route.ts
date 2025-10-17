export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertAdmin } from "@/lib/admin"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin()
    const { reason, items = [] } = await request.json()

    const result = await prisma.$transaction(async (tx) => {
      const ret = await tx.purchaseReturn.create({
        data: { purchaseOrderId: params.id, reason: reason || null },
      })

      for (const it of items) {
        const poi = await tx.purchaseOrderItem.findUnique({ 
          where: { id: it.purchaseOrderItemId },
          include: { product: true }
        })
        if (!poi) throw new Error("PO line not found")
        if (!poi.product) throw new Error("Product not found for PO line")
        
        const maxReturnable = poi.receivedQty - poi.returnedQty
        const qty = Math.max(0, Math.min(maxReturnable, Number(it.quantity) || 0))
        if (qty <= 0) continue

        console.log(`\n📤 Processing return for ${poi.product.name}: ${qty} units`)

        // ✅ DEDUCT FROM INVENTORY LOCATIONS (LIFO - Last In, First Out)
        // Returns should remove most recently received stock first
        let remainingToReturn = qty

        // Get inventory items for this product (LIFO: newest first)
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            productId: poi.productId,
            quantity: { gt: 0 },
          },
          include: { location: true },
          orderBy: { createdAt: 'desc' }, // LIFO - newest first
        })

        if (inventoryItems.length === 0) {
          throw new Error(`No inventory available to return for ${poi.product.name}`)
        }

        // Check if we have enough total stock
        const totalAvailable = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0)
        if (totalAvailable < remainingToReturn) {
          throw new Error(
            `Insufficient stock to return for ${poi.product.name}. Available: ${totalAvailable}, Needed: ${remainingToReturn}`
          )
        }

        // Deduct from inventory locations (LIFO)
        for (const inventoryItem of inventoryItems) {
          if (remainingToReturn <= 0) break

          const toDeduct = Math.min(inventoryItem.quantity, remainingToReturn)

          // Update inventory item
          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantity: inventoryItem.quantity - toDeduct },
          })

          // Create RETURN_OUT transaction per location
          await tx.inventoryTransaction.create({
            data: {
              productId: poi.productId,
              locationId: inventoryItem.locationId,
              kind: "RETURN_OUT",
              quantity: toDeduct,
              unitPrice: poi.price,
              purchaseOrderId: params.id,
              purchaseReturnId: ret.id,
              note: `${reason || "Returned to supplier"} - PO #${params.id.slice(0, 8)}`,
            },
          })

          console.log(`   ✅ Deducted ${toDeduct} from ${inventoryItem.location.name} (LIFO)`)

          remainingToReturn -= toDeduct
        }

        // Create purchase return item record
        await tx.purchaseReturnItem.create({
          data: {
            purchaseReturnId: ret.id,
            purchaseOrderItemId: poi.id,
            quantity: qty,
            note: it.note || null,
          },
        })

        // Update PO item returned quantity
        await tx.purchaseOrderItem.update({
          where: { id: poi.id },
          data: { returnedQty: { increment: qty } },
        })

        // Update product stockOnHand
        await tx.product.update({
          where: { id: poi.productId },
          data: { stockOnHand: { decrement: qty } },
        })

        console.log(`   📊 Product stockOnHand decreased by ${qty}`)
        console.log(`   🎉 Return completed successfully!\n`)
      }

      return { ok: true, purchaseReturnId: ret.id }
    })

    // Revalidate relevant pages
    revalidatePath("/admin/purchase-orders")
    revalidatePath(`/admin/purchase-orders/${params.id}`)
    revalidatePath("/admin/inventory")
    revalidatePath("/admin/transactions")

    return NextResponse.json({ ok: true, success: true, data: result })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e.message || "Failed to create return" }, { status: 500 })
  }
}
