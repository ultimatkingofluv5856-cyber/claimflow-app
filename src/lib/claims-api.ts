import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from '@/lib/auth';

// ============= ADMIN CHECK =============
export async function checkAdminExists(): Promise<boolean> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .or('role.eq.Admin,role.eq.Super Admin');
  
  if (error) return true; // Assume admin exists on error for security
  return (count || 0) > 0;
}

export async function createFirstAdmin(data: { name: string; email: string; password: string }): Promise<{ ok: boolean; message?: string }> {
  // First verify no admin exists
  const adminExists = await checkAdminExists();
  if (adminExists) {
    return { ok: false, message: 'An admin account already exists. Please contact your administrator.' };
  }

  const email = data.email.trim().toLowerCase();
  
  // Check if email already exists
  const { data: existing } = await supabase.from('users').select('email').eq('email', email).single();
  if (existing) {
    return { ok: false, message: 'This email is already registered.' };
  }

  // Create the admin user
  const { error } = await supabase.from('users').insert({
    email,
    password_hash: hashPassword(data.password),
    name: data.name.trim(),
    role: 'Admin',
    advance_amount: 0,
    active: true,
  });

  if (error) {
    return { ok: false, message: 'Failed to create admin account. Please try again.' };
  }

  await logAudit('first_admin_created', email, 'user', email, 'First admin account created');
  return { ok: true, message: 'Admin account created successfully.' };
}

// ============= EMAIL NOTIFICATIONS =============
async function sendEmailNotification(type: string, recipientEmail: string, data?: any) {
  try {
    const settings = await getCompanySettings();
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        type,
        recipientEmail,
        data: { ...data, companyName: settings?.company_name || 'Claims Management System' },
      },
    });
    if (error) console.warn('Email notification failed:', error);
  } catch (e) {
    console.warn('Email notification error:', e);
  }
}


// ============= DROPDOWN DATA =============
export async function getDropdownOptions() {
  const { data, error } = await supabase.from('app_lists').select('*').eq('active', true);
  if (error || !data) return { projects: [], categories: [], projectCodes: [], byProject: {} as Record<string, string[]> };

  const categories = [...new Set(
    (data as any[]).filter(r => String(r.type || '').toLowerCase() === 'category')
      .map(r => String(r.value || '').trim()).filter(Boolean)
  )].sort();

  const projects = (data as any[])
    .filter(r => String(r.type || '').toLowerCase() === 'project')
    .map(r => ({ name: String(r.value || '').trim(), code: String(r.project_code || '').trim() }))
    .filter(p => p.name);

  const projectCodes = (data as any[])
    .filter(r => String(r.type || '').toLowerCase() === 'projectcode')
    .map(r => ({ code: String(r.project_code || '').trim(), project: String(r.project || '').trim() }))
    .filter(c => c.code);

  const byProject: Record<string, string[]> = {};
  projectCodes.forEach(pc => {
    const key = pc.project || '';
    if (!byProject[key]) byProject[key] = [];
    byProject[key].push(pc.code);
  });

  return { projects, categories, projectCodes, byProject };
}

// ============= COMPANY SETTINGS =============
export async function getCompanySettings() {
  const { data } = await supabase.from('company_settings').select('*').limit(1).single();
  return data as any;
}

export async function updateCompanySettings(settings: any) {
  const { data: existing } = await supabase.from('company_settings').select('id').limit(1).single();
  if (existing) {
    const { error } = await supabase.from('company_settings').update({ ...settings, updated_at: new Date().toISOString() } as any).eq('id', (existing as any).id);
    if (error) throw error;
  }
}

