import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/guard";
import SalesReportClient from "./sales-report-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSalesReportData() {
  // Ensure user is admin
  await assertAdmin();

  // Fetch all orders (excluding cancelled) with items for sales reporting
  // Include: processing, partial, completed, and fulfilled orders
  const orders = await prisma.order.findMany({
    where: {
      status: {
        not: "cancelled",
      },
    },
    include: {
      items: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              isMilledRice: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    orders,
  };
}

export default async function SalesReportPage() {
  const data = await getSalesReportData();

  return (
    <div className="container mx-auto py-6">
      <div className="border-transparent w-full bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5">
        <Suspense fallback={<div>Loading sales report...</div>}>
          <SalesReportClient orders={data.orders} />
        </Suspense>
      </div>
    </div>
  );
}
