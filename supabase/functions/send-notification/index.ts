import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getTemplate, EmailTemplateType } from "./emailTemplates.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('📧 Email function invoked:', req.method, req.url);
  console.log('Request received from:', req.headers.get('origin') || 'unknown');
  console.log('📋 Request headers:', {
    'authorization': req.headers.get('authorization')?.substring(0, 20) + '...' || 'NONE',
    'content-type': req.headers.get('content-type'),
    'x-client-info': req.headers.get('x-client-info'),
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✓ Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
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
    // Validate Gmail credentials are configured
    const GMAIL_USER = Deno.env.get('GMAIL_USER');
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
    
    console.log('🔑 Gmail credentials check:');
    console.log('   GMAIL_USER present:', !!GMAIL_USER);
    console.log('   GMAIL_APP_PASSWORD present:', !!GMAIL_APP_PASSWORD);

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('❌ Gmail credentials not configured in Supabase secrets');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gmail credentials not configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Gmail transporter
    console.log('📧 Creating Gmail transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    console.log('✓ Gmail transporter created successfully');

    // Parse request body
    let requestBody: any;
    try {
      requestBody = await req.json();
      console.log('📨 Raw request body received:', JSON.stringify(requestBody, null, 2));
      console.log('📦 Request body type:', typeof requestBody);
      console.log('📋 Request body keys:', Object.keys(requestBody || {}).join(', '));
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      console.error('   Parse error type:', parseError instanceof Error ? parseError.message : String(parseError));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: String(parseError),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Safely extract fields with defensive checks
    const recipientEmail = requestBody?.recipientEmail?.trim?.() || requestBody?.recipientEmail;
    const type = (requestBody?.type || 'user_created')?.toString?.() || 'user_created';
    const data = (typeof requestBody?.data === 'object' && requestBody?.data !== null) ? requestBody.data : {};

    // Debug: Log extracted values with types
    console.log('📨 Extracted recipientEmail:', recipientEmail, '(type:', typeof recipientEmail + ')');
    console.log('📝 Extracted type:', type, '(type:', typeof type + ')');
    console.log('📦 Extracted data:', JSON.stringify(data));

    // Validate only recipientEmail is required
    if (!recipientEmail || typeof recipientEmail !== 'string' || recipientEmail.length === 0) {
      console.error('❌ Invalid recipientEmail:', { 
        exists: !!recipientEmail, 
        type: typeof recipientEmail,
        value: recipientEmail,
        isEmpty: recipientEmail?.length === 0
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'recipientEmail is required and must be a valid non-empty string',
          received: {
            exists: !!recipientEmail,
            type: typeof recipientEmail,
            value: recipientEmail
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Validation passed: recipientEmail is valid');

    // Get the email template based on type
    let template;
    try {
      console.log('🔍 Looking up template for type:', type);
      template = getTemplate(type as EmailTemplateType, data);
      console.log('✅ Template selected:', type);
      console.log('✅ Template subject:', template.subject);
      console.log('✅ Template has HTML:', !!template.html);
    } catch (templateError: any) {
      console.error('❌ Template error:', templateError);
      console.error('   Error message:', templateError instanceof Error ? templateError.message : String(templateError));
      console.error('   Error type:', templateError?.constructor?.name);
      
      // Fallback: still allow email send even if template fails, use a default
      console.warn('⚠️ Using fallback template due to error');
      template = {
        subject: `ClaimFlow Notification - ${type}`,
        html: `<p>ClaimFlow Notification</p><p>Type: ${type}</p><p>Data: ${JSON.stringify(data)}</p>`
      };
    }

    console.log('📤 Preparing to send email');
    console.log('   From: ClaimFlow <' + GMAIL_USER + '>');
    console.log('   To:', recipientEmail);
    console.log('   Subject:', template.subject);

    // Send email using Gmail SMTP
    console.log('📧 Sending email via Gmail...');
    
    try {
      const mailResult = await transporter.sendMail({
        from: `"ClaimFlow" <${GMAIL_USER}>`,
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email sent successfully!');
      console.log('   Message ID:', mailResult.messageId);
      console.log('   Recipient:', recipientEmail);
      console.log('   Type:', type);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          messageId: mailResult.messageId,
          recipient: recipientEmail,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (emailError: any) {
      console.error('❌ Email send error:');
      console.error('   Error message:', emailError.message);
      console.error('   Error code:', emailError.code);
      console.error('   Full error:', emailError);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email send failed',
          details: emailError.message || 'Unknown email error',
          code: emailError.code,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
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
