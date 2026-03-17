#!/usr/bin/env node

/**
 * Email System Validation Script
 * Run this to verify all components are correctly configured
 * 
 * Usage:
 *   node validate-email-setup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = [];

function check(name, condition, details = '') {
  checks.push({
    name,
    passed: condition,
    details,
  });
  
  const icon = condition ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  console.log(`Summary: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('✅ All checks passed! Email system should be working.');
  } else {
    console.log('❌ Some checks failed. See details above.');
  }
  console.log('='.repeat(60));
}

// Start validation
console.log('🔍 Email System Validation\n');

// Check .env file
const envPath = path.join(__dirname, '.env');
check('✓ .env file exists', fs.existsSync(envPath), envPath);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  check(
    '✓ VITE_SUPABASE_URL defined',
    envContent.includes('VITE_SUPABASE_URL='),
    'Required for Supabase connection'
  );
  
  check(
    '✓ VITE_SUPABASE_ANON_KEY defined',
    envContent.includes('VITE_SUPABASE_ANON_KEY='),
    'Required for SDK authentication'
  );
  
  check(
    '✓ VITE_SUPABASE_PROJECT_ID defined',
    envContent.includes('VITE_SUPABASE_PROJECT_ID='),
    'Optional but recommended'
  );
}

// Check Supabase client file
const clientPath = path.join(__dirname, 'src/integrations/supabase/client.ts');
check('✓ Supabase client exists', fs.existsSync(clientPath), clientPath);

if (fs.existsSync(clientPath)) {
  const clientContent = fs.readFileSync(clientPath, 'utf-8');
  
  check(
    '✓ Client uses VITE_SUPABASE_URL',
    clientContent.includes('VITE_SUPABASE_URL'),
    'Environment variable should be imported'
  );
  
  check(
    '✓ Client uses VITE_SUPABASE_ANON_KEY',
    clientContent.includes('VITE_SUPABASE_ANON_KEY'),
    'Anon key (not publishable key) should be used'
  );
  
  check(
    '✓ Client creates Supabase instance',
    clientContent.includes('createClient'),
    'Should use @supabase/supabase-js'
  );
}

// Check Edge Function
const edgePath = path.join(__dirname, 'supabase/functions/send-notification/index.ts');
check('✓ Edge Function exists', fs.existsSync(edgePath), edgePath);

if (fs.existsSync(edgePath)) {
  const edgeContent = fs.readFileSync(edgePath, 'utf-8');
  
  check(
    '✓ Function handles CORS',
    edgeContent.includes('corsHeaders') && edgeContent.includes('OPTIONS'),
    'CORS preflight required for browser requests'
  );
  
  check(
    '✓ Function validates POST method',
    edgeContent.includes('POST'),
    'Function should only accept POST'
  );
  
  check(
    '✓ Function parses JSON body',
    edgeContent.includes('req.json'),
    'Should parse request body'
  );
  
  check(
    '✓ Function uses Resend API',
    edgeContent.includes('api.resend.com'),
    'Email delivery via Resend'
  );
}

// Check template file
const templatePath = path.join(__dirname, 'supabase/functions/send-notification/emailTemplates.ts');
check('✓ Email templates exist', fs.existsSync(templatePath), templatePath);

if (fs.existsSync(templatePath)) {
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  
  check(
    '✓ Has user_created template',
    templateContent.includes('user_created'),
    'Welcome email template'
  );
  
  check(
    '✓ Has claim_submitted template',
    templateContent.includes('claim_submitted'),
    'Claim submission notification'
  );
  
  check(
    '✓ Has getTemplate function',
    templateContent.includes('export function getTemplate'),
    'Function to select templates by type'
  );
}

// Check EmailTest component
const emailTestPath = path.join(__dirname, 'src/pages/EmailTest.tsx');
check('✓ Email test page exists', fs.existsSync(emailTestPath), emailTestPath);

if (fs.existsSync(emailTestPath)) {
  const emailTestContent = fs.readFileSync(emailTestPath, 'utf-8');
  
  check(
    '✓ Test uses supabase.functions.invoke()',
    emailTestContent.includes('supabase.functions.invoke'),
    'Correct method to call Edge Functions'
  );
  
  check(
    '✓ Test includes error handling',
    emailTestContent.includes('invokeError') || emailTestContent.includes('error'),
    'Should handle errors gracefully'
  );
  
  check(
    '✓ Test includes console logging',
    emailTestContent.includes('console.log'),
    'Debugging information'
  );
}

// Print summary
printSummary();

console.log('\n📚 Next steps:');
console.log('1. Open src/pages/EmailTest.tsx in browser');
console.log('2. Open DevTools (F12) and go to Console tab');
console.log('3. Look for 🔧 and 📧 emoji-prefixed messages');
console.log('4. Check if VITE variables are showing as available');
console.log('5. Look for Network tab to see actual API response');
