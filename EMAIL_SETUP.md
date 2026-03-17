# Email Notifications Setup - Resend Integration

## Overview
Email notifications have been integrated into ClaimFlow Pro using **Resend** - a modern transactional email service for developers.

## Setup Details

### API Key Configuration
- **Resend API Key**: `re_fjprNvHM_7eJbTNRuE75fWzBzFVRjZ6Jf`
- **Location**: Added to Supabase secrets and `.env` file
- **Status**: ✅ Deployed and active

### How It Works

1. **Edge Function**: Supabase Edge Function (`send-notification`) handles all email sending
2. **Database Triggers**: When certain events occur, emails are automatically sent
3. **Async Processing**: Emails are sent asynchronously without blocking the app

### Email Events

The system automatically sends emails for:

#### 1. **User Created**
- **Trigger**: When admin creates a new user
- **Recipients**: The newly created user
- **Content**: Welcome message with account details (name, email, role, advance amount)

#### 2. **Claim Submitted**
- **Trigger**: When a user submits an expense claim
- **Recipients**: Manager and Admin
- **Content**: Claim details (ID, amount, site, date, status)

#### 3. **Claim Approved**
- **Trigger**: When manager or admin approves a claim
- **Recipients**: The claim submitter
- **Content**: Approval confirmation with amount and approval date

#### 4. **Claim Rejected**
- **Trigger**: When manager or admin rejects a claim
- **Recipients**: The claim submitter
- **Content**: Rejection details with reason and next steps

## Testing Email Notifications

### Method 1: Test Page (Recommended)
Access the email test page at: **`http://localhost:5173/test/email`**

1. Open the test page in your browser
2. Enter any email address you want to test with
3. Click "Send Test Email"
4. You'll receive a test email in the format used for user account creation

### Method 2: Direct API Call
Use the Supabase client to invoke the function:

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    type: 'user_created',
    recipientEmail: 'test@example.com',
    data: {
      name: 'John Doe',
      role: 'Manager',
      advance: 5000,
      companyName: 'ClaimFlow Pro',
      currencySymbol: '₹',
    },
  },
});
```

### Available Email Types

- `user_created` - New user account created
- `claim_submitted` - New claim submitted
- `claim_approved` - Claim approved
- `claim_rejected` - Claim rejected

## Email Templates

All emails include:
- ✅ Company branding and logo (if configured)
- ✅ Professional HTML formatting
- ✅ Clear visual hierarchy
- ✅ Action details in organized tables
- ✅ Call-to-action instructions
- ✅ Professional footer

## Configuration

### Current Settings
- **Service**: Resend (via Supabase Edge Functions)
- **From Address**: Uses company settings (noreply@company.com)
- **Currency**: Configured per company settings
- **Notifications Enabled**: Yes (default)

### Modifying Email Templates
Edit the `send-notification/index.ts` file in `supabase/functions/`:
- Change email content and styling
- Add new email types
- Modify subject lines and body text

### Disabling Notifications
Set in company settings or disable via app configuration.

## Troubleshooting

### Email Not Sending?
1. Check that API key is correctly set in Supabase secrets
2. Verify recipient email is valid
3. Check Supabase function logs in the dashboard
4. Ensure email notifications are enabled in company settings

### Check Logs
```bash
supabase functions logs send-notification
```

### Verify API Key
```bash
supabase secrets list
```

## Next Steps

1. ✅ Test email sending via test page
2. ✅ Create first admin account (will receive welcome email)
3. ✅ Create users (they will receive welcome emails)
4. ✅ Submit claims (managers will receive notification emails)

## Support
For issues with Resend service, visit: https://resend.com/docs
