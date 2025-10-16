export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertAdmin } from "@/lib/admin"

export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  try {
    await assertAdmin()
    const txns = await prisma.inventoryTransaction.findMany({
      where: { productId: params.productId },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    return NextResponse.json({ ok: true, data: { transactions: txns } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
