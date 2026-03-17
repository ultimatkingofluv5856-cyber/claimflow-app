# Email System Architecture & Flow Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    React/Vite Frontend                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Page: src/pages/EmailTest.tsx                            │   │
│  │  - Form to enter email & select type                      │   │
│  │  - Calls supabase.functions.invoke()                      │   │
│  │  - Logs: 🔧 debug + 📧 request details                   │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ JSON: {type, recipientEmail, data}       │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Supabase Client: src/integrations/supabase/client.ts    │   │
│  │  - Reads: VITE_SUPABASE_URL                              │   │
│  │  - Reads: VITE_SUPABASE_ANON_KEY                         │   │
│  │  - Creates authenticated SDK instance                    │   │
│  │  - Logs debug info (development mode)                    │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ HTTP POST + Auth Headers                 │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│         Supabase (jluzssnjbwykkhomxomy)                         │
│                                                                   │
│  EDGE FUNCTION: /functions/v1/send-notification                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Handler: supabase/functions/send-notification/index.ts  │   │
│  │  1. Handle CORS preflight (OPTIONS)                      │   │
│  │  2. Validate POST method                                 │   │
│  │  3. Parse JSON body                                      │   │
│  │  4. Validate: type & recipientEmail required            │   │
│  │  5. Load template via emailTemplates.ts                 │   │
│  │  6. Log: ✓ Template selected: {type}                   │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ {from, to, subject, html}                │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Templates: emailTemplates.ts                             │   │
│  │  - user_created        → Welcome email                    │   │
│  │  - claim_submitted     → Claim notification              │   │
│  │  - claim_approved      → Approval notice                 │   │
│  │  - claim_rejected      → Rejection with reason           │   │
│  │  - password_reset      → Reset link email                │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ Bearer Token: RESEND_API_KEY             │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│         Resend Email Service (api.resend.com)                   │
│                                                                   │
│  POST /emails                                                   │
│  Headers: Authorization: Bearer {RESEND_API_KEY}                │
│  Body: {from, to, subject, html}                               │
│                                                                   │
│  Response: {id, created_at}  ✓ Success                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│         Email Inbox                                              │
│                                                                   │
│  From: ClaimFlow <onboarding@resend.dev>                        │
│  To: [user email]                                               │
│  Subject: [Template-specific subject]                           │
│  Body: [Template HTML content]                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Quick Email Test Flow

```
User Opens Browser
    │
    ▼
Enter Email Address in Form
    │
    ▼
Click "Send Test Email" Button
    │
    ├─→ handleTestEmail() called
    │
    ├─→ Validate: email is not empty
    │
    ├─→ Log: 📧 Invoking send-notification function...
    │
    ├─→ Build Request Body:
    │   {
    │     type: 'user_created',
    │     recipientEmail: 'user@example.com',
    │     data: { name, role, advance, ... }
    │   }
    │
    ├─→ Call: supabase.functions.invoke('send-notification', {body})
    │   │
    │   ├─→ Supabase SDK:
    │   │   - Reads VITE_SUPABASE_ANON_KEY from environment
    │   │   - Adds Authorization header
    │   │   - POSTs to Edge Function URL
    │   │
    │   └─→ Response: {data, error}
    │
    ├─→ if error:
    │   ├─→ Log: ❌ Function error
    │   ├─→ Show: Error message to user
    │   └─→ Return
    │
    └─→ if success:
        ├─→ Log: ✅ Success response
        ├─→ Show: "Email sent successfully"
        └─→ Show: "Check inbox in 30 seconds"
```

---

## Environment Variable Flow

