# Email System - Verification Checklist

## ✅ Pre-Testing Checklist

Before running any tests, verify these prerequisites:

### Development Environment
- [ ] Node.js is installed (v18+): `node --version`
- [ ] npm/pnpm is installed: `npm --version` or `pnpm --version`
- [ ] Project dependencies installed: `npm install` (if not done)
- [ ] Development server can start: `npm run dev`
- [ ] No TypeScript errors in IDE

### Configuration Files
- [ ] `.env` file exists in project root
- [ ] `.env` contains `VITE_SUPABASE_PROJECT_ID`
- [ ] `.env` contains `VITE_SUPABASE_URL`
- [ ] `.env` contains `VITE_SUPABASE_ANON_KEY`
- [ ] `.env` values are not empty or malformed

### Supabase Configuration
- [ ] Supabase project exists: `jluzssnjbwykkhomxomy`
- [ ] Project URL matches `.env`: `https://jluzssnjbwykkhomxomy.supabase.co`
- [ ] Anon key in `.env` starts with: `sb_publishable_`
- [ ] Edge Function `send-notification` is deployed
- [ ] Edge Function shows as "Active" in dashboard

### Resend Configuration
- [ ] RESEND_API_KEY is set in Supabase Secrets
- [ ] API key is valid (starts with `re_`)
- [ ] Sender email configured: `onboarding@resend.dev` (or verified domain)

---

## 🧪 Quick Test Checklist

### Step 1: Start Development Server
```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] No TypeScript compilation errors
- [ ] App loads at `localhost:5173` (or similar)
- [ ] No console errors visible

### Step 2: Verify Environment Variables
In browser console, run:
```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

- [ ] URL displays correctly
- [ ] Anon key shows as available (true)
- [ ] No `undefined` values

### Step 3: Run Validation Script
```bash
node validate-email-setup.js
```

- [ ] Script runs without errors
- [ ] Shows: "Summary: 21/21 checks passed"
- [ ] All 21 checks show ✅

### Step 4: Test Email from Browser Console
```javascript
await testSendEmail('test@example.com', 'user_created', { name: 'Test User' })
```

- [ ] Console shows no errors
- [ ] Shows: "✅ SUCCESS"
- [ ] Shows email ID returned
- [ ] No "❌ ERROR" messages

### Step 5: Check Test Email Logs
In browser console, look for:
- [ ] 🔧 Supabase Client Debug Info (shows URL and key status)
- [ ] 📧 Invoking send-notification (shows recipient and type)
- [ ] ✅ SUCCESS response (or ❌ error details)

### Step 6: Check Network Tab
1. Open DevTools Network tab
2. Filter for: `send-notification`
3. Run email test again

- [ ] Request appears in Network tab
- [ ] Request method is: POST
- [ ] Response status is: 200
- [ ] Response shows JSON with success/error

### Step 7: Verify Email Receipt
- [ ] Check inbox for email
- [ ] Email is from: `ClaimFlow <onboarding@resend.dev>`
- [ ] Email arrived within 30 seconds
- [ ] Email content looks correct

---

## 🐛 Troubleshooting Checklist

### Issue: Getting 401 Error
- [ ] Restart dev server: `npm run dev`
- [ ] Hard refresh browser: `Ctrl+Shift+R`
- [ ] Check `.env` has `VITE_SUPABASE_ANON_KEY`
- [ ] Verify anon key value is correct
- [ ] Check if key starts with: `sb_publishable_`
- [ ] Check Supabase dashboard that key is not expired
- [ ] Try regenerating key in Supabase dashboard

### Issue: "VITE_SUPABASE_ANON_KEY is not set"
- [ ] Verify `.env` file exists in project root
- [ ] Verify variable is spelled correctly (case-sensitive)
- [ ] Verify variable name starts with `VITE_`
- [ ] Verify no extra spaces or quotes
- [ ] Restart dev server: `npm run dev`
- [ ] Hard refresh browser: `Ctrl+Shift+R`

### Issue: Network Request Shows Error
- [ ] Check response body for error message
- [ ] If 500 error: Check Supabase Edge Function logs
- [ ] If 400 error: Check request body format
- [ ] If 401 error: See "Getting 401 Error" above

### Issue: Email Not Received
- [ ] Check email spam/junk folder
- [ ] Verify recipient email is correct and valid
- [ ] Check if function returned success (200 status)
- [ ] Wait 30 seconds (Resend delivery time)
- [ ] Check Resend logs for delivery errors

### Issue: Validation Script Fails
- [ ] Check all files exist at correct paths
- [ ] Run: `node validate-email-setup.js` for details
- [ ] Compare output with expected 21 checks
- [ ] Verify file paths match exactly

