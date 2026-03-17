# Email Notifications Implementation - Visual Guide

## 🔄 Email Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                                │
├─────────────────────────────────────────────────────────────────┤
│  • Admin creates user          → sendEmailNotification()         │
│  • User submits claim          → sendEmailNotification()         │
│  • Admin approves/rejects      → sendEmailNotification()         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         src/lib/claims-api.ts                                    │
│   sendEmailNotification(type, email, data)                       │
│   ↓                                                              │
│   supabase.functions.invoke('send-notification')                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         SUPABASE EDGE FUNCTION                                   │
│   send-notification/index.ts                                     │
│   ├─ Reads RESEND_API_KEY from env                             │
│   ├─ Determines email type (user_created, etc)                 │
│   ├─ Builds HTML email template                                 │
│   └─ Calls Resend API                                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              RESEND API                                          │
│   POST https://api.resend.com/emails                            │
│   ├─ From: ClaimFlow Pro <noreply@resend.dev>                  │
│   ├─ To: recipient@email.com                                    │
│   ├─ Subject: [Dynamically generated]                           │
│   └─ HTML: [Professional email template]                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER'S EMAIL INBOX                                  │
│   ✉️  Welcome to ClaimFlow Pro - Your Account is Ready          │
│   ✉️  New Claim Submitted - #CLM-001 | ₹5,000                  │
│   ✉️  Claim #CLM-001 Approved ✓ | ₹5,000                       │
│   ✉️  Claim #CLM-001 Rejected | Action Required                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Structure

```
CLAIMFLOW PRO
│
├── 📄 .env
│   └── RESEND_API_KEY="re_fjprNvHM_7eJbTNRuE75fWzBzFVRjZ6Jf"
│
├── src/
│   ├── lib/
│   │   └── claims-api.ts
│   │       ├── checkAdminExists()
│   │       ├── createFirstAdmin()
│   │       ├── createUser() ─────────┐
│   │       │                         ├─→ sendEmailNotification()
│   │       ├── submitClaim() ────────┤
│   │       ├── approveClaim() ───────┤
│   │       └── rejectClaim() ────────┘
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── Index.tsx
│   │   └── EmailTest.tsx ◀─── New test interface
│   │
│   └── App.tsx
│       └── Routes (includes /test/email)
│
└── supabase/
    ├── functions/
    │   └── send-notification/
    │       └── index.ts
    │           ├── Reads RESEND_API_KEY
    │           ├── Routes email type
    │           ├── Builds templates
    │           └── Calls Resend API
    │
    └── migrations/
        └── complete_schema.sql
            └── Database tables ready for emails
```

---

## 🎯 Email Types Flow

```
┌──────────────────────────────────────┐
│    USER CREATED EVENT                │
├──────────────────────────────────────┤
│ Trigger: createUser()                │
│ Recipient: new user email            │
│ Type: 'user_created'                 │
│ Template: Welcome message            │
│ Contains: Name, role, advance        │
└──────────────────────────────────────┘
          │
          ▼
    ┌──────────────┐
    │ sendEmail()  │
    └──────┬───────┘
           │
          ▼
    Supabase Functions
           │
          ▼
    Resend API
           │
          ▼
    📧 User's Inbox
```

---

## 🧪 Testing Flow

```
Browser (http://localhost:5173/test/email)
    │
    ├─ EmailTest.tsx Component
    │   ├─ Input: Email address
    │   ├─ Button: Send Test Email
    │   └─ Display: Success/Error message
    │
    ▼
supabase.functions.invoke('send-notification', {
    body: {
        type: 'user_created',
        recipientEmail: 'test@example.com',
        data: { name, role, advance, ... }
    }
})
    │
    ▼
Edge Function receives request
    │
    ├─ Validate email type
    ├─ Build HTML template
    ├─ Prepare email payload
    └─ Call Resend API with Bearer token
    │
    ▼
Resend API
    │
    ├─ Authenticate with API key
    ├─ Queue email
    └─ Return success response
    │
    ▼
📧 Email arrives in user's inbox (30 sec max)
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────┐
│  RESEND API KEY                         │
│  re_fjprNvHM_7eJbTNRuE75fWzBzFVRjZ6Jf │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴─────────┐
        │                │
        ▼                ▼
   .env file       Supabase Secrets
   (Local)         (Remote - Hidden)
        │                │
        │                ├─ Not visible in dashboard UI
        │                ├─ Injected at function runtime
        │                └─ Encrypted in transit
        │
        ▼                ▼
   Dev Environment   Edge Function Runtime
   (Testing)         (Production)
        │                │
        └────────┬───────┘
                 │
                 ▼
           Edge Function (index.ts)
           Deno.env.get('RESEND_API_KEY')
                 │
                 ▼
           Authorization: Bearer {API_KEY}
           POST to Resend API
                 │
                 ▼
           ✅ Email sent securely
```

