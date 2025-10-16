export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertAdmin } from "@/lib/admin"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin()
    const { nextExpectedDate } = await request.json()
    const rec = await prisma.backorder.update({
      where: { id: params.id },
      data: {
        status: "Reminded",
        expectedDate: nextExpectedDate ? new Date(nextExpectedDate) : undefined,
      },
    })
    return NextResponse.json({ ok: true, data: { backorder: rec } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