### Issue: Test Helper Functions Not Available
- [ ] Check browser is in development mode
- [ ] Hard refresh: `Ctrl+Shift+R`
- [ ] Check `.env` is configured
- [ ] Check dev server is running
- [ ] Check `src/main.tsx` imports email test helpers

---

## 📊 Testing Matrix

Test all email types and verify they work:

### Test: user_created
```javascript
await quickEmailTests.testUserCreated()
```
- [ ] No errors in console
- [ ] Email shows success
- [ ] Email received with user name

### Test: claim_submitted
```javascript
await quickEmailTests.testClaimSubmitted()
```
- [ ] No errors in console
- [ ] Email shows success
- [ ] Email shows claim details

### Test: claim_approved
```javascript
await quickEmailTests.testClaimApproved()
```
- [ ] No errors in console
- [ ] Email shows success
- [ ] Email shows approval message

### Test: claim_rejected
```javascript
await quickEmailTests.testClaimRejected()
```
- [ ] No errors in console
- [ ] Email shows success
- [ ] Email shows rejection reason

### Test: password_reset
```javascript
await testSendEmail('test@example.com', 'password_reset', {
  name: 'Test User',
  resetLink: 'https://example.com/reset?token=abc123'
})
```
- [ ] No errors in console
- [ ] Email shows success
- [ ] Email shows reset link

---

## 🚀 Integration Checklist

Once basic tests pass, prepare for integration:

### Code Integration
- [ ] Read integration examples in EMAIL_DEBUGGING_COMPLETE.md
- [ ] Locate claims-api.ts in codebase
- [ ] Find submitClaim() function
- [ ] Find approveClaim() function
- [ ] Find rejectClaim() function
- [ ] Find createUser() function

### Integration Implementation
- [ ] Add email call after submitClaim()
- [ ] Add email call after approveClaim()
- [ ] Add email call after rejectClaim()
- [ ] Add email call after createUser()
- [ ] Verify no syntax errors

### Integration Testing
- [ ] Create new test user (should receive email)
- [ ] Submit test claim (should receive email)
- [ ] Approve claim (should receive email)
- [ ] Reject claim (should receive email)
- [ ] Check all emails received
- [ ] Verify email details are correct

---

## 📋 Sign-Off Checklist

### System Verification Complete
- [ ] All 21 validation checks pass
- [ ] All 5 email types tested
- [ ] Browser console helpers working
- [ ] No console errors
- [ ] Network requests successful (200 status)
- [ ] Emails received in inbox

### Ready for Production
- [ ] Resend domain verified (or using onboarding@resend.dev)
- [ ] RESEND_API_KEY confirmed in Supabase Secrets
- [ ] Integration code added to claims-api.ts
- [ ] Integration tested with real data
- [ ] Email formatting verified
- [ ] Error handling tested
- [ ] Documentation reviewed

### Ready for Deployment
- [ ] All tests passing
- [ ] No warnings in console
- [ ] Performance acceptable
- [ ] Security requirements met
- [ ] Team trained on testing
- [ ] Documentation updated

---

## 🎯 Success Criteria

Your email system is working correctly when:

✅ **Configuration**
- All environment variables loaded
- All files exist and are correct
- Validation script shows 21/21

✅ **Testing**
- Test email command works
- All 5 email types send successfully
- Network shows 200 status codes
- Emails arrive in inbox within 30 seconds

✅ **Integration**
- Claims generate appropriate emails
- User creation sends welcome email
- Approval/rejection emails have correct details
- No errors in backend logs

✅ **User Experience**
- Email formatting looks professional
- Content is clear and helpful
- Sender information is correct
- No spam filter blocking

---

## 📞 Getting Help

If any checklist item fails:

1. **Read:** Find which guide covers the issue
   - 401 error → DEBUG_EMAIL_401_ERROR.md
   - Setup help → EMAIL_DEBUGGING_COMPLETE.md
   - Architecture → ARCHITECTURE_DIAGRAMS.md

2. **Run:** Execute relevant test
   - Validation: `node validate-email-setup.js`
   - Console test: `await testSendEmail(...)`

3. **Check:** Verify using tools
   - Browser console: Look for emoji logs
   - Network tab: Check request/response
   - Supabase logs: Check function logs

4. **Debug:** Follow troubleshooting steps
   - Restart server if env variables changed
   - Hard refresh if code changes not showing
   - Regenerate keys if they expire

---

## 📝 Notes

- Date started: [Today]
- Checked by: [Your name]
- Status: ☐ Passed / ☐ Needs Work

**Comments:**
[Add notes about any issues or observations]

---

**Keep this checklist for future reference!**  
All items should be checked ✅ for successful email system.