```
.env File (Project Root)
│
├─ VITE_SUPABASE_PROJECT_ID="jluzssnjbwykkhomxomy"
│
├─ VITE_SUPABASE_URL="https://jluzssnjbwykkhomxomy.supabase.co"
│
└─ VITE_SUPABASE_ANON_KEY="sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB"
        │
        ▼
    Vite Build Process
        │
        ├─ Reads .env at startup
        ├─ Injects into import.meta.env
        └─ Only VITE_ prefixed vars are available to frontend
        │
        ▼
    src/integrations/supabase/client.ts
        │
        ├─ const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
        ├─ const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
        └─ createClient(SUPABASE_URL, ANON_KEY)
        │
        ▼
    Browser Runtime
        │
        ├─ Supabase SDK initialized
        ├─ Ready to call functions
        └─ Auth headers will be added automatically
```

---

## Request/Response Cycle

### Successful Email Send

```
FRONTEND REQUEST
═══════════════════════════════════════════════════════════════
POST /functions/v1/send-notification
Headers:
  Content-Type: application/json
  Authorization: Bearer sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB
  
Body:
{
  "type": "user_created",
  "recipientEmail": "john@example.com",
  "data": {
    "name": "John Doe",
    "role": "Manager",
    "advance": 5000
  }
}


EDGE FUNCTION PROCESSING
═══════════════════════════════════════════════════════════════
1. ✓ CORS headers validated
2. ✓ POST method confirmed
3. ✓ JSON parsed successfully
4. ✓ Fields validated (type, recipientEmail)
5. ✓ Template loaded: user_created
6. ✓ RESEND_API_KEY found in Supabase secrets
7. ✓ Resend API called with email data
8. ✓ Response received from Resend


SUCCESSFUL RESPONSE
═══════════════════════════════════════════════════════════════
Status: 200 OK
Headers:
  Content-Type: application/json
  Access-Control-Allow-Origin: *

Body:
{
  "success": true,
  "message": "Email sent successfully",
  "id": "12345-67890-abcdef"
}


FRONTEND RECEIVES
═══════════════════════════════════════════════════════════════
const { data, error } = await supabase.functions.invoke(...)

if (!error) {
  ✅ Show success message to user
  ✅ Log response details
  ✅ Clear form
}
```

### Failed Email Send (401)

```
FRONTEND REQUEST
═══════════════════════════════════════════════════════════════
POST /functions/v1/send-notification
Headers:
  Content-Type: application/json
  Authorization: Bearer undefined  ← PROBLEM!
  
Body: {...}


EDGE FUNCTION RESPONSE
═══════════════════════════════════════════════════════════════
Status: 401 Unauthorized
Message: "Missing or invalid authorization"


FRONTEND RECEIVES
═══════════════════════════════════════════════════════════════
const { data, error } = await supabase.functions.invoke(...)

if (error) {
  ❌ error.status = 401
  ❌ error.message = "Missing or invalid authorization"
  ❌ Show error to user
  ❌ Log error details
}


ROOT CAUSE: VITE_SUPABASE_ANON_KEY not loaded in environment
═══════════════════════════════════════════════════════════════
Check:
- .env file exists and has variable
- Dev server restarted (Vite reads .env at startup)
- Variable name starts with VITE_
- No extra spaces or quotes
```

---

## Error Diagnosis Decision Tree

```
Email Test Shows Error?
│
├─ Error: 401 Unauthorized
│  │
│  ├─ Check: import.meta.env.VITE_SUPABASE_ANON_KEY
│  │
│  ├─ Is undefined?
│  │  ├─ YES → Restart dev server: npm run dev
│  │  └─ NO → Check anon key value matches .env
│  │
│  └─ Still 401? → Regenerate key in Supabase dashboard
│
├─ Error: 400 Bad Request
│  │
│  ├─ Check: Request body format
│  │  - Has 'type' field?
│  │  - Has 'recipientEmail' field?
│  │  - Valid email format?
│  │
│  ├─ Check: Type is valid?
│  │  - Valid types: user_created, claim_submitted, claim_approved,
│  │                 claim_rejected, password_reset
│  │
│  └─ Invalid → Update request body and retry
│
├─ Error: 500 Internal Server Error
│  │
│  ├─ Check: Supabase function logs
│  │  - Edge Function → send-notification → Logs
│  │
│  ├─ Common causes:
│  │  - RESEND_API_KEY not set in Supabase Secrets
│  │  - Template error (check emailTemplates.ts)
│  │  - Resend API error (invalid email, rate limit, etc.)
│  │
│  └─ Fix and retry
│
├─ Error: Network/CORS Error
│  │
│  ├─ Check: Browser console shows CORS error?
│  │
│  ├─ Check: Request URL is correct?
│  │  - https://jluzssnjbwykkhomxomy.supabase.co/functions/v1/send-notification
│  │
│  └─ Try: Hard refresh with Ctrl+Shift+R
│
└─ Email Not Received
   │
   ├─ Check: Email sent success (200 status)?
   │
   ├─ Check: Recipient email is correct & valid?
   │
   ├─ Check: Spam/Junk folder
   │
   └─ Check: Sender email (onboarding@resend.dev)
```

