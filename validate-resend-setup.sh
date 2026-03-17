#!/bin/bash

echo "🔍 Validating Resend Email Setup"
echo "=================================="
echo ""

# Check if RESEND_API_KEY is set in Supabase secrets
echo "1️⃣ Checking Supabase secrets..."
if command -v supabase &> /dev/null; then
  echo "   ✓ Supabase CLI found"
  
  # Try to list secrets (this might require authentication)
  echo ""
  echo "   To verify RESEND_API_KEY is set, run:"
  echo "   → supabase secrets list"
  echo ""
  echo "   To set RESEND_API_KEY, run:"
  echo "   → supabase secrets set RESEND_API_KEY='your_actual_key_here'"
else
  echo "   ✗ Supabase CLI not found"
  echo "   → Install with: npm install -g supabase"
fi

echo ""
echo "2️⃣ Checking .env file..."
if [ -f .env ]; then
  echo "   ✓ .env file exists"
  if grep -q "RESEND_API_KEY" .env; then
    echo "   ✓ RESEND_API_KEY mentioned in .env"
  else
    echo "   ⚠ RESEND_API_KEY not in .env (this is OK - secrets are Supabase-only)"
  fi
else
  echo "   ⚠ .env file not found"
fi

echo ""
echo "3️⃣ Checking Edge Function..."
if [ -f "supabase/functions/send-notification/index.ts" ]; then
  echo "   ✓ Edge Function file exists"
  if grep -q "Deno.env.get('RESEND_API_KEY')" supabase/functions/send-notification/index.ts; then
    echo "   ✓ Function reads RESEND_API_KEY correctly"
  else
    echo "   ✗ Function doesn't read RESEND_API_KEY"
  fi
else
  echo "   ✗ Edge Function not found"
fi

echo ""
echo "4️⃣ Checking emailTemplates.ts..."
if [ -f "supabase/functions/send-notification/emailTemplates.ts" ]; then
  echo "   ✓ Email templates file exists"
else
  echo "   ✗ Email templates file not found"
fi

echo ""
echo "=================================="
echo "✅ Setup Validation Complete"
echo ""
echo "NEXT STEPS:"
echo "1. Ensure RESEND_API_KEY is set in Supabase dashboard"
echo "2. Deploy function: supabase functions deploy send-notification"
echo "3. Test from browser console: await testSendEmail('test@example.com')"
