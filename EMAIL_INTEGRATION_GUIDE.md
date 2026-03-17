# Email Notification System - Frontend Integration Guide

## ✅ Latest Update: Direct Fetch Implementation

The email system now uses **direct `fetch()` calls** instead of `supabase.functions.invoke()` to completely bypass Supabase's authentication layer. This ensures reliable email sending even without active user sessions.

### New Email Utility Module
**File:** `src/lib/send-email.ts`

Provides type-safe helper functions:
```typescript
// Direct generic function
await sendEmail(email, 'user_created', { name: 'John' });

// Or use specific helpers
await sendWelcomeEmail(email, name, role, advance);
await sendClaimSubmittedEmail(email, employeeName, amount, date, description, claimId);
await sendClaimApprovedEmail(email, employeeName, amount, claimId);
await sendClaimRejectedEmail(email, employeeName, amount, claimId, reason);
```

### Implementation Details
- ✅ Uses direct HTTP fetch to Edge Function URL
- ✅ Bypasses Supabase SDK authentication
- ✅ Works with public/unauthenticated requests
- ✅ Maintains full request validation in Edge Function
- ✅ Type-safe with TypeScript

---

## Overview

The ClaimFlow email notification system provides reusable email templates for different events. The Edge Function accepts structured data and sends formatted HTML emails using the Resend API.

---

## Supported Email Types

### 1. **claim_submitted**
Sent when an employee submits a new claim.

**Required Data Fields:**
```typescript
{
  employeeName: string;      // Employee's full name
  claimId: string;           // Unique claim identifier
  amount: number;            // Claim amount
  date: string;              // Submission date
  site?: string;             // Site/Project name
  currencySymbol?: string;   // Currency (default: ₹)
}
```

**Example Call:**
```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    recipientEmail: 'employee@company.com',
    type: 'claim_submitted',
    data: {
      employeeName: 'John Doe',
      claimId: 'CLM-2024-001',
      amount: 5000,
      date: '2024-03-13',
      site: 'Mumbai Office',
      currencySymbol: '₹'
    }
  }
});

if (error) {
  console.error('Failed to send email:', error);
} else {
  console.log('Email sent:', data);
}
```

---

### 2. **claim_approved**
Sent when a manager approves a claim.

**Required Data Fields:**
```typescript
{
  employeeName: string;      // Employee's full name
  claimId: string;           // Claim identifier
  amount: number;            // Approved amount
  approvedBy?: string;       // Manager's name (default: 'Manager')
  currencySymbol?: string;   // Currency (default: ₹)
}
```

**Example Call:**
```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    recipientEmail: 'employee@company.com',
    type: 'claim_approved',
    data: {
      employeeName: 'John Doe',
      claimId: 'CLM-2024-001',
      amount: 5000,
      approvedBy: 'Jane Manager',
      currencySymbol: '₹'
    }
  }
});
```

---

### 3. **claim_rejected**
Sent when a manager rejects a claim.

**Required Data Fields:**
```typescript
{
  employeeName: string;        // Employee's full name
  claimId: string;             // Claim identifier
  amount: number;              // Original amount
  rejectionReason: string;     // Reason for rejection
  rejectedBy?: string;         // Manager's name (default: 'Manager')
  currencySymbol?: string;     // Currency (default: ₹)
}
```

**Example Call:**
```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    recipientEmail: 'employee@company.com',
    type: 'claim_rejected',
    data: {
      employeeName: 'John Doe',
      claimId: 'CLM-2024-001',
      amount: 5000,
      rejectionReason: 'Missing receipt for expenses over ₹1000',
      rejectedBy: 'Jane Manager',
      currencySymbol: '₹'
    }
  }
});
```

---

### 4. **user_created**
Sent when a new user account is created.

**Required Data Fields:**
```typescript
{
  employeeName: string;      // Employee's full name
  email: string;             // User's email
  role: string;              // User's role (e.g., 'Employee', 'Manager', 'Admin')
  tempPassword?: string;     // Temporary password (if applicable)
  loginUrl?: string;         // Login page URL
}
```

**Example Call:**
```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    recipientEmail: 'newuser@company.com',
    type: 'user_created',
    data: {
      employeeName: 'Jane Smith',
      email: 'jane.smith@company.com',
      role: 'Employee',
      tempPassword: 'Temp123!@#',
      loginUrl: 'https://claimflow.company.com/login'
    }
  }
});
```

---

### 5. **password_reset**
Sent when a user requests a password reset.

**Required Data Fields:**
```typescript
{
  employeeName: string;      // Employee's full name
  resetLink: string;         // Password reset link
  expiresIn?: string;        // Expiration time (default: '24 hours')
}
```

