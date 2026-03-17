# 🆘 Email Testing - Troubleshooting Guide

## Issue: "Failed to send a request to the Edge Function"

### ✅ Already Fixed
We've updated the edge function with better error handling and logging. Here's what to do:

---

## 🧪 Test It Now

### Quick Test (2 minutes)
```
1. Make sure npm run dev is running
2. Go to: http://localhost:5173/test/email
3. Enter your email
4. Click "Send Test Email"
5. Check your inbox (30 seconds max)
```

### If You Get an Error
Open **Browser Console** (Press **F12**) and look for:
- `Invoking send-notification function...` - Function call started ✓
- `Success response: {...}` - Function succeeded ✓
- `Error: ...` - Something went wrong (see below)

---

## 🔧 Troubleshooting Steps

### Problem 1: "Error: recipientEmail is required"
**Cause**: Email field is empty or invalid  
**Solution**: Enter a valid email address

### Problem 2: "Failed to send email: [error message]"
**Cause**: Various issues  
**Solution**: 
1. Check browser console (F12) for specific error
2. Check function logs: `supabase functions logs send-notification`
3. Verify API key is set: `supabase secrets list`

### Problem 3: Email Never Arrives
**Check**:
1. Check spam/junk folder
2. Wait 60 seconds (max delivery time)
3. Try different email (gmail, outlook, etc)
4. Check function logs for delivery error

### Problem 4: Blank Error Message
**Cause**: Function might be returning invalid response  
**Solution**:
1. Check browser console network tab (F12 → Network)
2. Check function logs
3. Redeploy function: `supabase functions deploy send-notification`

---

## 📊 Verify Setup

### Check 1: Function is Deployed
```bash
supabase functions list
# Should show: send-notification | ACTIVE
```

### Check 2: API Key is Set
```bash
supabase secrets list
# Should show: RESEND_API_KEY (with digest)
```

### Check 3: Function Logs Show Success
```bash
supabase functions logs send-notification
# Look for: "Email sent successfully" or similar
```

---

## 🎯 Detailed Testing Flow

### Step 1: Check Dev Server
```bash
npm run dev
# Should show: "Local:   http://localhost:5173"
```

### Step 2: Visit Test Page
Open: **http://localhost:5173/test/email**

### Step 3: Open Browser Console
Press: **F12** → Click "Console" tab

### Step 4: Send Test Email
1. Type: `your-email@example.com`
2. Click: "Send Test Email"
3. Watch console for logs

### Step 5: Check Results
In console you should see:
```
Invoking send-notification function...
Success response: {success: true, id: "..."}
```

Then check your email inbox (may take 30 seconds).

---

## 🛠️ Manual Testing (Advanced)

### Using Browser Console
Open browser console (F12) and paste:
```javascript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    type: 'user_created',
    recipientEmail: 'your-email@example.com',
    data: {
      name: 'Test',
      role: 'Manager',
      advance: 5000,
      companyName: 'ClaimFlow Pro',
      currencySymbol: '₹'
    }
  }
});
console.log({ data, error });
```

### Expected Output
```javascript
{
  data: { success: true, id: "email_xxx" },
  error: null
}
```

---

## 📞 Getting Help

### Check Documentation
- **Quick Fix**: See EMAIL_ERROR_FIX.md
- **Complete Guide**: See EMAIL_COMPLETE_SETUP.md
- **Visual Diagrams**: See EMAIL_VISUAL_GUIDE.md

### Check Logs
```bash
# Function logs
supabase functions logs send-notification

# Check secrets
supabase secrets list

# Verify function deployment
supabase functions list
```

### Test Manually
1. Go to Supabase Dashboard
2. Navigate to Functions
3. Click "send-notification"
4. Use the "Invoke" button to test directly

---

## ✅ Verification Checklist

After fixing, verify:
- [ ] npm run dev is running
- [ ] http://localhost:5173/test/email loads
- [ ] Browser console has no red errors
- [ ] Can enter email and click send
- [ ] Console shows "Invoking send-notification function..."
- [ ] Console shows either success or specific error
- [ ] Email arrives in inbox OR
- [ ] Function logs show what happened

---

## 🎉 Success Indicators

### Good Signs
- ✅ Console shows "Invoking send-notification function..."
- ✅ Console shows "Success response: {success: true, id: "..."}"
- ✅ Email arrives in inbox within 30 seconds
- ✅ Function logs show "Email sent successfully"

### Bad Signs
- ❌ Blank error message (usually CORS issue)
- ❌ "Failed to send a request" (function not responding)
- ❌ Long loading spinner (timeout)
- ❌ Error in console (check network tab)

---

## 🚀 Quick Fix Checklist

If tests are still failing:

1. [ ] Kill and restart dev server
   ```bash
   # Stop: Ctrl+C
   # Restart: npm run dev
   ```

2. [ ] Redeploy function
   ```bash
   supabase functions deploy send-notification
   ```

3. [ ] Clear browser cache
   ```bash
   # Press: Ctrl+Shift+Delete
   # Clear browsing data
   ```

4. [ ] Check function is deployed
   ```bash
   supabase functions list
   ```

5. [ ] Verify API key
   ```bash
   supabase secrets list
   ```

---

## 📝 Notes

- Email delivery takes 30 seconds max
- Check spam/junk folder if not in inbox
- Use valid email format: user@domain.com
- Function logs are helpful for debugging
- Browser console shows real-time progress

---

**Need more help?** Check EMAIL_COMPLETE_SETUP.md for comprehensive guide.