// ============= DASHBOARD =============
export async function getDashboardSummary(userEmail: string, userRole: string) {
  const role = userRole.toLowerCase();

  const { data: claims } = await supabase.from('claims').select('*');
  const { data: txs } = await supabase.from('transactions').select('reference_id, user_email').eq('type', 'claim_submitted');

  const claimOwnerMap: Record<string, string> = {};
  txs?.forEach((t: any) => { if (t.reference_id) claimOwnerMap[t.reference_id] = String(t.user_email || '').toLowerCase(); });

  const processedClaims = (claims || []).map((c: any) => ({
    id: c.claim_id,
    amount: parseFloat(c.grand_total || (c.total_with_bill + c.total_without_bill) || 0),
    status: String(c.status || '').toLowerCase(),
    managerStatus: String(c.manager_approval_status || '').toLowerCase(),
    managerEmail: String(c.manager_email || '').toLowerCase(),
    userEmail: c.user_email?.toLowerCase() || claimOwnerMap[c.claim_id] || '',
  }));

  if (['admin', 'super admin', 'manager'].includes(role)) {
    let total = 0, totalAmount = 0, pending = 0, pendingManager = 0, pendingAdmin = 0;
    const myEmail = userEmail.toLowerCase();

    for (const c of processedClaims) {
      let include = role === 'admin' || role === 'super admin';
      if (role === 'manager') {
        include = c.managerEmail === myEmail || c.userEmail === myEmail;
      }
      if (!include) continue;

      total++;
      totalAmount += c.amount;
      if (c.status.includes('pending')) pending++;
      if (c.status === 'pending manager approval') {
        if (role === 'manager') { if (c.managerEmail === myEmail) pendingManager++; }
        else pendingManager++;
      }
      if (c.status === 'pending admin approval') pendingAdmin++;
    }

    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

    return { role: userRole, totalClaims: total, totalUsers: userCount || 0, totalAmount, pendingClaims: pending, pendingManagerClaims: pendingManager, pendingAdminClaims: pendingAdmin };
  } else {
    let myClaims = 0, myAmount = 0;
    const myEmail = userEmail.toLowerCase();
    for (const c of processedClaims) {
      if (c.userEmail === myEmail) { myClaims++; myAmount += c.amount; }
    }
    const myBalance = await getCurrentBalance(myEmail);
    return { role: 'User', myClaims, myAmount, myBalance };
  }
}

// ============= BALANCE =============
export async function getCurrentBalance(email: string): Promise<number> {
  const { data: lastTx } = await supabase
    .from('transactions').select('balance_after').eq('user_email', email)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (lastTx && (lastTx as any).balance_after != null) return parseFloat((lastTx as any).balance_after);

  const { data: user } = await supabase.from('users').select('advance_amount').eq('email', email).maybeSingle();
  if (user) return parseFloat((user as any).advance_amount) || 0;
  return 0;
}

