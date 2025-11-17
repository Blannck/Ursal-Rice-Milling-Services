import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    // Build the query filter
    const whereFilter: any = {
      isMilledRice: false // Only show unmilled rice categories (added categories from inventory)
    };
    if (supplierId) {
      whereFilter.supplierId = supplierId;
    }

    const categories = await prisma.category.findMany({
      where: whereFilter,
      include: {
        supplier: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}