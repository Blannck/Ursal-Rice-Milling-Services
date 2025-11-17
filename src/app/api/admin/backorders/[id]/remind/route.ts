export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import { sendBackorderReminderEmail } from "@/lib/email";
import { sendBackorderReminderSMS, sendBackorderReminderSMSViaSemaphore } from "@/lib/sms";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();

    let nextExpectedDate: string | null = null;
    try {
      const body = await request.json().catch(() => null);
      nextExpectedDate = body?.nextExpectedDate || null;
    } catch {
      nextExpectedDate = null;
    }

    // Fetch backorder with all related data
    const backorder = await prisma.backorder.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrderItem: {
          include: {
            category: true,
            purchaseOrder: {
              include: {
                supplier: true,
              },
            },
          },
        },
      },
    });

    if (!backorder) {
      return NextResponse.json({ ok: false, error: "Backorder not found" }, { status: 404 });
    }

    const purchaseOrder = backorder.purchaseOrderItem.purchaseOrder;
    const supplier = purchaseOrder.supplier;
    const category = backorder.purchaseOrderItem.category;

    if (!category) {
      return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
    }

    // Update backorder status
    const rec = await prisma.backorder.update({
      where: { id: params.id },
      data: {
        status: "Reminded",
        expectedDate: nextExpectedDate ? new Date(nextExpectedDate) : undefined,
      },
    });

    // Prepare data for email and SMS
    const smsData = {
      supplierName: supplier.name,
      supplierPhone: supplier.phone || "",
      purchaseOrderId: purchaseOrder.id,
      items: [
        {
          categoryName: category.name,
          quantity: backorder.quantity,
        },
      ],
    };

    // Send email and SMS notifications (don't fail if they fail)
    const emailPromise = supplier.email
      ? sendBackorderReminderEmail({
          supplierName: supplier.name,
          supplierEmail: supplier.email,
          purchaseOrderId: purchaseOrder.id,
          orderDate: purchaseOrder.orderDate
            ? new Date(purchaseOrder.orderDate).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : new Date(purchaseOrder.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
          items: [
            {
              categoryName: category.name,
              quantity: backorder.quantity,
              expectedDate: backorder.expectedDate
                ? new Date(backorder.expectedDate).toLocaleDateString("en-PH")
                : undefined,
            },
          ],
          totalAmount: backorder.purchaseOrderItem.price * backorder.quantity,
        }).catch((e) => {
          console.error("Email send failed:", e);
          return false;
        })
      : Promise.resolve(false);

    // Try Semaphore first (Philippine provider), fallback to Twilio
    const smsPromise = sendBackorderReminderSMSViaSemaphore(smsData)
      .catch(() => sendBackorderReminderSMS(smsData))
      .catch((e) => {
        console.error("SMS send failed:", e);
        return false;
      });

    // Wait for both to complete
    const [emailSent, smsSent] = await Promise.all([emailPromise, smsPromise]);

    console.log(`📧 Email sent: ${emailSent}, 📱 SMS sent: ${smsSent}`);

    return NextResponse.json({
      ok: true,
      data: {
        backorder: rec,
        notifications: {
          emailSent,
          smsSent,
        },
      },
    });
  } catch (e: any) {
    console.error("Remind route failed:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
