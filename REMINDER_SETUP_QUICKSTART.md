# Supplier Reminder Notification System - Quick Start Guide

## What Was Implemented

When you click "Remind Supplier" on a backorder, the system now:

1. ✅ Updates backorder status to "Reminded"
2. 📧 Sends a professional invoice-style email to the supplier's email address
3. 📱 Sends an SMS text message to the supplier's phone number
4. 💬 Shows you which notifications were sent successfully

## Files Created/Modified

### New Files:
- `src/lib/email.ts` - Email service with professional invoice template
- `src/lib/sms.ts` - SMS service (supports Twilio and Semaphore)
- `.env.example` - Environment variables template
- `NOTIFICATION_SETUP.md` - Detailed setup guide

### Modified Files:
- `src/app/api/admin/backorders/[id]/remind/route.ts` - Sends email & SMS
- `src/app/admin/purchase-orders/[id]/page.tsx` - Shows notification status

## Quick Setup (5 minutes)

### Step 1: Choose Your SMS Provider

**Option A: Semaphore (Recommended for Philippines)**
- Best for Philippine phone numbers
- Cheaper rates (~₱1 per SMS)
- Sign up: https://semaphore.co

**Option B: Twilio (International)**
- Works globally
- Higher rates for PH numbers
- Sign up: https://www.twilio.com

### Step 2: Set Up Email (Resend)

1. Sign up at https://resend.com (Free: 100 emails/day)
2. Get API key: https://resend.com/api-keys
3. Add to `.env`:
   ```env
   RESEND_API_KEY="re_your_key_here"
   FROM_EMAIL="noreply@yourdomain.com"
   ```

### Step 3: Set Up SMS

**For Semaphore:**
```env
SEMAPHORE_API_KEY="your_key_here"
SEMAPHORE_SENDER_NAME="UrsalRice"
```

**For Twilio:**
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Testing

1. Go to a Purchase Order with status "Partial"
2. You should see the "Back Orders" section
3. Click "Remind Supplier"
4. Check the alert message to see if email/SMS were sent
5. Check your server console for detailed logs

## What the Email Looks Like

The email includes:
- Orange gradient header with "📦 Backorder Reminder"
- Purchase Order number
- Professional table of pending items
- Quantities and expected dates
- Total amount
- Company contact information
- Professional footer

## What the SMS Looks Like

Example:
```
Hi Juan's Supplies,

Reminder: We're awaiting delivery for PO #abc123.

Pending items: Premium Rice (100 units)

Please confirm delivery status ASAP.

- Ursal Rice Milling
```

## Important Notes

### ✅ It Still Works Without Configuration
- If you don't configure email/SMS, the backorder status will still update
- You'll see warnings in the alert: "⚠️ Email not sent (check configuration)"
- This allows you to test the feature before setting up notifications

### 📋 Supplier Must Have Email/Phone
- Email requires: `supplier.email` field populated
- SMS requires: `supplier.phone` field populated
- Make sure suppliers have these details in the system

### 💰 Cost
- **Email**: FREE (100/day with Resend free tier)
- **SMS**: ~₱1 per message (Semaphore) or $0.05-0.10 USD (Twilio)

## Troubleshooting

**"Email not sent" message:**
1. Check `RESEND_API_KEY` in `.env`
2. Verify domain in Resend dashboard
3. Check server console for errors

**"SMS not sent" message:**
1. Check API keys in `.env`
2. Verify supplier has phone number
3. Ensure phone format is correct (+63 or 0 prefix)
4. Check Semaphore/Twilio account credits

**Backorder section not showing:**
- Make sure PO status is "Partial"
- Check if there are any backorders (some items not fully received)
- Try receiving items partially to create backorders

## Next Steps

1. **Set up your email provider** (Resend recommended)
2. **Set up your SMS provider** (Semaphore for PH, Twilio for international)
3. **Add credentials to .env** (never commit this file!)
4. **Test with a real backorder**
5. **Monitor server logs** to ensure notifications are sending

For detailed setup instructions, see `NOTIFICATION_SETUP.md`

## Support

If you encounter issues:
1. Check server console logs
2. Verify all environment variables are set
3. Test with your own email/phone first
4. Check API provider dashboards for logs
