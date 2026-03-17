# Email Notification 401 Error - Debug Guide

## Issue Overview
Frontend React/Vite application receives 401 Unauthorized error when calling `send-notification` Edge Function, but direct Thunder Client HTTP calls work correctly.

**Diagnosis**: Backend is operational (Thunder Client works). Frontend configuration needs verification.

---

## Quick Debug Steps (Do These First)

### 1. **Check Browser Console**
1. Open your React app in browser
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for the emoji-prefixed debug logs we added:
   - 🔧 Supabase Client Debug Info
   - 📧 Invoking send-notification function
   - Error messages with ❌

**What to look for:**
- `VITE_SUPABASE_URL` is visible
- `VITE_SUPABASE_ANON_KEY` shows as available (✓)
- No undefined values

### 2. **Check Network Tab**
1. In DevTools, go to **Network** tab
2. Click "Send Test Email" button
3. Look for a request to `/functions/v1/send-notification`

**Expected:**
- Status: 200 (success) or 4xx/5xx (with detailed error)
- NOT 401 in the normal sense

**Check response:**
- Click the request
- Go to **Response** tab
- Should show JSON with either `success: true` or detailed error

### 3. **Verify Environment Variables**
Run this in browser console:
```javascript
// Check if env variables are available
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

**Expected output:**
```
URL: https://jluzssnjbwykkhomxomy.supabase.co
Key: sb_publishable_4asrkS...
```

If either is `undefined`, your `.env` variables aren't being loaded. **Solution**: Restart dev server (`npm run dev`).

---

## Step-by-Step Verification

### Step 1: Verify .env File

**File:** `.env`

**Required variables:**
```env
VITE_SUPABASE_PROJECT_ID="jluzssnjbwykkhomxomy"
VITE_SUPABASE_URL="https://jluzssnjbwykkhomxomy.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB"
```

**Action:**
- [ ] Open `.env` file
- [ ] Verify all three variables are present
- [ ] Check values match exactly (no extra spaces or quotes)

---

### Step 2: Verify Supabase Client Initialization

**File:** `src/integrations/supabase/client.ts`

**What it should do:**
1. Read `VITE_SUPABASE_URL` from environment
2. Read `VITE_SUPABASE_ANON_KEY` from environment
3. Create Supabase client with these values
4. Log debug info in development mode

**Action:**
- [ ] Check file exists at correct path
- [ ] Verify it imports from `@supabase/supabase-js`
- [ ] Confirm it uses `VITE_` prefixed variables
- [ ] Check it has debug logging enabled

---

### Step 3: Verify EmailTest Component

**File:** `src/pages/EmailTest.tsx`

**What it should do:**
1. Import supabase client from `src/integrations/supabase/client.ts`
2. On form submit, call `supabase.functions.invoke()`
3. Log detailed information about request/response
4. Handle errors gracefully

**Action:**
- [ ] Check file exists at correct path
- [ ] Verify function uses `supabase.functions.invoke()`
- [ ] Confirm request body has required fields:
  - `type`: 'user_created' (or other valid type)
  - `recipientEmail`: email address
  - `data`: object with personalization data
- [ ] Verify error logging shows status codes

---

### Step 4: Verify Edge Function

**File:** `supabase/functions/send-notification/index.ts`

**Verify it handles:**
1. ✓ CORS preflight (OPTIONS requests)
2. ✓ POST method only
3. ✓ JSON parsing of request body
4. ✓ Validation of `type` and `recipientEmail`
5. ✓ Template selection
6. ✓ Resend API call

**Known working request format:**
```json
{
  "type": "user_created",
  "recipientEmail": "user@example.com",
  "data": {
    "name": "Test User",
    "role": "Manager",
    "advance": 5000,
    "companyName": "ClaimFlow Pro",
    "currencySymbol": "₹"
  }
}
```

---

## Common Issues & Solutions

### Issue 1: "VITE_SUPABASE_ANON_KEY is not set"
**Symptoms:** Browser console shows undefined for ANON_KEY

**Solution:**
1. Restart development server: `npm run dev`
2. Vite only reads .env at startup
3. Changes to .env require full restart

### Issue 2: "401 Unauthorized" from Supabase SDK

**Possible causes:**
1. **Anon key wrong** - Using publishable key instead of anon key
2. **Anon key expired** - Regenerate from Supabase dashboard
3. **Project mismatch** - URL doesn't match anon key's project

**Solutions:**
```typescript
// ✅ CORRECT
const ANON_KEY = "sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB";

