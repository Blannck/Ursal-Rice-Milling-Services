export const runtime = "nodejs"

import fs from "fs/promises";
import path from "path";
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
    await assertAdmin();

    const contentType = request.headers.get("content-type") || "";

    // New path: multipart image upload
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      const type = (form.get("type") as string) || "OTHER";
      const note = (form.get("note") as string) || null;

      if (!file) {
        return NextResponse.json({ ok: false, error: "file required" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const originalName = file.name || "upload";
      const ext = originalName.includes(".") ? originalName.split(".").pop() : "png";
      const safeExt = (ext || "png").toLowerCase();

      const dir = path.join(process.cwd(), "public", "po_attachments", params.id);
      await fs.mkdir(dir, { recursive: true });

      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
      const filePath = path.join(dir, filename);

      await fs.writeFile(filePath, buffer);

      // Public URL served from /public
      const fileUrl = `/po_attachments/${params.id}/${filename}`;

      const rec = await prisma.purchaseOrderAttachment.create({
        data: {
          purchaseOrderId: params.id,
          type,
          fileName: originalName,
          fileUrl,
          note,
        },
      });

      return NextResponse.json({ ok: true, data: { attachment: rec } });
    }

    const { type, fileName, fileUrl, note } = await request.json();
    if (!fileUrl || !fileName) {
      return NextResponse.json({ ok: false, error: "fileUrl and fileName required" }, { status: 400 });
    }
    const rec = await prisma.purchaseOrderAttachment.create({
      data: { purchaseOrderId: params.id, type: type || "OTHER", fileName, fileUrl, note: note || null },
    });
    return NextResponse.json({ ok: true, data: { attachment: rec } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
