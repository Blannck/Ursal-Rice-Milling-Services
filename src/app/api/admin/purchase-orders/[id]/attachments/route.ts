export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertAdmin } from "@/lib/admin"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin()
    const list = await prisma.purchaseOrderAttachment.findMany({
      where: { purchaseOrderId: params.id },
      orderBy: { uploadedAt: "desc" },
    })
    return NextResponse.json({ ok: true, data: { attachments: list } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin()
    const { type, fileName, fileUrl, note } = await request.json()
    if (!fileUrl || !fileName) {
      return NextResponse.json({ ok: false, error: "fileUrl and fileName required" }, { status: 400 })
    }
    const rec = await prisma.purchaseOrderAttachment.create({
      data: { purchaseOrderId: params.id, type: type || "OTHER", fileName, fileUrl, note: note || null },
    })
    return NextResponse.json({ ok: true, data: { attachment: rec } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