// ============= CLAIMS =============
export async function submitClaim(claim: {
  site: string;
  expenses: Array<{ category: string; projectCode: string; claimDate: string; description: string; amountWithBill: number; amountWithoutBill: number }>;
  fileIds?: string[];
}, userEmail: string, userName: string) {
  const claimID = 'C-' + Date.now();
  
  // Generate claim_number in format CLM-0001, CLM-0002, etc.
  const { data: existingClaims } = await supabase.from('claims').select('claim_number', { count: 'exact' }).order('created_at', { ascending: false }).limit(1);
  let nextSequence = 1;
  if (existingClaims && existingClaims.length > 0) {
    const lastClaimNumber = (existingClaims[0] as any)?.claim_number;
    if (lastClaimNumber) {
      const match = lastClaimNumber.match(/\d+/);
      if (match) {
        nextSequence = parseInt(match[0]) + 1;
      }
    }
  }
  const claimNumber = `CLM-${String(nextSequence).padStart(4, '0')}`;
  
  let totalWithBill = 0, totalWithoutBill = 0;

  const expenseItems = claim.expenses.map(e => {
    totalWithBill += (e.amountWithBill || 0);
    totalWithoutBill += (e.amountWithoutBill || 0);
    return {
      claim_id: claimID,
      category: e.category,
      project_code: e.projectCode || '',
      expense_date: e.claimDate || null,
      description: e.description,
      amount_with_bill: e.amountWithBill || 0,
      amount_without_bill: e.amountWithoutBill || 0,
    };
  });

  // Get manager
  const { data: userRecord } = await supabase.from('users').select('manager_email').eq('email', userEmail).single();
  const managerEmail = (userRecord as any)?.manager_email || null;

  const grandTotal = totalWithBill + totalWithoutBill;

  // Get company workflow settings
  const companySettings = await getCompanySettings();
  const requireManager = companySettings?.require_manager_approval ?? true;
  const autoApproveThreshold = parseFloat(companySettings?.auto_approve_below || 0);

  let status = 'Pending Admin Approval';
  let managerApprovalStatus = 'Approved';

  // Auto-approve if below threshold
  if (autoApproveThreshold > 0 && grandTotal <= autoApproveThreshold) {
    status = 'Approved';
    managerApprovalStatus = 'Approved';
  } else if (requireManager && managerEmail) {
    status = 'Pending Manager Approval';
    managerApprovalStatus = 'Pending';
  }

  // Get current balance
  const currentBalance = await getCurrentBalance(userEmail);
  const newBalance = currentBalance - grandTotal;

  const { error: cErr } = await supabase.from('claims').insert({
    claim_id: claimID,
    claim_number: claimNumber,
    user_email: userEmail,
    submitted_by: userName,
    site_name: claim.site,
    status,
    manager_email: managerEmail,
    manager_approval_status: managerApprovalStatus,
    total_with_bill: totalWithBill,
    total_without_bill: totalWithoutBill,
    drive_file_ids: claim.fileIds || [],
  });
  if (cErr) throw new Error('Claim insert failed: ' + cErr.message);

  const { error: eErr } = await supabase.from('expense_items').insert(expenseItems);
  if (eErr) throw new Error('Expense items insert failed: ' + eErr.message);

  const { error: tErr } = await supabase.from('transactions').insert({
    user_email: userEmail,
    admin_email: userEmail,
    type: 'claim_submitted',
    reference_id: claimID,
    credit: 0,
    debit: grandTotal,
    balance_after: newBalance,
    description: `Claim submission: ${claimID}`,
  });
  if (tErr) throw new Error('Transaction insert failed: ' + tErr.message);

  // Notifications & audit
  await logAudit('claim_submitted', userEmail, 'claim', claimID, `Amount: ₹${grandTotal}`);
  if (status === 'Approved') {
    // Auto-approved: create credit transaction
    const bal = await getCurrentBalance(userEmail);
    await supabase.from('transactions').insert({
      user_email: userEmail,
      admin_email: 'system',
      type: 'claim_approved',
      reference_id: claimID,
      credit: grandTotal,
      debit: 0,
      balance_after: bal + grandTotal,
      description: `Claim ${claimID} auto-approved (below threshold)`,
    });
    await createNotification(userEmail, 'Claim Auto-Approved', `Your claim ${claimID} (₹${grandTotal.toLocaleString('en-IN')}) was auto-approved.`, 'success', claimID);
  } else {
    if (status === 'Pending Manager Approval' && managerEmail) {
      await createNotification(managerEmail, 'New Claim for Approval', `${userName} submitted claim ${claimID} (₹${grandTotal.toLocaleString('en-IN')})`, 'info', claimID);
    }
    await createNotification(userEmail, 'Claim Submitted', `Your claim ${claimID} has been submitted successfully.`, 'success', claimID);
  }

  // Send email notification - map expense items for template
  const expenseItemsForEmail = expenseItems.map(e => ({
    description: e.description,
    category: e.category,
    amount: (e.amount_with_bill || 0) + (e.amount_without_bill || 0)
  }));

  sendEmailNotification('claim_submitted_user', userEmail, { 
    claim_number: claimNumber, 
    total_amount: grandTotal, 
    employee_name: userName,
    currency: '₹',
    items: expenseItemsForEmail
  });
  if (status === 'Pending Manager Approval' && managerEmail) {
    sendEmailNotification('claim_submitted_manager', managerEmail, { 
      claim_number: claimNumber,
      employee_name: userName,
      total_amount: grandTotal,
      currency: '₹',
      items: expenseItemsForEmail,
      approve_link: '#', // Links would need backend URL config
      reject_link: '#'
    });
  }

  return { ok: true, id: claimNumber, message: `Claim ${claimNumber} submitted. Status: ${status}` };
}

