# Email System - Quick Reference Card

## 🚀 Quick Test (2 minutes)

### Browser Console Test
```javascript
// Copy-paste into browser console (F12)
await testSendEmail('your@email.com', 'user_created', { name: 'Test' })
```

### Expected Output
```
✅ SUCCESS:
  id: "..."
  message: "Email sent successfully"

📧 Email sent! Check inbox for: your@email.com
```

---

## 📧 Email Types & Data

### user_created
```javascript
await quickEmailTests.testUserCreated()
// OR
await testSendEmail('user@example.com', 'user_created', {
  name: 'John Doe',
  role: 'Manager',
  advance: 5000,
  companyName: 'ClaimFlow Pro',
  currencySymbol: '₹'
})
```

### claim_submitted
```javascript
await testSendEmail('user@example.com', 'claim_submitted', {
  employeeName: 'John Doe',
  claimAmount: 5000,
  claimDate: '2024-01-15',
  description: 'Travel expenses',
  claimId: 'CLM-001',
  companyName: 'ClaimFlow Pro',
  currencySymbol: '₹'
})
```

### claim_approved
```javascript
await testSendEmail('user@example.com', 'claim_approved', {
  employeeName: 'John Doe',
  claimAmount: 5000,
  claimId: 'CLM-001',
  companyName: 'ClaimFlow Pro',
  currencySymbol: '₹'
})
```

### claim_rejected
```javascript
await testSendEmail('user@example.com', 'claim_rejected', {
  employeeName: 'John Doe',
  claimAmount: 5000,
  claimId: 'CLM-001',
  reason: 'Missing receipts',
  companyName: 'ClaimFlow Pro',
  currencySymbol: '₹'
})
```

### password_reset
```javascript
await testSendEmail('user@example.com', 'password_reset', {
  name: 'John Doe',
  resetLink: 'https://example.com/reset?token=abc123',
  companyName: 'ClaimFlow Pro'
})
```

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| `undefined` for env vars | Restart dev server: `npm run dev` |
| 401 Unauthorized | Check .env has correct VITE_SUPABASE_ANON_KEY |
| Email not received | Check recipient email is valid |
| Function error | Check Supabase function logs |
| Not seeing test helpers | Hard refresh: `Ctrl+Shift+R` |

---

## 🔧 System Status

```bash
# Verify setup
node validate-email-setup.js
```

**Expected:** All 21 checks pass ✓

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (Supabase config) |
| `src/integrations/supabase/client.ts` | Supabase SDK initialization |
| `src/pages/EmailTest.tsx` | Email test UI page |
| `supabase/functions/send-notification/index.ts` | Edge Function handler |
| `supabase/functions/send-notification/emailTemplates.ts` | Email template definitions |
| `src/lib/email-test-helpers.ts` | Browser console test helpers |

---

## 🌐 Live Endpoints

- **Edge Function:** `https://jluzssnjbwykkhomxomy.supabase.co/functions/v1/send-notification`
- **Supabase Project:** `https://jluzssnjbwykkhomxomy.supabase.co`
- **Email Service:** Resend (api.resend.com)

---

## 📚 Documentation Files

- `EMAIL_DEBUGGING_COMPLETE.md` - Full setup & troubleshooting guide
- `DEBUG_EMAIL_401_ERROR.md` - Detailed 401 error debugging
- `validate-email-setup.js` - Automated validation script

---

## ✅ Verification Checklist

- [ ] `npm run dev` - Dev server running
- [ ] `.env` file has 3 VITE_ variables
- [ ] `validate-email-setup.js` shows 21/21 checks
- [ ] Browser console shows 🔧 and 📧 logs
- [ ] Test email command works
- [ ] Email arrives in inbox within 30 seconds

---

## 💡 Pro Tips

1. **Multiple test emails?** Use quick test functions:
   ```javascript
   await quickEmailTests.testUserCreated()
   await quickEmailTests.testClaimSubmitted()
   ```

2. **Check request details?** Enable Network tab first:
   - F12 → Network → Run test
   - Look for `/functions/v1/send-notification` request

3. **Debug in production?** Add to App.tsx:
   ```typescript
   import './lib/email-test-helpers'
   ```

4. **Integrate into API?** See `EMAIL_DEBUGGING_COMPLETE.md` for code examples

---

## 🆘 Still Having Issues?

1. Check `DEBUG_EMAIL_401_ERROR.md` for detailed 401 troubleshooting
2. Run `validate-email-setup.js` to verify all files exist
3. Check Supabase dashboard for Edge Function logs
4. Try curl test (see EMAIL_DEBUGGING_COMPLETE.md)
5. Hard refresh browser: `Ctrl+Shift+R`

---

**Last Updated:** Today  
**Status:** ✅ All systems verified and working
