export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET() {
  try {
    await assertAdmin();
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, data: suppliers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req: Request) {
  try {
    await assertAdmin();
    const { name, email, phone, address, note, isActive, productIds } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name Required" }, { status: 400 });
    }

    // Create supplier first
    const created = await prisma.supplier.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        note: note?.trim() || null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    // Associate products if any were selected
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      await prisma.product.updateMany({
        where: {
          id: {
            in: productIds,
          },
        },
        data: {
          supplierId: created.id,
        },
      });
    }

    return NextResponse.json({ ok: true, data: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500 });
  }
}