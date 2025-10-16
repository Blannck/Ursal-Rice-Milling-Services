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
    const body = await req.json();
    const { name, email, phone, address, note, isActive, productIds } = body;

    // Check if supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Build update data object (only include fields that are provided)
    const updateData: any = {};
    
    // Only validate and update name if it's provided
    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Name Required" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    
    // Only update other fields if they're provided
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (note !== undefined) updateData.note = note?.trim() || null;
    
    // Handle isActive toggle - this is the key for activate/deactivate
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    // Update supplier with only the provided fields
    const updated = await prisma.supplier.update({
      where: { id: params.id },
      data: updateData,
    });

    // Handle product associations only if productIds is provided
    if (productIds !== undefined && Array.isArray(productIds)) {
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