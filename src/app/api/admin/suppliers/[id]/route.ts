export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
          }
        },
      },
    });
    
    if (!supplier) {
      return NextResponse.json({ ok: false, error: "Supplier not found" }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true, data: supplier });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    const { name, email, phone, address, note, isActive, productIds } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name Required" }, { status: 400 });
    }

    // Update supplier
    const updated = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        note: note?.trim() || null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    // Handle product associations if provided
    if (productIds && Array.isArray(productIds)) {
      // First, remove this supplier from all products that were previously associated
      await prisma.product.updateMany({
        where: {
          supplierId: params.id,
        },
        data: {
          supplierId: null,
        },
      });

      // Then associate the newly selected products
      if (productIds.length > 0) {
        await prisma.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            supplierId: params.id,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    
    // First, remove supplier association from products
    await prisma.product.updateMany({
      where: {
        supplierId: params.id,
      },
      data: {
        supplierId: null,
      },
    });

    // Then delete the supplier
    const deleted = await prisma.supplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true, data: deleted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500 });
  }
}