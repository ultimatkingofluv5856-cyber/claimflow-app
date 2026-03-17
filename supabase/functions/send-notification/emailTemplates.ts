/**
 * Email Templates Module
 * Provides reusable email templates for different notification types
 * Each template returns { subject, html }
 */

// ============================================================================
// COMMON STYLES & UTILITIES
// ============================================================================

const emailStyles = `
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
  line-height: 1.6;
`;

const containerStyles = `
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
`;

const buttonStyles = `
  display: inline-block;
  padding: 12px 24px;
  margin: 10px 10px 10px 0;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
`;

const tableStyles = `
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  background-color: #fff;
`;

const tableHeaderStyles = `
  background-color: #f0f4f8;
  padding: 12px;
  border: 1px solid #ddd;
  font-weight: bold;
  text-align: left;
`;

const tableCellStyles = `
  padding: 10px 12px;
  border: 1px solid #ddd;
  text-align: left;
`;

// ============================================================================
// EMAIL LAYOUT FUNCTION
// ============================================================================

interface EmailLayoutOptions {
  title?: string;
  icon?: string;
  titleColor?: string;
}

/**
 * Reusable email layout wrapper
 * Provides consistent header, container, and footer styling
 */
function emailLayout(
  title: string,
  content: string,
  options: EmailLayoutOptions = { title }
): string {
  const { icon = '📧', titleColor = '#2c3e50' } = options;

  return `
    <div style="${containerStyles}">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #ecf0f1;">
        <h1 style="color: ${titleColor}; margin: 0; font-size: 24px;">
          ${icon} ${title}
        </h1>
      </div>

      <!-- Main Content -->
      <div style="${emailStyles}">
        ${content}
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #ecf0f1;">
        <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;">
        <p style="font-size: 12px; color: #7f8c8d; margin: 8px 0;">
          ClaimFlow Pro | Expense Management System
        </p>
        <p style="font-size: 11px; color: #95a5a6; margin: 4px 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
}

// ============================================================================
// TEMPLATE 1: WELCOME USER
// ============================================================================

/**
 * Welcome User Template
 * Sent when a new user account is created
 * Includes: name, role, advance balance, currency, login link
 */
export function welcomeUserTemplate(data: {
  name: string;
  role: string;
  advance?: number;
  currency?: string;
  login_link: string;
}): { subject: string; html: string } {
  const curr = data.currency || '₹';
  const advanceAmount = data.advance ? new Intl.NumberFormat('en-IN').format(data.advance) : '0';

  const content = `
    <p style="${emailStyles}">Hello <strong>${data.name}</strong>,</p>

    <p style="${emailStyles}">
      Welcome to <strong>ClaimFlow Pro</strong>! Your account has been successfully created. 
      You can now submit and track your expense claims.
    </p>

    <!-- Account Details Box -->
    <div style="background-color: #d5f4e6; padding: 16px; border-left: 4px solid #27ae60; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Role:</strong> ${data.role}</p>
      <p style="margin: 8px 0;"><strong>Advance Balance:</strong> ${curr}${advanceAmount}</p>
      <p style="margin: 8px 0;"><strong>Account Status:</strong> <span style="color: #27ae60; font-weight: bold;">Active</span></p>
    </div>

    <!-- Login Button -->
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.login_link}" style="${buttonStyles}; background-color: #27ae60;">
        Log In to ClaimFlow
      </a>
    </div>

    <!-- Next Steps -->
    <p style="${emailStyles}"><strong>Next Steps:</strong></p>
    <ol style="${emailStyles}">
      <li>Log in to your account</li>
      <li>Complete your profile information</li>
      <li>Review available categories and projects</li>
      <li>Submit your first expense claim</li>
    </ol>

    <p style="${emailStyles}">
      If you have any questions or need assistance, please contact your manager or the HR department.
    </p>

    <p style="${emailStyles}">
      Welcome to the team!
    </p>
  `;

  return {
    subject: `Welcome to ClaimFlow Pro, ${data.name}!`,
    html: emailLayout('Welcome to ClaimFlow Pro', content, { 
      icon: '🎉', 
      titleColor: '#27ae60' 
    })
  };
}

// ============================================================================
// TEMPLATE 2: CLAIM SUBMITTED (USER)
// ============================================================================

/**
 * Claim Submitted - User Template
 * Sent to the employee who submitted the claim
 * Includes: claim number, claim items table, total, attachments, status message
 */
export function claimSubmittedUserTemplate(data: {
  claim_number: string;
  items: Array<{
    description: string;
    category: string;
    amount: number;
  }>;
  total_amount: number;
  currency?: string;
  attachments?: string[];
  employee_name?: string;
}): { subject: string; html: string } {
  const curr = data.currency || '₹';
  const totalFormatted = new Intl.NumberFormat('en-IN').format(data.total_amount);

  let claimItemsTable = `
    <table style="${tableStyles}">
      <thead>
        <tr>
          <th style="${tableHeaderStyles}">Description</th>
          <th style="${tableHeaderStyles}">Category</th>
          <th style="${tableHeaderStyles}">Amount</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.items.forEach(item => {
    const itemAmount = new Intl.NumberFormat('en-IN').format(item.amount);
    claimItemsTable += `
      <tr>
        <td style="${tableCellStyles}">${item.description}</td>
        <td style="${tableCellStyles}">${item.category}</td>
        <td style="${tableCellStyles}; text-align: right; font-weight: bold;">${curr}${itemAmount}</td>
      </tr>
    `;
  });

  claimItemsTable += `
      </tbody>
    </table>
  `;

  let attachmentsSection = '';
  if (data.attachments && data.attachments.length > 0) {
    attachmentsSection = `
      <div style="background-color: #fef5e7; padding: 12px; border-left: 4px solid #f39c12; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; font-weight: bold;">📎 Attachments (${data.attachments.length}):</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${data.attachments.map(att => `<li style="margin: 4px 0;">${att}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  const content = `
    <p style="${emailStyles}">Hello <strong>${data.employee_name || 'there'}</strong>,</p>

    <p style="${emailStyles}">
      Your expense claim has been <strong>submitted successfully</strong> and is now pending approval 
      from your manager.
    </p>

    <!-- Claim Details -->
    <div style="background-color: #d6eaf8; padding: 16px; border-left: 4px solid #3498db; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Claim #:</strong> ${data.claim_number}</p>
      <p style="margin: 8px 0;"><strong>Total Amount:</strong> ${curr}${totalFormatted}</p>
      <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #f39c12; font-weight: bold;">Pending Manager Approval</span></p>
      <p style="margin: 8px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <!-- Claim Items Table -->
    <p style="${emailStyles}"><strong>Claim Items:</strong></p>
    ${claimItemsTable}

    <!-- Total -->
    <div style="text-align: right; padding: 12px 0; margin: 12px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: bold;">
        Total: <span style="color: #3498db;">${curr}${totalFormatted}</span>
      </p>
    </div>

    ${attachmentsSection}

    <p style="${emailStyles}">
      Your claim is now under review by your manager. You will be notified via email once it has been 
      approved or if any additional information is required.
    </p>

    <p style="${emailStyles}">
      You can track the status of your claim by logging into ClaimFlow Pro.
    </p>

    <p style="${emailStyles}">
      If you have any questions, please contact your manager.
    </p>
  `;

  return {
    subject: `Claim Submitted - ${data.claim_number} | ${curr}${totalFormatted}`,
    html: emailLayout('Claim Submitted Successfully', content, { 
      icon: '📋', 
      titleColor: '#3498db' 
    })
  };
}

