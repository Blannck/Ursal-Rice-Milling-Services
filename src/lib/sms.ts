/**
 * SMS service for sending supplier reminders
 */

export interface BackorderReminderSMSData {
  supplierName: string;
  supplierPhone: string;
  purchaseOrderId: string;
  items: Array<{
    categoryName: string;
    quantity: number;
  }>;
  companyName?: string;
}

/**
 * Generate SMS message for backorder reminder
 */
export function generateBackorderReminderSMS(data: BackorderReminderSMSData): string {
  const { supplierName, purchaseOrderId, items, companyName = "Ursal Rice Milling" } = data;

  const itemsList = items
    .map((item) => `${item.categoryName} (${item.quantity} units)`)
    .join(", ");

  return `
Hi ${supplierName},

Reminder: We're awaiting delivery for PO #${purchaseOrderId}.

Pending items: ${itemsList}

Please confirm delivery status ASAP.

- ${companyName}
`.trim();
}

/**
 * Send SMS using Twilio API
 */
export async function sendBackorderReminderSMS(data: BackorderReminderSMSData): Promise<boolean> {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("⚠️ Twilio credentials not configured. SMS not sent.");
    return false;
  }

  if (!data.supplierPhone) {
    console.warn("⚠️ Supplier phone number not available. SMS not sent.");
    return false;
  }

  try {
    const message = generateBackorderReminderSMS(data);

    // Format phone number (ensure it starts with +63 for Philippines)
    let phoneNumber = data.supplierPhone.replace(/\s/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "+63" + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith("+")) {
      phoneNumber = "+63" + phoneNumber;
    }

    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Twilio API error:", result);
      return false;
    }

    console.log("✅ SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
    return false;
  }
}

/**
 * Alternative: Send SMS using Semaphore (Philippine SMS provider)
 */
export async function sendBackorderReminderSMSViaSemaphore(data: BackorderReminderSMSData): Promise<boolean> {
  const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY;
  const SEMAPHORE_SENDER_NAME = process.env.SEMAPHORE_SENDER_NAME || "UrsalRice";

  if (!SEMAPHORE_API_KEY) {
    console.warn("⚠️ Semaphore API key not configured. SMS not sent.");
    return false;
  }

  if (!data.supplierPhone) {
    console.warn("⚠️ Supplier phone number not available. SMS not sent.");
    return false;
  }

  try {
    const message = generateBackorderReminderSMS(data);

    // Format phone number for Semaphore (Philippine format)
    let phoneNumber = data.supplierPhone.replace(/\s/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "63" + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith("+63")) {
      phoneNumber = phoneNumber.substring(1);
    }

    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        apikey: SEMAPHORE_API_KEY,
        number: phoneNumber,
        message: message,
        sendername: SEMAPHORE_SENDER_NAME,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error("❌ Semaphore API error:", result);
      return false;
    }

    console.log("✅ SMS sent successfully via Semaphore:", result);
    return true;
  } catch (error) {
    console.error("❌ Failed to send SMS via Semaphore:", error);
    return false;
  }
}
