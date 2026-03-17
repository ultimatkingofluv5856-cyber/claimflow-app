# Updated index.ts - Complete Reference

This is the final, corrected version of the Edge Function with full template support.

```typescript
/**
 * Supabase Edge Function: send-notification
 * 
 * Purpose: Send formatted HTML emails using Resend API
 * 
 * Request Body:
 * {
 *   "recipientEmail": "user@example.com",
 *   "type": "claim_submitted" | "claim_approved" | "claim_rejected" | "user_created" | "password_reset",
 *   "data": { ... } // Template-specific data
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Email sent successfully",
 *   "id": "email_xxx"
 * }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getTemplate, EmailTemplateType } from "./emailTemplates.ts";

// CORS headers for frontend requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Main handler for the Edge Function
Deno.serve(async (req) => {
  console.log('📧 Email function invoked:', req.method, req.url);

  // ===== STEP 1: Handle CORS preflight requests =====
  if (req.method === 'OPTIONS') {
    console.log('✓ Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  // ===== STEP 2: Validate HTTP method =====
  if (req.method !== 'POST') {
    console.error('❌ Invalid HTTP method:', req.method);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // ===== STEP 3: Validate API key is configured =====
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    console.log('🔑 RESEND_API_KEY present:', !!RESEND_API_KEY);

    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured in Supabase secrets');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RESEND_API_KEY not configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ===== STEP 4: Parse request JSON body =====
    let requestBody: any;
    try {
      requestBody = await req.json();
      console.log('📨 Email request received:', { 
        recipientEmail: requestBody.recipientEmail, 
        type: requestBody.type 
      });
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract email parameters
    const { recipientEmail, type, data } = requestBody;

    // ===== STEP 5: Validate required fields =====
    if (!recipientEmail || !type) {
      console.warn('⚠️ Missing required fields:', { recipientEmail: !!recipientEmail, type: !!type });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'recipientEmail and type are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📧 Email type:', type);
    console.log('👤 Recipient:', recipientEmail);

    // ===== STEP 6: Load appropriate email template =====
    let template;
    try {
      // Calls getTemplate from emailTemplates.ts
      // Returns { subject: string, html: string }
      template = getTemplate(type as EmailTemplateType, data || {});
      console.log('✓ Template selected:', type);
    } catch (templateError) {
      console.error('❌ Template error:', templateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid email type: ${type}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📤 Sending email to:', recipientEmail);
    console.log('📝 Subject:', template.subject);

    // ===== STEP 7: Send email via Resend API =====
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ClaimFlow <onboarding@resend.dev>',
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
      }),
    });

    const result = await resendResponse.json();
    console.log('📬 Resend API response status:', resendResponse.status);

    // ===== STEP 8: Handle API errors =====
    if (!resendResponse.ok) {
      console.error('❌ Resend API error:', result);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email send failed',
          details: result,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ===== STEP 9: Return success response =====
    console.log('✅ Email sent successfully! Message ID:', result.id);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: result.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // ===== CATCH: Handle unexpected errors =====
    console.error('❌ Unexpected error in send-notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## Key Changes from Previous Version

### 1. **Template Import**
```typescript
import { getTemplate, EmailTemplateType } from "./emailTemplates.ts";
```
- Imports reusable template functions
- Enables type-safe template selection

### 2. **Request Body Format**
**Before:**
```json
{ "to": "...", "subject": "...", "html": "..." }
```

**After:**
```json
{
  "recipientEmail": "...",
  "type": "claim_submitted",
  "data": { ... }
}
```

### 3. **Template Selection**
```typescript
template = getTemplate(type as EmailTemplateType, data || {});
```
- Dynamically selects template based on `type`
- Passes data to template function
- Template returns formatted subject and HTML

### 4. **Enhanced Logging**
Each step includes emoji-prefixed logs for easy debugging:
- 📧 Function invoked
- 🔑 API key check
- 📨 Request received
- 📧 Email type logged
- 👤 Recipient logged
- ✓ Template selected
- 📤 Sending email
- 📝 Subject logged
- 📬 API response
- ✅ Success or ❌ Errors

### 5. **Error Handling**
All error responses follow consistent JSON format:
```typescript
{
  success: false,
  error: "description",
  details?: {...}
}
```

### 6. **Resend API Call**
Uses template-generated subject and HTML:
```typescript
body: JSON.stringify({
  from: 'ClaimFlow <onboarding@resend.dev>',
  to: recipientEmail,
  subject: template.subject,    // From template
  html: template.html,          // From template
})
```

---

## Testing Steps

### 1. Deploy the function
```bash
supabase functions deploy send-notification
```

### 2. Test with cURL
```bash
curl -X POST https://PROJECT_ID.supabase.co/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "type": "claim_submitted",
    "data": {
      "employeeName": "John Doe",
      "claimId": "CLM-2024-001",
      "amount": 5000,
      "date": "2024-03-13",
      "site": "Mumbai Office",
      "currencySymbol": "₹"
    }
  }'
```

### 3. Expected Response
```json
{
  "success": true,
  "message": "Email sent successfully",
  "id": "email_1234567890"
}
```

### 4. Check logs
```bash
supabase functions logs send-notification
```

Look for:
```
✅ Email sent successfully! Message ID: email_xxx
```

---

## Summary

The updated `index.ts` now:
- ✅ Imports reusable email templates
- ✅ Accepts structured request body with type parameter
- ✅ Dynamically selects templates based on email type
- ✅ Validates all required fields
- ✅ Provides comprehensive logging
- ✅ Returns consistent JSON responses
- ✅ Handles errors gracefully
- ✅ Maintains backward compatibility with Resend API
- ✅ Supports 5 different email types
- ✅ Ready for production use

**Status**: ✅ Ready to deploy