// ============================================================================
// TEMPLATE 3: CLAIM SUBMITTED (MANAGER)
// ============================================================================

/**
 * Claim Submitted - Manager Template
 * Sent to the manager for claim approval
 * Includes: employee name, claim summary, items table, total, attachments, approve/reject buttons
 */
export function claimSubmittedManagerTemplate(data: {
  claim_number: string;
  employee_name: string;
  employee_email?: string;
  items: Array<{
    description: string;
    category: string;
    amount: number;
  }>;
  total_amount: number;
  currency?: string;
  attachments?: string[];
  approve_link: string;
  reject_link: string;
}): { subject: string; html: string } {
  const curr = data.currency || '₹';
  const totalFormatted = new Intl.NumberFormat('en-IN').format(data.total_amount);

  let claimItemsTable = `
    <table style="${tableStyles}">
      <thead>
        <tr>
          <th style="${tableHeaderStyles}">Description</th>
          <th style="${tableHeaderStyles}">Category</th>
          <th style="${tableHeaderStyles}">Amount</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.items.forEach(item => {
    const itemAmount = new Intl.NumberFormat('en-IN').format(item.amount);
    claimItemsTable += `
      <tr>
        <td style="${tableCellStyles}">${item.description}</td>
        <td style="${tableCellStyles}">${item.category}</td>
        <td style="${tableCellStyles}; text-align: right; font-weight: bold;">${curr}${itemAmount}</td>
      </tr>
    `;
  });

  claimItemsTable += `
      </tbody>
    </table>
  `;

  let attachmentsSection = '';
  if (data.attachments && data.attachments.length > 0) {
    attachmentsSection = `
      <div style="background-color: #fef5e7; padding: 12px; border-left: 4px solid #f39c12; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; font-weight: bold;">📎 Attachments (${data.attachments.length}):</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${data.attachments.map(att => `<li style="margin: 4px 0;">${att}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  const content = `
    <p style="${emailStyles}">Hello Manager,</p>

    <p style="${emailStyles}">
      A new expense claim awaits your review and approval.
    </p>

    <!-- Employee & Claim Info -->
    <div style="background-color: #e8f8f5; padding: 16px; border-left: 4px solid #1abc9c; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Employee:</strong> ${data.employee_name}</p>
      <p style="margin: 8px 0;"><strong>Email:</strong> ${data.employee_email || 'N/A'}</p>
      <p style="margin: 8px 0;"><strong>Claim #:</strong> ${data.claim_number}</p>
      <p style="margin: 8px 0;"><strong>Total Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #1abc9c;">${curr}${totalFormatted}</span></p>
      <p style="margin: 8px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <!-- Claim Items Summary -->
    <p style="${emailStyles}"><strong>Expense Items:</strong></p>
    ${claimItemsTable}

    <!-- Total -->
    <div style="text-align: right; padding: 12px 0; margin: 12px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: bold;">
        Total: <span style="color: #1abc9c;">${curr}${totalFormatted}</span>
      </p>
    </div>

    ${attachmentsSection}

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.approve_link}" style="${buttonStyles}; background-color: #27ae60;">
        ✅ Approve Claim
      </a>
      <a href="${data.reject_link}" style="${buttonStyles}; background-color: #e74c3c;">
        ❌ Reject Claim
      </a>
    </div>

    <p style="${emailStyles}; font-size: 13px;">
      <em>Please review all details and attachments before approving or rejecting this claim.</em>
    </p>
  `;

  return {
    subject: `Action Required: Approve Claim ${data.claim_number} from ${data.employee_name}`,
    html: emailLayout('Claim Awaiting Approval', content, { 
      icon: '⏳', 
      titleColor: '#1abc9c' 
    })
  };
}

// ============================================================================
// TEMPLATE 4: CLAIM APPROVED
// ============================================================================

/**
 * Claim Approved Template
 * Sent to the employee when their claim is approved
 * Includes: claim_no, total, approved_by
 */
export function claimApprovedTemplate(data: {
  claim_no: string;
  total: number;
  approved_by: string;
  currency?: string;
  employee_name?: string;
  status?: string;
}): { subject: string; html: string } {
  const curr = data.currency || '₹';
  const totalFormatted = new Intl.NumberFormat('en-IN').format(data.total);
  const statusDisplay = data.status || 'Approved';
  const statusEmoji = statusDisplay.toLowerCase().includes('fully') ? '✅' : '⏳';
  const statusColor = statusDisplay.toLowerCase().includes('fully') ? '#27ae60' : '#f39c12';

  const content = `
    <p style="${emailStyles}">Hello <strong>${data.employee_name || 'there'}</strong>,</p>

    <p style="${emailStyles}">
      Great news! Your expense claim has been <strong>approved</strong> and is now ready for processing.
    </p>

    <!-- Approval Details -->
    <div style="background-color: #d5f4e6; padding: 16px; border-left: 4px solid #27ae60; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Claim #:</strong> ${data.claim_no}</p>
      <p style="margin: 8px 0;"><strong>Approved Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #27ae60;">${curr}${totalFormatted}</span></p>
      <p style="margin: 8px 0;"><strong>Approved By:</strong> ${data.approved_by}</p>
      <p style="margin: 8px 0;"><strong>Approved Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusEmoji} ${statusDisplay}</span></p>
    </div>

    <p style="${emailStyles}">
      ${statusDisplay.toLowerCase().includes('fully') 
        ? 'The approved amount will be processed according to your company\'s payment policy. You will receive another notification once the payment is made.'
        : 'Your claim has been approved by the manager and has been forwarded to the admin for final approval. You will receive another notification once the admin reviews your claim.'}
    </p>

    <p style="${emailStyles}">
      You can track the payment status at any time by logging into ClaimFlow Pro.
    </p>

    <p style="${emailStyles}">
      Thank you for your diligent documentation and submission!
    </p>
  `;

  return {
    subject: `${statusEmoji} Claim ${statusDisplay} - ${data.claim_no} | ${curr}${totalFormatted}`,
    html: emailLayout('Claim Approved', content, { 
      icon: statusEmoji, 
      titleColor: statusColor 
    })
  };
}

// ============================================================================
// TEMPLATE 5: CLAIM REJECTED
// ============================================================================

/**
 * Claim Rejected Template
 * Sent to the employee when their claim is rejected
 * Includes: claim_no, total, rejected_by, reason
 */
export function claimRejectedTemplate(data: {
  claim_no: string;
  total: number;
  rejected_by: string;
  reason: string;
  currency?: string;
  employee_name?: string;
}): { subject: string; html: string } {
  const curr = data.currency || '₹';
  const totalFormatted = new Intl.NumberFormat('en-IN').format(data.total);

  const content = `
    <p style="${emailStyles}">Hello <strong>${data.employee_name || 'there'}</strong>,</p>

    <p style="${emailStyles}">
      We regret to inform you that your expense claim has been <strong>rejected</strong> 
      and requires your attention.
    </p>

    <!-- Rejection Details -->
    <div style="background-color: #fadbd8; padding: 16px; border-left: 4px solid #e74c3c; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Claim #:</strong> ${data.claim_no}</p>
      <p style="margin: 8px 0;"><strong>Amount:</strong> ${curr}${totalFormatted}</p>
      <p style="margin: 8px 0;"><strong>Rejected By:</strong> ${data.rejected_by}</p>
      <p style="margin: 8px 0;"><strong>Rejection Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #e74c3c; font-weight: bold;">❌ REJECTED</span></p>
    </div>

    <!-- Rejection Reason -->
    <div style="background-color: #fff; padding: 16px; border-left: 4px solid #95a5a6; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-weight: bold;">Reason for Rejection:</p>
      <p style="margin: 0; font-style: italic; line-height: 1.6;">
        ${data.reason}
      </p>
    </div>

    <!-- Next Steps -->
    <p style="${emailStyles}"><strong>What you can do:</strong></p>
    <ul style="${emailStyles}">
      <li>Review the rejection reason carefully</li>
      <li>Correct the issues mentioned in the rejection</li>
      <li>Resubmit your claim with necessary changes</li>
      <li>Contact your manager if you need clarification</li>
    </ul>

    <p style="${emailStyles}">
      If you believe this rejection is incorrect or have questions, 
      please reach out to <strong>${data.rejected_by}</strong> or your HR department.
    </p>
  `;

  return {
    subject: `❌ Claim Rejected - ${data.claim_no} | Action Required`,
    html: emailLayout('Claim Rejected', content, { 
      icon: '❌', 
      titleColor: '#e74c3c' 
    })
  };
}

/**
 * User Created Template (Legacy)
 * Sent when a new user account is created
 */
export function userCreatedTemplate(data: {
  employeeName?: string;
  email?: string;
  role?: string;
  tempPassword?: string;
  loginUrl?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="${emailStyles}">Hello <strong>${data.employeeName || 'there'}</strong>,</p>

    <p style="${emailStyles}">
      Your account has been successfully created! You can now access ClaimFlow Pro 
      to submit and track your expense claims.
    </p>

    <div style="background-color: #d6eaf8; padding: 16px; border-left: 4px solid #3498db; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Email:</strong> ${data.email || 'N/A'}</p>
      <p style="margin: 8px 0;"><strong>Role:</strong> ${data.role || 'User'}</p>
      ${data.tempPassword ? `<p style="margin: 8px 0;"><strong>Temporary Password:</strong> <code style="background-color: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${data.tempPassword}</code></p>` : ''}
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.loginUrl || '#'}" style="${buttonStyles}">
        Log In to ClaimFlow
      </a>
    </div>

    <p style="${emailStyles}"><strong>Next Steps:</strong></p>
    <ol style="${emailStyles}">
      <li>Log in using the credentials above</li>
      <li>Update your profile information</li>
      <li>Submit your first expense claim</li>
      <li>Track approval status in real-time</li>
    </ol>

    <p style="${emailStyles}">
      If you need help or have questions, contact the HR department or your manager.
    </p>

    <p style="${emailStyles}">
      Welcome to the team!
    </p>
  `;

  return {
    subject: `Welcome to ClaimFlow Pro, ${data.employeeName}!`,
    html: emailLayout('Welcome to ClaimFlow Pro', content, { 
      icon: '🎉', 
      titleColor: '#3498db' 
    })
  };
}

/**
 * Password Reset Template (Legacy)
 * Sent when a user requests a password reset
 */
export function passwordResetTemplate(data: {
  employeeName?: string;
  resetLink?: string;
  expiresIn?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="${emailStyles}">Hello <strong>${data.employeeName || 'there'}</strong>,</p>

    <p style="${emailStyles}">
      We received a request to reset the password for your ClaimFlow account. 
      If you did not make this request, please ignore this email and your password will remain unchanged.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.resetLink || '#'}" style="${buttonStyles}; background-color: #e74c3c;">
        Reset Password
      </a>
    </div>

    <p style="${emailStyles}">
      Or copy and paste this link in your browser:
      <br>
      <code style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all;">
        ${data.resetLink || 'https://claimflow.com/reset'}
      </code>
    </p>

    <p style="${emailStyles}">
      <strong style="color: #e74c3c;">⏰ Important:</strong> 
      This link will expire in ${data.expiresIn || '24 hours'}. 
      If the link has expired, you can request a new password reset.
    </p>

    <p style="${emailStyles}">
      If you did not request this password reset, please:
      <ol style="${emailStyles}">
        <li>Ignore this email</li>
        <li>Contact your IT administrator if your account may have been compromised</li>
      </ol>
    </p>
  `;

  return {
    subject: `Password Reset Request - ClaimFlow`,
    html: emailLayout('Password Reset Request', content, { 
      icon: '🔐', 
      titleColor: '#e74c3c' 
    })
  };
}

// ============================================================================
// TYPE DEFINITIONS & TEMPLATE SELECTOR
// ============================================================================

/**
 * Email template types
 */
export type EmailTemplateType = 
  | 'welcome_user'
  | 'claim_submitted'
  | 'claim_submitted_user'
  | 'claim_submitted_manager'
  | 'claim_approved'
  | 'claim_rejected'
  | 'user_created'
  | 'password_reset';

/**
 * Template selector function
 * Maps email type to the corresponding template function
 */
export function getTemplate(type: EmailTemplateType, data: any): { subject: string; html: string } {
  switch (type) {
    case 'welcome_user':
      return welcomeUserTemplate(data);
    case 'claim_submitted':
    case 'claim_submitted_user':
      return claimSubmittedUserTemplate(data);
    case 'claim_submitted_manager':
      return claimSubmittedManagerTemplate(data);
    case 'claim_approved':
      return claimApprovedTemplate(data);
    case 'claim_rejected':
      return claimRejectedTemplate(data);
    case 'user_created':
      return userCreatedTemplate(data);
    case 'password_reset':
      return passwordResetTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}
