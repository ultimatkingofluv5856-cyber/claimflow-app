import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jluzssnjbwykkhomxomy.supabase.co';
const supabaseKey = 'sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailNotification(recipientEmail: string) {
  try {
    console.log(`Testing email notification to: ${recipientEmail}`);

    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'user_created',
        recipientEmail,
        data: {
          name: 'Test User',
          role: 'Manager',
          advance: 5000,
          companyName: 'ClaimFlow Pro',
          currencySymbol: '₹',
        },
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      return;
    }

    console.log('Email sent successfully!');
    console.log('Response:', data);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

// Run test with the provided email
const testEmail = process.argv[2] || 'test@example.com';
testEmailNotification(testEmail);