// ❌ WRONG
const ANON_KEY = "eyJhbGc..."; // This is a JWT session token, not anon key
```

### Issue 3: CORS Error from Browser
**Symptoms:** Browser console shows "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
- Edge Function already has CORS headers configured
- Verify `CORS_ENABLED=true` is not preventing requests
- Check that request URL is exactly: `https://jluzssnjbwykkhomxomy.supabase.co/functions/v1/send-notification`

### Issue 4: "Email send failed" from Resend
**Symptoms:** Function returns 500 with Resend API error

**Check:**
1. Is `RESEND_API_KEY` set in Supabase dashboard secrets?
2. Is sender email `onboarding@resend.dev`? (temporary, requires domain verification)
3. Is recipient email valid?

---

## Advanced Debugging

### Method 1: Add Debug Logs to Client
Add to `src/integrations/supabase/client.ts`:
```typescript
export const debugSupabase = {
  getUrl: () => import.meta.env.VITE_SUPABASE_URL,
  getKey: () => import.meta.env.VITE_SUPABASE_ANON_KEY,
  getClient: () => supabase,
};

// In browser console:
// window.debugSupabase.getUrl()
// window.debugSupabase.getKey()
```

### Method 2: Add Console Log to Function
Add to `supabase/functions/send-notification/index.ts` at top:
```typescript
console.log('🚀 Function invoked. Headers:', req.headers);
console.log('🚀 Authorization header:', req.headers.get('authorization')?.substring(0, 30) + '...');
```

### Method 3: Test with Curl
```bash
curl -X POST https://jluzssnjbwykkhomxomy.supabase.co/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user_created",
    "recipientEmail": "test@example.com",
    "data": {"name": "Test"}
  }'
```

---

## Verification Checklist

### Environment Setup
- [ ] `.env` file has all 3 VITE_ variables
- [ ] Dev server restarted after .env changes
- [ ] No syntax errors in `.env`

### Supabase Configuration
- [ ] Project ID is correct: `jluzssnjbwykkhomxomy`
- [ ] Anon key starts with: `sb_publishable_`
- [ ] URL is https://jluzssnjbwykkhomxomy.supabase.co

### Code Files
- [ ] `src/integrations/supabase/client.ts` exists and correct
- [ ] `src/pages/EmailTest.tsx` exists and correct
- [ ] `supabase/functions/send-notification/index.ts` exists
- [ ] `supabase/functions/send-notification/emailTemplates.ts` exists

### Function Execution
- [ ] Browser console shows 🔧 Supabase Client Debug Info
- [ ] Browser console shows 📧 Invoking send-notification with request details
- [ ] Network tab shows POST to `/functions/v1/send-notification`
- [ ] Response shows `success: true` or detailed error message

---

## Getting Help

If still getting 401 after these checks, provide this information:

1. **Browser console output:** Screenshot of all emoji-prefixed logs
2. **Network response:** Full response from `/functions/v1/send-notification` request
3. **Error message:** Exact error text shown in UI
4. **Environment:** Are you on macOS/Windows/Linux? Using Node 18+?
5. **Dev server logs:** Any errors when running `npm run dev`?

---

## References

- **Supabase SDK Docs:** https://supabase.com/docs/reference/javascript/invoke
- **Edge Functions Guide:** https://supabase.com/docs/guides/functions
- **Resend API:** https://resend.com/docs
- **Vite Env Variables:** https://vitejs.dev/guide/env-and-modes.html