// ============= APPROVALS =============
export async function getPendingManagerClaims(userEmail: string, userRole: string) {
  const { data: claims } = await supabase.from('claims').select('*')
    .or('status.eq.Pending Manager Approval,manager_approval_status.eq.Pending')
    .order('created_at', { ascending: false });

  if (!claims) return [];
  const myEmail = userEmail.toLowerCase();
  const role = userRole.toLowerCase();

  return (claims as any[]).filter(c => {
    if (role === 'admin' || role === 'super admin') return true;
    if (role === 'manager') return String(c.manager_email || '').toLowerCase() === myEmail;
    return false;
  }).map(c => ({
    claimId: c.claim_id,
    date: c.created_at,
    submittedBy: c.submitted_by,
    userEmail: c.user_email,
    site: c.site_name,
    totalWithBill: parseFloat(c.total_with_bill || 0),
    totalWithoutBill: parseFloat(c.total_without_bill || 0),
    amount: parseFloat(c.grand_total || (c.total_with_bill + c.total_without_bill) || 0),
    managerEmail: c.manager_email,
    status: c.status,
  }));
}

export async function getPendingAdminClaims() {
  const { data: claims } = await supabase.from('claims').select('*').order('created_at', { ascending: false });
  if (!claims) return [];

  return (claims as any[]).filter(c => {
    const status = String(c.status || '').toLowerCase();
    const managerStatus = String(c.manager_approval_status || '').toLowerCase();
    return status === 'pending admin approval' || (managerStatus === 'approved' && status.includes('pending') && !status.includes('approved'));
  }).map(c => ({
    claimId: c.claim_id,
    date: c.created_at,
    submittedBy: c.submitted_by,
    userEmail: c.user_email,
    site: c.site_name,
    totalWithBill: parseFloat(c.total_with_bill || 0),
    totalWithoutBill: parseFloat(c.total_without_bill || 0),
    amount: parseFloat(c.grand_total || (c.total_with_bill + c.total_without_bill) || 0),
    status: c.status,
  }));
}

export async function approveClaimAsManager(claimId: string, approverEmail: string, description?: string) {
  const { data: claim } = await supabase.from('claims').select('*').eq('claim_id', claimId).single();
  if (!claim) throw new Error('Claim not found');
  
  const updates: any = {
    status: 'Pending Admin Approval',
    manager_approval_status: 'Approved',
    manager_approval_date: new Date().toISOString(),
  };
  if (description) updates.manager_description = description;
  const { error } = await supabase.from('claims').update(updates).eq('claim_id', claimId);
  if (error) throw error;

  await logAudit('claim_manager_approved', approverEmail, 'claim', claimId);
  if (claim) {
    await createNotification((claim as any).user_email, 'Claim Approved by Manager', `Your claim ${claimId} has been approved by the manager and forwarded to admin.`, 'success', claimId);
    sendEmailNotification('claim_approved', (claim as any).user_email, { 
      claim_no: claimId, 
      total: (claim as any).grand_total || (claim as any).amount || 0,
      approved_by: approverEmail,
      employee_name: (claim as any).user_name || (claim as any).submitted_by || 'there',
      currency: '₹',
      status: 'Pending Admin Approval'
    });
  }
}

export async function approveClaimAsAdmin(claimId: string, approverEmail: string, description?: string) {
  const { data: claim } = await supabase.from('claims').select('*').eq('claim_id', claimId).single();
  if (!claim) throw new Error('Claim not found');

  const c = claim as any;
  const amount = parseFloat(c.grand_total || (c.total_with_bill + c.total_without_bill) || 0);

  const updates: any = {
    status: 'Approved',
    admin_email: approverEmail,
    admin_approval_date: new Date().toISOString(),
  };
  if (description) updates.admin_description = description;
  const { error } = await supabase.from('claims').update(updates).eq('claim_id', claimId);
  if (error) throw error;

  // Create settlement/credit transaction for the approved claim
  const currentBalance = await getCurrentBalance(c.user_email);
  await supabase.from('transactions').insert({
    user_email: c.user_email,
    admin_email: approverEmail,
    type: 'claim_approved',
    reference_id: claimId,
    credit: amount,
    debit: 0,
    balance_after: currentBalance + amount,
    description: `Claim ${claimId} approved - settlement`,
  });

  await logAudit('claim_admin_approved', approverEmail, 'claim', claimId, `Amount: ₹${amount}`);
  await createNotification(c.user_email, 'Claim Fully Approved', `Your claim ${claimId} has been approved by admin. ₹${amount.toLocaleString('en-IN')} settled.`, 'success', claimId);
  sendEmailNotification('claim_approved', c.user_email, { 
    claim_no: claimId, 
    total: amount, 
    approved_by: approverEmail,
    employee_name: c.user_name || 'there',
    currency: '₹',
    status: 'Fully Approved'
  });
}

