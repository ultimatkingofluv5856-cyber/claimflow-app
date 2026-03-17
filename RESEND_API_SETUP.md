# Email Notifications - Resend API Setup

## Problem
Claims are being submitted successfully but **no email notifications are being sent** because the Resend API key is not configured in Supabase.

## Solution: Configure Resend API Key in Supabase

### Step 1: Get Your Resend API Key

1. Go to https://resend.com/
2. Sign in (or create a free account)
3. Go to **API Keys** section
4. Copy your API key (starts with `re_`)

### Step 2: Add API Key to Supabase

1. Go to https://app.supabase.com/
2. Select your project
3. Click **Settings** on the left sidebar
4. Click **Secrets & Credentials** (or **Environment Variables** depending on your version)
5. Click **New Secret**
6. Set:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Paste your Resend API key (e.g., `re_XXXXXXXXXXXXXXXX`)
7. Click **Save**

### Step 3: Verify the Configuration

**Option A: Test from Browser Console**

1. Open the app at http://localhost:8081/
2. Open DevTools (F12) and go to **Console** tab
3. Run this command:

```javascript
await testSendEmail('your-email@example.com', 'claim_submitted', {
  employeeName: 'John Doe',
  claimAmount: 5000,
  claimDate: new Date().toLocaleDateString(),
  description: 'Test claim',
  claimId: 'CLM-001',
  companyName: 'ClaimFlow Pro',
})
```

4. Look for one of these responses:
   - ✅ **Success**: `{ success: true, id: '...', message: '...' }`
   - ❌ **Failure**: `{ success: false, error: '...' }`

**Option B: Submit an Actual Claim**

1. Log in to the app
2. Go to "Submit New Claim"
3. Fill out the form and submit
4. Open browser console (F12)
5. Look for logs like:
   - 📧 `Sending email: { recipientEmail: '...', type: 'claim_submitted' }`
   - ✅ `Email sent successfully: id_xxxx`

### Expected Email Content

When emails are sent successfully, you'll receive emails with:

- **claim_submitted**: 
  - Subject: "New Claim Submitted"
  - Contains: Employee name, claim amount, date, description
  - Shows when manager approval is needed

- **claim_approved**:
  - Subject: "Claim Approved"
  - Sent to employee when claim is approved
  - Shows final status and amount

- **claim_rejected**:
  - Subject: "Claim Rejected"
  - Sent to employee with rejection reason
  - Option to resubmit if needed

- **password_reset**:
  - Subject: "Password Reset Request"
  - Contains clickable reset link
  - 1-hour expiration notice

### Troubleshooting

**Email still not sending?**

1. **Check the Edge Function logs**:
   - Go to Supabase Dashboard → Functions
   - Click `send-notification`
   - Check the Logs tab
   - Look for error messages about API key

2. **Verify API Key is correct**:
   - Get a fresh key from https://resend.com/api-keys
   - Make sure you copied the entire key (usually ~30+ characters)
   - No extra spaces

3. **Check Email Domain**:
   - Make sure you're sending FROM an allowed domain in Resend
   - Currently using: `ClaimFlow <onboarding@resend.dev>`
   - For production, configure your domain in Resend

4. **Check Resend Dashboard**:
   - Go to https://resend.com/emails
   - Look for failed deliveries
   - Check the error message (e.g., "Authentication failed")

### Optional: Use Real Domain in Production

If you want to send from your own domain (not `onboarding@resend.dev`):

1. In Resend Dashboard, add your domain under **Domains**
2. Update the sender in `supabase/functions/send-notification/index.ts`:
   ```typescript
   from: 'ClaimFlow <noreply@yourdomain.com>',
   ```

### Questions?

- **Resend Support**: https://resend.com/docs
- **Supabase Secrets**: https://supabase.com/docs/guides/functions/secrets
- **Edge Function Logs**: Check Supabase Dashboard → Functions → send-notification → Logs

---

Once the API key is set up, all notifications will be sent automatically:
- ✅ When user is created
- ✅ When claim is submitted
- ✅ When claim is approved
- ✅ When claim is rejected
- ✅ When password reset is requested