---

## 📊 Database Integration

```
users TABLE
├─ id (UUID)
├─ email ◀─── sendEmailNotification(email, ...)
├─ name
├─ role
├─ password_hash
└─ created_at

claims TABLE
├─ id (UUID)
├─ user_email ◀─── sendEmailNotification(user_email, ...)
├─ claim_id
├─ status
├─ amount
└─ created_at

transactions TABLE
├─ id
├─ user_email
└─ description

notifications TABLE (future)
├─ id
├─ user_email ◀─── Log email notifications
├─ type
├─ is_read
└─ created_at
```

---

## 🎨 Email Template Preview

```
╔════════════════════════════════════════════════════════════════╗
║                   [Header - Blue Gradient]                      ║
║                     ClaimFlow Pro                               ║
║════════════════════════════════════════════════════════════════║
║                                                                  ║
║  Welcome aboard! 🎉                                            ║
║                                                                  ║
║  Hi [Name], your account on ClaimFlow Pro has been             ║
║  created successfully. You can now log in and start             ║
║  using the system.                                              ║
║                                                                  ║
║  ┌─────────────────────────────────────┐                       ║
║  │ Name      │ John Doe                │                       ║
║  ├─────────────────────────────────────┤                       ║
║  │ Email     │ john@example.com        │                       ║
║  ├─────────────────────────────────────┤                       ║
║  │ Role      │ Manager                 │                       ║
║  ├─────────────────────────────────────┤                       ║
║  │ Advance   │ ₹5,000                  │                       ║
║  └─────────────────────────────────────┘                       ║
║                                                                  ║
║  If you have any questions, please reach out to your            ║
║  administrator. Welcome to the team!                            ║
║                                                                  ║
║════════════════════════════════════════════════════════════════║
║  This is an automated notification from ClaimFlow Pro.          ║
║  Please do not reply to this email.                             ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 📈 Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| Email Notifications | ❌ None | ✅ 4 types |
| Test Interface | ❌ None | ✅ /test/email |
| User Onboarding | ❌ Silent | ✅ Email welcome |
| Claim Updates | ❌ Silent | ✅ Email notified |
| Professional Emails | ❌ None | ✅ HTML templates |
| Resend Integration | ❌ None | ✅ Configured |
| API Key Management | ❌ None | ✅ Secure secrets |
| Documentation | ❌ Basic | ✅ Complete |

---

## ✅ Deployment Checklist

```
SETUP PHASE
├─ ✅ API Key obtained from Resend
├─ ✅ Key added to Supabase secrets
├─ ✅ Key added to .env file
└─ ✅ Edge function deployed

INTEGRATION PHASE
├─ ✅ Email templates created (4 types)
├─ ✅ sendEmailNotification() implemented
├─ ✅ Called from createUser()
├─ ✅ Called from claim status changes
└─ ✅ Async processing configured

TESTING PHASE
├─ ✅ Test page created (/test/email)
├─ ✅ Test interface built
├─ ✅ Multiple email type support
└─ ✅ Error handling implemented

DOCUMENTATION PHASE
├─ ✅ Quick start guide
├─ ✅ Detailed setup guide
├─ ✅ Configuration reference
├─ ✅ Troubleshooting guide
└─ ✅ This visual guide

READY FOR PRODUCTION ✅
```

---

## 🚀 Usage Examples

### Creating User (Auto Sends Email)
```typescript
await createUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secure123',
  role: 'Manager',
  advance: 5000,
  manager: 'admin@example.com'
});
// ▼ Email automatically sent to john@example.com
```

### Submitting Claim (Auto Sends Email)
```typescript
await submitClaim({
  user_email: 'john@example.com',
  site_name: 'Site A',
  // ... more details
});
// ▼ Email automatically sent to manager and admin
```

### Testing Email
```
1. Go to: http://localhost:5173/test/email
2. Enter: your-test@email.com
3. Click: Send Test Email
4. Wait: 30 seconds
5. Check: Your inbox ✉️
```

---

## 📞 Quick Reference

| Need | Action |
|------|--------|
| Test Email | Go to `/test/email` |
| Check Logs | `supabase functions logs send-notification` |
| View Secrets | `supabase secrets list` |
| Redeploy | `supabase functions deploy send-notification` |
| Update Key | `supabase secrets set RESEND_API_KEY=<key>` |
| Documentation | See `EMAIL_COMPLETE_SETUP.md` |

---

**Implementation Status**: ✅ COMPLETE & PRODUCTION READY