export async function rejectClaim(claimId: string, reason: string, rejectorEmail: string, rejectorRole: string) {
  const updates: any = { status: 'Rejected', rejection_reason: reason };
  if (rejectorRole.toLowerCase() === 'manager') {
    updates.manager_approval_status = 'Rejected';
  } else {
    updates.admin_email = rejectorEmail;
    updates.admin_approval_date = new Date().toISOString();
  }

  const { error } = await supabase.from('claims').update(updates).eq('claim_id', claimId);
  if (error) throw error;

  // Refund transaction
  const { data: claim } = await supabase.from('claims').select('user_email, grand_total, total_with_bill, total_without_bill').eq('claim_id', claimId).single();
  if (claim) {
    const amount = parseFloat((claim as any).grand_total || ((claim as any).total_with_bill + (claim as any).total_without_bill) || 0);
    const currentBalance = await getCurrentBalance((claim as any).user_email);
    await supabase.from('transactions').insert({
      user_email: (claim as any).user_email,
      admin_email: rejectorEmail,
      type: 'claim_rejected_refund',
      reference_id: claimId,
      credit: amount,
      debit: 0,
      balance_after: currentBalance + amount,
      description: `Claim ${claimId} rejected - refund`,
    });

    await logAudit('claim_rejected', rejectorEmail, 'claim', claimId, `Reason: ${reason}`);
    await createNotification((claim as any).user_email, 'Claim Rejected', `Your claim ${claimId} was rejected. Reason: ${reason}`, 'error', claimId);
    sendEmailNotification('claim_rejected', (claim as any).user_email, { claimId, amount, rejectedBy: rejectorEmail, reason });
  }
}

// ============= CLAIM HISTORY =============
export async function getClaimsHistory(userEmail: string, userRole: string, filters?: { userEmail?: string; startDate?: string; endDate?: string }) {
  const role = userRole.toLowerCase();
  let query = supabase.from('claims').select('*, expense_items(*)');

  if (role === 'admin' || role === 'super admin') {
    if (filters?.userEmail) query = query.eq('user_email', filters.userEmail);
  } else if (role === 'manager') {
    // Get managed users
    const { data: managed } = await supabase.from('users').select('email').eq('manager_email', userEmail);
    const emails = [userEmail, ...(managed || []).map((u: any) => u.email)];
    query = query.in('user_email', emails);
  } else {
    query = query.eq('user_email', userEmail);
  }

  if (filters?.startDate) query = query.gte('created_at', new Date(filters.startDate).toISOString());
  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setDate(end.getDate() + 1);
    query = query.lt('created_at', end.toISOString());
  }

  query = query.order('created_at', { ascending: false });
  const result = await query;
  return (result.data || []).map((c: any) => ({
    claimId: c.claim_number || c.claim_id,
    claimIdInternal: c.claim_id,
    date: c.created_at,
    submittedBy: c.submitted_by,
    userEmail: c.user_email,
    site: c.site_name,
    amount: parseFloat(c.grand_total || (c.total_with_bill + c.total_without_bill) || 0),
    totalWithBill: parseFloat(c.total_with_bill || 0),
    totalWithoutBill: parseFloat(c.total_without_bill || 0),
    status: c.status,
    rejectionReason: c.rejection_reason,
    fileIds: c.drive_file_ids || [],
    expenses: (c.expense_items || []).map((e: any) => ({
      category: e.category,
      projectCode: e.project_code,
      claimDate: e.expense_date,
      description: e.description,
      amountWithBill: parseFloat(e.amount_with_bill || 0),
      amountWithoutBill: parseFloat(e.amount_without_bill || 0),
      amount: parseFloat(e.amount_with_bill || 0) + parseFloat(e.amount_without_bill || 0),
    })),
  }));
}

