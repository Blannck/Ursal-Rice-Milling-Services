# Supplier Notification System

This document explains how the supplier reminder notification system works when you click the "Remind Supplier" button on backorders.

## Overview

When you click "Remind Supplier" for a backorder, the system will:
1. ✅ Update the backorder status to "Reminded"
2. 📧 Send a professional email invoice-style reminder to the supplier
3. 📱 Send an SMS text message to the supplier's phone number

## Setup Instructions

### 1. Email Setup (Using Resend)

[Resend](https://resend.com) is recommended for Next.js applications and offers 100 free emails per day.

**Steps:**
1. Sign up at https://resend.com
2. Verify your domain or use their testing domain
3. Get your API key from https://resend.com/api-keys
4. Add to your `.env` file:
   ```env
   RESEND_API_KEY="re_your_api_key_here"
   FROM_EMAIL="noreply@yourdomain.com"
   ```

### 2. SMS Setup - Option A: Semaphore (Recommended for Philippines)

[Semaphore](https://semaphore.co) is a Philippine SMS provider with competitive local rates.

**Steps:**
1. Sign up at https://semaphore.co
2. Load credits (approximately ₱1-2 per SMS)
3. Get your API key from the dashboard
4. Add to your `.env` file:
   ```env
   SEMAPHORE_API_KEY="your_semaphore_api_key_here"
   SEMAPHORE_SENDER_NAME="UrsalRice"
   ```

**Pricing:** ~₱1.00 per SMS for Philippine networks

### 2. SMS Setup - Option B: Twilio (International)

[Twilio](https://www.twilio.com) works globally but may have higher rates for Philippine numbers.

**Steps:**
1. Sign up at https://www.twilio.com
2. Get a phone number
3. Get your Account SID and Auth Token from https://console.twilio.com
4. Add to your `.env` file:
   ```env
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="your_auth_token_here"
   TWILIO_PHONE_NUMBER="+1234567890"
   ```

**Note:** The system will try Semaphore first, then fall back to Twilio if Semaphore credentials are not configured.

### 3. Optional: Company Information

Customize the email template by adding these to your `.env`:
```env
COMPANY_NAME="Ursal Rice Milling Services"
COMPANY_EMAIL="info@ursalrice.com"
COMPANY_PHONE="+63 XXX XXX XXXX"
```

## How It Works

### Email Content
The email includes:
- Professional invoice-style layout
- Purchase Order number
- Order date
- Table of pending items with quantities
- Expected delivery dates
- Total order amount
- Company contact information

### SMS Content
The SMS is concise and includes:
- Supplier name
- Purchase Order number
- List of pending items
- Request for delivery confirmation

### Example SMS Message
```
Hi Juan's Supplies,

Reminder: We're awaiting delivery for PO #abc123xyz.

Pending items: Premium Rice (100 units), Jasmine Rice (50 units)

Please confirm delivery status ASAP.

- Ursal Rice Milling
```

## Testing

### Test Email (Without Sending)
You can test the email template generation without actually sending:

```typescript
import { generateBackorderReminderEmail } from '@/lib/email';

const testData = {
  supplierName: "Test Supplier",
  supplierEmail: "test@example.com",
  purchaseOrderId: "PO-12345",
  orderDate: "November 15, 2025",
  items: [
    { productName: "Premium Rice", quantity: 100 }
  ],
  totalAmount: 50000
};

const html = generateBackorderReminderEmail(testData);
console.log(html); // View the generated HTML
```

### Test in Development
1. Use your own email/phone for testing
2. Check the server console logs for status messages:
   - `✅ Email sent successfully`
   - `✅ SMS sent successfully`
   - `⚠️ RESEND_API_KEY not configured` (email disabled)
   - `⚠️ Twilio credentials not configured` (SMS disabled)

## Error Handling

- If email/SMS credentials are not configured, the reminder will still update the backorder status but won't send notifications
- The system logs warnings but doesn't fail the request
- Each notification (email and SMS) is sent independently - one can succeed while the other fails

## Cost Considerations

**Email (Resend):**
- Free tier: 100 emails/day, 3,000/month
- Paid: $20/month for 50,000 emails

**SMS (Semaphore - Philippines):**
- Pay-as-you-go: ~₱1.00 per SMS
- No monthly fees

**SMS (Twilio - International):**
- ~$0.05-0.10 USD per SMS to Philippine numbers
- Monthly phone number fee: ~$1.50/month

## Security Notes

- Never commit `.env` file to Git
- API keys are server-side only (not exposed to clients)
- Use environment variables for all sensitive credentials
- Regularly rotate API keys

## Troubleshooting

**Email not sending:**
1. Check `RESEND_API_KEY` is set correctly
2. Verify domain in Resend dashboard
3. Check server logs for errors

**SMS not sending:**
1. Verify API keys are correct
2. Ensure supplier has a valid phone number
3. Check phone number format (should start with +63 or 0 for PH)
4. Verify Semaphore/Twilio account has credits

**Both email and SMS fail:**
- The backorder status will still update to "Reminded"
- Check server console for specific error messages
- Verify network connectivity from your server
