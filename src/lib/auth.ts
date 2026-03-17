import SHA256 from 'crypto-js/sha256';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail } from '@/lib/send-email';

export type UserRole = 'User' | 'Manager' | 'Admin' | 'Super Admin';

export interface AppUser {
  email: string;
  name: string;
  role: UserRole;
  profile_picture_url?: string | null;
}

export interface SessionData {
  token: string;
  user: AppUser;
}

function hashPassword(password: string): string {
  return SHA256(password).toString();
}

export async function login(email: string, password: string): Promise<{ ok: boolean; message?: string; session?: SessionData }> {
  email = email.trim().toLowerCase();
  if (!email || !password) return { ok: false, message: 'Email and password required.' };

  const hashedInput = hashPassword(password);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) return { ok: false, message: 'Invalid email or password.' };
  if ((user as any).password_hash !== hashedInput) return { ok: false, message: 'Invalid email or password.' };
  if ((user as any).active === false) return { ok: false, message: 'Account is deactivated.' };

  // Create session token
  const seed = email + Date.now() + Math.random();
  const token = SHA256(seed).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: sessionError } = await supabase.from('sessions').insert({
    token,
    user_email: email,
    role: (user as any).role,
    expires_at: expiresAt,
  });

  if (sessionError) return { ok: false, message: 'Failed to create session.' };

  const session: SessionData = {
    token,
    user: { email: (user as any).email, name: (user as any).name, role: (user as any).role as UserRole, profile_picture_url: (user as any).profile_picture_url },
  };

  return { ok: true, session };
}

export async function verifyToken(token: string): Promise<AppUser | null> {
  if (!token) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('name, email, role, profile_picture_url')
    .eq('email', (data as any).user_email)
    .single();

  if (!userData) return null;

  return {
    email: (userData as any).email,
    name: (userData as any).name,
    role: (userData as any).role as UserRole,
    profile_picture_url: (userData as any).profile_picture_url,
  };
}

export async function logout(token: string) {
  if (token) {
    await supabase.from('sessions').delete().eq('token', token);
  }
}

export function isAdmin(role: UserRole) {
  return role === 'Admin' || role === 'Super Admin';
}

export function isManagerOrAbove(role: UserRole) {
  return role === 'Manager' || role === 'Admin' || role === 'Super Admin';
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message?: string }> {
  email = email.trim().toLowerCase();
  if (!email) return { ok: false, message: 'Email is required.' };

  // Check if user exists
  const { data: user, error } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single();

  if (error || !user) return { ok: false, message: 'If this email is registered, you will receive a password reset link.' };

  // Create a reset token (valid for 1 hour)
  const seed = email + Date.now() + Math.random();
  const resetToken = SHA256(seed).toString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  try {
    const { error: insertError } = await supabase.from('password_resets').insert({
      email,
      token: resetToken,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('Password reset insert error:', insertError);
      return { ok: false, message: 'Failed to create reset request. Please try again.' };
    }

    // Generate the reset link
    const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;

    // Send email with the reset link
    const emailResult = await sendEmail(email, 'password_reset', {
      resetLink,
      expiresIn: '1 hour',
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still return success since the token was created - user can get it from console for testing
      return { ok: true, message: 'If this email is registered, you will receive a password reset link.' };
    }

    console.log(`📧 Password reset email sent to ${email}`);
    console.log(`Reset link (for testing): ${resetLink}`);

    return { ok: true, message: 'If this email is registered, you will receive a password reset link.' };
  } catch (error) {
    console.error('Password reset error:', error);
    return { ok: false, message: 'An error occurred. Please try again.' };
  }
}

export async function resetPassword(email: string, resetToken: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
  email = email.trim().toLowerCase();
  
  if (!email || !resetToken || !newPassword) {
    return { ok: false, message: 'Email, reset token, and password are required.' };
  }

  if (newPassword.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters long.' };
  }

  try {
    // Verify the reset token
    const { data: resetRequest, error: selectError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('token', resetToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (selectError || !resetRequest) {
      return { ok: false, message: 'Invalid or expired reset token.' };
    }

    // Update the password
    const hashedPassword = hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', email);

    if (updateError) {
      return { ok: false, message: 'Failed to update password. Please try again.' };
    }

    // Delete the reset token so it can't be reused
    await supabase.from('password_resets').delete().eq('id', (resetRequest as any).id);

    // Clear the session storage
    sessionStorage.removeItem(`reset_token_${email}`);

    return { ok: true, message: 'Password has been reset successfully.' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { ok: false, message: 'An error occurred. Please try again.' };
  }
}

export { hashPassword };