export async function getClaimById(claimId: string) {
  const { data } = await supabase.from('claims').select('*, expense_items(*)').eq('claim_id', claimId).single();
  if (!data) return null;
  const c = data as any;
  return {
    claimId: c.claim_number || c.claim_id,
    claimIdInternal: c.claim_id,
    date: c.created_at,
    submittedBy: c.submitted_by,
    userEmail: c.user_email,
    site: c.site_name,
    amount: parseFloat(c.grand_total || (c.total_with_bill + c.total_without_bill) || 0),
    totalWithBill: parseFloat(c.total_with_bill || 0),
    totalWithoutBill: parseFloat(c.total_without_bill || 0),
    status: c.status,
    managerEmail: c.manager_email,
    managerApprovalStatus: c.manager_approval_status,
    managerApprovalDate: c.manager_approval_date,
    adminEmail: c.admin_email,
    adminApprovalDate: c.admin_approval_date,
    rejectionReason: c.rejection_reason,
    expenses: (c.expense_items || []).map((e: any) => ({
      category: e.category,
      projectCode: e.project_code,
      claimDate: e.expense_date,
      description: e.description,
      amountWithBill: parseFloat(e.amount_with_bill || 0),
      amountWithoutBill: parseFloat(e.amount_without_bill || 0),
      amount: parseFloat(e.amount_with_bill || 0) + parseFloat(e.amount_without_bill || 0),
    })),
    fileIds: c.drive_file_ids || [],
  };
}

// Helper function - remove after debugging

// ============= TRANSACTIONS =============
export async function getTransactions(userEmail: string, userRole: string, filters?: { userEmail?: string; startDate?: string; endDate?: string; type?: string }) {
  const role = userRole.toLowerCase();
  let query = supabase.from('transactions').select('*');

  if (role === 'admin' || role === 'super admin') {
    if (filters?.userEmail) query = query.eq('user_email', filters.userEmail);
  } else if (role === 'manager') {
    const { data: managed } = await supabase.from('users').select('email').eq('manager_email', userEmail);
    const emails = [userEmail, ...(managed || []).map((u: any) => u.email)];
    if (filters?.userEmail && emails.includes(filters.userEmail)) {
      query = query.eq('user_email', filters.userEmail);
    } else if (!filters?.userEmail) {
      query = query.in('user_email', emails);
    } else {
      return [];
    }
  } else {
    query = query.eq('user_email', userEmail);
  }

  if (filters?.startDate) query = query.gte('created_at', new Date(filters.startDate).toISOString());
  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setDate(end.getDate() + 1);
    query = query.lt('created_at', end.toISOString());
  }
  if (filters?.type) query = query.eq('type', filters.type);

  query = query.order('created_at', { ascending: false });
  const result = await query;
  return (result.data || []).map((t: any) => ({
    email: t.user_email,
    type: t.type,
    credit: parseFloat(t.credit || 0),
    debit: parseFloat(t.debit || 0),
    description: t.description,
    claimId: t.reference_id || '',
    admin: t.admin_email || '',
    balanceAfter: parseFloat(t.balance_after || 0),
    createdAt: t.created_at,
  }));
}

// ============= USER MANAGEMENT =============
export async function getAllUsers() {
  const { data, error } = await supabase.from('users').select('*').order('name');
  if (error) throw error;
  
  const users = [];
  for (const u of (data || []) as any[]) {
    const balance = await getCurrentBalance(u.email);
    users.push({
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.created_at,
      advance: parseFloat(u.advance_amount) || 0,
      balance,
      manager: u.manager_email || '',
      active: u.active,
    });
  }
  return users;
}

export async function createUser(newUser: { email: string; password: string; name: string; role: string; advance: number; manager: string }) {
  const email = newUser.email.trim().toLowerCase();

  // Check if user exists using maybeSingle to avoid 406 errors
  const { data: existing } = await supabase.from('users').select('email').eq('email', email).maybeSingle();
  if (existing) throw new Error('Email already exists.');

  const managerEmail = newUser.manager?.trim().toLowerCase() || null;
  if (managerEmail) {
    const { data: mgr } = await supabase.from('users').select('email').eq('email', managerEmail).maybeSingle();
    if (!mgr) throw new Error('Manager email not found.');
  }

  const { error } = await supabase.from('users').insert({
    email,
    password_hash: hashPassword(newUser.password),
    name: newUser.name.trim(),
    role: newUser.role || 'User',
    advance_amount: newUser.advance || 0,
    manager_email: managerEmail,
    active: true,
  });
  if (error) throw error;

  // Create initial advance transaction if > 0
  if (newUser.advance > 0) {
    await supabase.from('transactions').insert({
      user_email: email,
      admin_email: email,
      type: 'initial_advance',
      credit: newUser.advance,
      debit: 0,
      balance_after: newUser.advance,
      description: 'Initial advance balance',
    });
  }

  await logAudit('user_created', email, 'user', email, `Role: ${newUser.role}, Advance: ₹${newUser.advance}`);
  await sendEmailNotification('user_created', email, { name: newUser.name, role: newUser.role, advance: newUser.advance });
  return { ok: true, message: `User ${newUser.name} created successfully.` };
}

