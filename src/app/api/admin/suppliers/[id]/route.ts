export const runtime = "nodejs";

import { NextResponse  } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";


export async function GET(_req: Request, { params }:  { params: { id: string } }) {
  try {
    await assertAdmin();
    const row = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!row) return NextResponse.json({ ok: false, error: "Not Found" }, { status: 404});
    return NextResponse.json({ ok: true, data: row});
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500});
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  try {
    await assertAdmin();
    const body = await req.json();
    const { name, email, phone, address, note, isActive } = body;

    const updated = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(phone !== undefined? { phone: phone?.trim() || null }: {}),
        ...(address !== undefined ? { address: address?.trim() || null } : {}),
        ...(note !== undefined ? { note: note?.trim() || null } : {}),
        ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500})
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string} }) {
  try {
    await assertAdmin();
    await prisma.supplier.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500});
  }
}