**Example Call:**
```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    recipientEmail: 'user@company.com',
    type: 'password_reset',
    data: {
      employeeName: 'John Doe',
      resetLink: 'https://claimflow.company.com/reset?token=abc123xyz',
      expiresIn: '24 hours'
    }
  }
});
```

---

## Integration Examples

### Integration in `claims-api.ts`

Update your claims-api.ts file to send notifications for key events:

```typescript
// Send email when claim is submitted
export async function submitClaim(claim: ClaimData, userEmail: string, userName: string) {
  // ... existing claim submission logic ...
  
  // Send notification email
  const { error } = await supabase.functions.invoke('send-notification', {
    body: {
      recipientEmail: userEmail,
      type: 'claim_submitted',
      data: {
        employeeName: userName,
        claimId: claimId,
        amount: claim.totalAmount,
        date: new Date().toLocaleDateString(),
        site: claim.site,
        currencySymbol: '₹'
      }
    }
  });
  
  if (error) {
    console.warn('Failed to send claim submission email:', error);
  }
}

// Send email when claim is approved
export async function approveClaim(claimId: string, managerName: string, amount: number, employeeEmail: string) {
  // ... existing approval logic ...
  
  const { error } = await supabase.functions.invoke('send-notification', {
    body: {
      recipientEmail: employeeEmail,
      type: 'claim_approved',
      data: {
        employeeName: employeeEmail.split('@')[0], // or fetch from DB
        claimId: claimId,
        amount: amount,
        approvedBy: managerName,
        currencySymbol: '₹'
      }
    }
  });
  
  if (error) {
    console.warn('Failed to send approval email:', error);
  }
}

// Send email when claim is rejected
export async function rejectClaim(claimId: string, reason: string, managerName: string, employeeEmail: string, amount: number) {
  // ... existing rejection logic ...
  
  const { error } = await supabase.functions.invoke('send-notification', {
    body: {
      recipientEmail: employeeEmail,
      type: 'claim_rejected',
      data: {
        employeeName: employeeEmail.split('@')[0], // or fetch from DB
        claimId: claimId,
        amount: amount,
        rejectionReason: reason,
        rejectedBy: managerName,
        currencySymbol: '₹'
      }
    }
  });
  
  if (error) {
    console.warn('Failed to send rejection email:', error);
  }
}

// Send email when new user is created
export async function createUser(userData: UserData) {
  // ... existing user creation logic ...
  
  const { error } = await supabase.functions.invoke('send-notification', {
    body: {
      recipientEmail: userData.email,
      type: 'user_created',
      data: {
        employeeName: userData.name,
        email: userData.email,
        role: userData.role,
        loginUrl: 'https://claimflow.company.com/login'
      }
    }
  });
  
  if (error) {
    console.warn('Failed to send welcome email:', error);
  }
}
```

---

## Error Handling

### Success Response
```json
{
  "success": true,
  "message": "Email sent successfully",
  "id": "email_12345abcde"
}
```

### Error Responses

**Missing required fields:**
```json
{
  "success": false,
  "error": "recipientEmail and type are required"
}
```

**Invalid email type:**
```json
{
  "success": false,
  "error": "Invalid email type: unknown_type"
}
```

**Resend API failure:**
```json
{
  "success": false,
  "error": "Email send failed",
  "details": { ... }
}
```

---

## Best Practices

1. **Always handle errors**: Wrap function calls in try-catch or check the error response
2. **Log failures gracefully**: Email failures should not break the main application flow
3. **Use consistent naming**: Use the exact string values for `type` parameter
4. **Provide complete data**: Fill in all available data fields for better email content
5. **Test with different email types**: Verify each template renders correctly

---

## Logging

The Edge Function logs all activities with emoji prefixes for quick debugging:

```
📧 Email function invoked: POST /functions/v1/send-notification
✓ Handling CORS preflight request
📨 Email request received: { recipientEmail: 'user@email.com', type: 'claim_submitted' }
📧 Email type: claim_submitted
👤 Recipient: user@email.com
✓ Template selected: claim_submitted
📤 Sending email to: user@email.com
📝 Subject: Claim Submitted - CLM-2024-001 | ₹5000
📬 Resend API response status: 200
✅ Email sent successfully! Message ID: email_xxx
```

---

## Deployment

After updating the Edge Function, deploy it:

```bash
supabase functions deploy send-notification
```

---

## Testing

You can test the email notification system using cURL:

```bash
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "type": "claim_submitted",
    "data": {
      "employeeName": "Test User",
      "claimId": "CLM-TEST-001",
      "amount": 5000,
      "date": "2024-03-13",
      "site": "Test Office"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "id": "email_xxx"
}
```
