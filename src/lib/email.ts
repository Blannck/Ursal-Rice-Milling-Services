/**
 * Email service for sending supplier reminders
 */

export interface BackorderReminderEmailData {
  supplierName: string;
  supplierEmail: string;
  purchaseOrderId: string;
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    expectedDate?: string;
  }>;
  totalAmount?: number;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
}

/**
 * Generate HTML email template for backorder reminder
 */
export function generateBackorderReminderEmail(data: BackorderReminderEmailData): string {
  const {
    supplierName,
    purchaseOrderId,
    orderDate,
    items,
    totalAmount,
    companyName = "Ursal Rice Milling Services",
    companyEmail = "info@ursalrice.com",
    companyPhone = "09995927346",
  } = data;

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
        item.expectedDate || "ASAP"
      }</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Backorder Reminder - Purchase Order ${purchaseOrderId}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                📦 Backorder Reminder
              </h1>
              <p style="margin: 8px 0 0 0; color: #fff3e0; font-size: 14px;">
                Purchase Order: #${purchaseOrderId}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">
                Dear <strong>${supplierName}</strong>,
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                This is a friendly reminder regarding pending items from Purchase Order <strong>#${purchaseOrderId}</strong> 
                placed on <strong>${orderDate}</strong>.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                We are still awaiting the following items:
              </p>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 4px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                    <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Expected Date</th>
                  </tr>
                </thead>
                <tbody style="font-size: 14px; color: #1f2937;">
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          ${
            totalAmount
              ? `
          <!-- Total Amount -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #fef3c7; padding: 16px; border-radius: 4px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Total Order Amount:</strong> ₱${totalAmount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                Please confirm the delivery status and expected arrival date of these items at your earliest convenience.
              </p>
              <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                If you have any questions or concerns, please don't hesitate to contact us.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
                ${companyName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Email: <a href="mailto:${companyEmail}" style="color: #f97316; text-decoration: none;">${companyEmail}</a>
                ${companyPhone ? `<br>Phone: ${companyPhone}` : ""}
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af;">
                This is an automated reminder. Please do not reply to this email directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send email using Resend API
 */
export async function sendBackorderReminderEmail(data: BackorderReminderEmailData): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ursalrice.com";

  if (!RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not configured. Email not sent.");
    return false;
  }

  try {
    const htmlContent = generateBackorderReminderEmail(data);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.supplierEmail,
        subject: `Backorder Reminder - PO #${data.purchaseOrderId}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Resend API error:", result);
      return false;
    }

    console.log("✅ Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
}
