import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: {
      id: params.orderId,
    },
    include: {
      items: {
        include: {
          category: true,
        },
      },
      deliveries: {
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          deliveryNumber: 'asc',
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Redirect to customer-orders page with the order pre-selected
  // Since manage-orders-client uses a dialog/modal system, we redirect back to the main page
  redirect(`/admin/customer-orders?orderId=${params.orderId}`);
}
