# How to Apply the Password Resets Migration

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com/
2. Select your project
3. Go to **SQL Editor** on the left sidebar
4. Click **New query**
5. Copy and paste the entire content from `supabase/migrations/20260314_add_password_resets_table.sql`
6. Click **Run** (or press Ctrl+Enter)
7. You should see: `Success. No rows returned`

## Option 2: Using Supabase CLI

```bash
supabase db push
```

This will apply all pending migrations from your `supabase/migrations/` folder.

## Option 3: Manual SQL Execution

If you have direct database access, run this SQL:

```sql
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON public.password_resets
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Verify the Table Was Created

In Supabase Dashboard:
1. Go to **Table Editor** on the left
2. You should see a new `password_resets` table in the list
3. Click it to view the columns: `id`, `email`, `token`, `expires_at`, `created_at`

## After Migration

Once the table is created, the "Forgot Password?" feature will work correctly:
1. Click "Forgot Password?" on the login screen
2. Enter your email address
3. Click "Send Reset Link"
4. You should see: "Check your email for the password reset link."
5. The reset link will be: `http://localhost:8081/reset-password?email=[EMAIL]&token=[TOKEN]`
6. The token will be logged to the browser console for testing purposes

---

**Questions?** Check the app console (F12 → Console) to see detailed error messages during testing.