---

## Component Dependency Diagram

```
src/main.tsx
    │
    ├─→ src/lib/email-test-helpers.ts  ← Loaded automatically
    │   └─→ Makes testSendEmail() available in browser console
    │
    └─→ App.tsx
        │
        └─→ Router/Pages
            │
            ├─→ src/pages/EmailTest.tsx
            │   │
            │   └─→ src/integrations/supabase/client.ts
            │       │
            │       └─→ @supabase/supabase-js (SDK)
            │           │
            │           └─→ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
            │
            └─→ Other pages
                │
                └─→ Can import & use supabase client
                    │
                    └─→ Can call supabase.functions.invoke()
```

---

## Debugging Tools Overview

```
BROWSER CONSOLE (F12 → Console)
│
├─→ testSendEmail() - Direct test
│   └─ Usage: await testSendEmail('user@ex.com', 'user_created', {...})
│
├─→ quickEmailTests - Pre-configured tests
│   ├─ testUserCreated()
│   ├─ testClaimSubmitted()
│   ├─ testClaimApproved()
│   └─ testClaimRejected()
│
├─→ import.meta.env.VITE_SUPABASE_* - Check variables
│   └─ Run: import.meta.env.VITE_SUPABASE_ANON_KEY
│
└─→ Emoji-prefixed logs
    ├─ 🔧 - Supabase client debug info
    ├─ 📧 - Email invocation details
    ├─ ✅ - Success indicators
    └─ ❌ - Error indicators


NETWORK TAB (F12 → Network)
│
├─→ Filter for: /functions/v1/send-notification
│
├─→ Check:
│   ├─ Method: POST
│   ├─ Status: 200 (success) or error code
│   ├─ Response: JSON with success/error
│   └─ Headers: Authorization, Content-Type, etc.
│
└─→ Preview Response for details


TERMINAL
│
└─→ node validate-email-setup.js
    └─ Verifies: 21 configuration checks
        ✓ All files exist
        ✓ All code present
        ✓ All variables configured
        └─ Status: 21/21 checks passed
```

---

## Integration Points

```
Claims API Integration
src/lib/claims-api.ts
│
├─→ After submitClaim()
│   └─ supabase.functions.invoke('send-notification', {
│       type: 'claim_submitted',
│       recipientEmail: employee.email,
│       data: { claimId, amount, date, ... }
│     })
│
├─→ After approveClaim()
│   └─ supabase.functions.invoke('send-notification', {
│       type: 'claim_approved',
│       recipientEmail: employee.email,
│       data: { claimId, amount, ... }
│     })
│
├─→ After rejectClaim()
│   └─ supabase.functions.invoke('send-notification', {
│       type: 'claim_rejected',
│       recipientEmail: employee.email,
│       data: { claimId, amount, reason, ... }
│     })
│
└─→ After createUser()
    └─ supabase.functions.invoke('send-notification', {
        type: 'user_created',
        recipientEmail: user.email,
        data: { name, role, advance, ... }
      })
```

---

**All diagrams show the complete email system architecture, data flow, and debugging approach.**