export async function updateUser(payload: { originalEmail: string; name?: string; email?: string; role?: string; password?: string; manager?: string }) {
  const oldEmail = payload.originalEmail.trim().toLowerCase();
  const updates: any = {};
  if (payload.name) updates.name = payload.name;
  if (payload.role) updates.role = payload.role;
  if (payload.password) updates.password_hash = hashPassword(payload.password);
  if (payload.manager !== undefined) updates.manager_email = payload.manager || null;
  if (payload.email && payload.email.toLowerCase() !== oldEmail) updates.email = payload.email.toLowerCase();

  const { error } = await supabase.from('users').update(updates).eq('email', oldEmail);
  if (error) throw error;
  await logAudit('user_updated', oldEmail, 'user', oldEmail, JSON.stringify(updates));
}

export async function deleteUser(email: string) {
  const { error } = await supabase.from('users').delete().eq('email', email.toLowerCase());
  if (error) throw error;
  await logAudit('user_deleted', email, 'user', email);
}

export async function addUserAdvance(userEmail: string, amount: number, adminEmail: string) {
  const currentBalance = await getCurrentBalance(userEmail);
  const { error } = await supabase.from('transactions').insert({
    user_email: userEmail,
    admin_email: adminEmail,
    type: 'manual_advance',
    credit: amount,
    debit: 0,
    balance_after: currentBalance + amount,
    description: 'Manual advance/credit added by admin',
  });
  if (error) throw error;
  await logAudit('advance_added', adminEmail, 'user', userEmail, `Amount: ₹${amount}`);
  await createNotification(userEmail, 'Advance Added', `₹${amount.toLocaleString('en-IN')} advance has been added to your balance by admin.`, 'success');
}

// ============= USER BALANCE SUMMARY =============
export async function getUserBalanceSummary(userEmail: string, userRole: string) {
  const role = userRole.toLowerCase();
  const { data: users } = await supabase.from('users').select('*');
  const { data: claims } = await supabase.from('claims').select('*');

  if (!users) return [];

  const filteredUsers = (users as any[]).filter(u => {
    const uEmail = u.email.toLowerCase();
    if (role === 'admin' || role === 'super admin') return true;
    if (role === 'manager') return uEmail === userEmail.toLowerCase() || u.manager_email?.toLowerCase() === userEmail.toLowerCase();
    return uEmail === userEmail.toLowerCase();
  });

  const summary = [];
  for (const u of filteredUsers) {
    const uEmail = u.email.toLowerCase();
    let total = 0, pending = 0, approved = 0, rejected = 0;
    
    (claims || []).forEach((c: any) => {
      if (c.user_email?.toLowerCase() === uEmail) {
        const amt = parseFloat(c.grand_total || (c.total_with_bill + c.total_without_bill) || 0);
        const status = String(c.status || '').toLowerCase();
        total += amt;
        if (status.includes('pending')) pending += amt;
        else if (status.includes('approved')) approved += amt;
        else if (status.includes('reject')) rejected += amt;
      }
    });

    const balance = await getCurrentBalance(uEmail);
    summary.push({
      name: u.name,
      email: u.email,
      role: u.role,
      initialAdvance: parseFloat(u.advance_amount || 0),
      totalClaimAmount: total,
      pendingClaims: pending,
      approvedClaims: approved,
      rejectedClaims: rejected,
      currentBalance: balance,
    });
  }
  return summary;
}

// ============= APP LISTS MANAGEMENT =============
export async function getAppLists() {
  const { data } = await supabase.from('app_lists').select('*').order('type').order('value');
  return (data || []) as any[];
}

export async function addAppListItem(item: { type: string; value: string; project_code?: string; project?: string }) {
  const { error } = await supabase.from('app_lists').insert({ ...item, active: true });
  if (error) throw error;
}

export async function deleteAppListItem(id: string) {
  const { error } = await supabase.from('app_lists').delete().eq('id', id);
  if (error) throw error;
}

// ============= GET MANAGER'S ASSIGNED USERS WITH BALANCES =============
export async function getManagerAssignedUsersWithBalances(managerEmail: string) {
  const { data: managedUsers } = await supabase.from('users').select('*').eq('manager_email', managerEmail).order('name');
  
  if (!managedUsers) return [];
  
  const usersWithBalance = [];
  for (const u of (managedUsers || []) as any[]) {
    const balance = await getCurrentBalance(u.email);
    const { data: lastTx } = await supabase.from('transactions')
      .select('created_at')
      .eq('user_email', u.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    usersWithBalance.push({
      name: u.name,
      email: u.email,
      balance,
      lastTransactionDate: (lastTx as any)?.created_at || null,
    });
  }
  return usersWithBalance;
}

// ============= USERS DIRECTORY (for dropdowns) =============
export async function getUsersDirectory() {
  const { data } = await supabase.from('users').select('name, email').order('name');
  return (data || []) as any[];
}

// ============= NOTIFICATIONS =============
export async function getNotifications(userEmail: string) {
  const { data } = await supabase.from('notifications' as any).select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data || []) as any[];
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications' as any).update({ is_read: true } as any).eq('id', id);
}

export async function markAllNotificationsRead(userEmail: string) {
  await supabase.from('notifications' as any).update({ is_read: true } as any).eq('user_email', userEmail).eq('is_read', false);
}

export async function createNotification(userEmail: string, title: string, message: string, type: string = 'info', referenceId?: string) {
  await supabase.from('notifications' as any).insert({
    user_email: userEmail,
    title,
    message,
    type,
    reference_id: referenceId || null,
  } as any);
}

// ============= AUDIT LOGS =============
export async function logAudit(action: string, performedBy: string, targetType: string, targetId?: string, details?: string) {
  await supabase.from('audit_logs' as any).insert({
    action,
    performed_by: performedBy,
    target_type: targetType,
    target_id: targetId || null,
    details: details || null,
  } as any);
}

export async function getAuditLogs() {
  const { data } = await supabase.from('audit_logs' as any).select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return (data || []) as any[];
}

// ============= DASHBOARD CHART DATA =============
export async function getDashboardChartData(userEmail: string, userRole: string) {
  const role = userRole.toLowerCase();
  let claimsQuery = supabase.from('claims').select('*');
  
  if (role === 'user') {
    claimsQuery = claimsQuery.eq('user_email', userEmail);
  } else if (role === 'manager') {
    // Manager sees own + managed users
    const { data: managed } = await supabase.from('users').select('email').eq('manager_email', userEmail);
    const emails = [userEmail, ...(managed || []).map((u: any) => u.email)];
    claimsQuery = claimsQuery.in('user_email', emails);
  }

  const { data: claims } = await claimsQuery;
  if (!claims) return { monthly: [], byCategory: [], byStatus: [] };

  // Monthly trend (last 6 months)
  const monthMap: Record<string, { month: string; withBill: number; withoutBill: number; total: number; count: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    monthMap[key] = { month: key, withBill: 0, withoutBill: 0, total: 0, count: 0 };
  }

  // By status
  const statusCount: Record<string, number> = {};
  
  for (const c of claims as any[]) {
    const d = new Date(c.created_at);
    const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    const wb = parseFloat(c.total_with_bill || 0);
    const wob = parseFloat(c.total_without_bill || 0);
    if (monthMap[key]) {
      monthMap[key].withBill += wb;
      monthMap[key].withoutBill += wob;
      monthMap[key].total += wb + wob;
      monthMap[key].count++;
    }
    const status = c.status || 'Unknown';
    statusCount[status] = (statusCount[status] || 0) + 1;
  }

  // By category from expense_items
  const { data: expenses } = await supabase.from('expense_items').select('category, amount_with_bill, amount_without_bill');
  const catMap: Record<string, number> = {};
  for (const e of (expenses || []) as any[]) {
    const cat = e.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + parseFloat(e.amount_with_bill || 0) + parseFloat(e.amount_without_bill || 0);
  }

  return {
    monthly: Object.values(monthMap),
    byCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    byStatus: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
  };
}
