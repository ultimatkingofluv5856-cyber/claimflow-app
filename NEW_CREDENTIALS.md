# New Supabase Credentials Reference

## Project Details
- **Project Name:** jluzssnjbwykkhomxomy
- **Dashboard URL:** https://app.supabase.com
- **Project URL:** https://jluzssnjbwykkhomxomy.supabase.co

## API Keys
- **Publishable Key (Anon Key):** sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB
- **JWT Token (Anon Key):** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXpzc25qYnd5a2tob214b215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDc5NTgsImV4cCI6MjA4ODk2Mzk1OH0.WSRutLRhrqEEr3FGFVJOw73kBEFvUJbuv0fkfYcBo9U

## Environment Variables (.env)
```
VITE_SUPABASE_PROJECT_ID="jluzssnjbwykkhomxomy"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB"
VITE_SUPABASE_URL="https://jluzssnjbwykkhomxomy.supabase.co"
```

## Default Admin Account
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** Super Admin
- **Password Hash (SHA-256):** 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9

## What Needs to Be Done

1. Open Supabase Dashboard: https://app.supabase.com
2. Select project: jluzssnjbwykkhomxomy
3. Go to SQL Editor
4. Copy and paste all SQL from: `supabase/migrations/complete_schema.sql`
5. Click Run to execute

## Databases & Tables to Be Created

### Public Schema Tables:
- users
- sessions
- claims
- expense_items
- transactions
- app_lists
- company_settings
- notifications
- audit_logs

### Storage Buckets:
- claim-attachments (public)
- company-assets (public)
- user-avatars (public)

## Configuration Files Updated
- ✓ .env
- ✓ supabase/config.toml

## Documentation Files Created
- ✓ MIGRATION_SUMMARY.md
- ✓ SUPABASE_MIGRATION_GUIDE.md
- ✓ supabase/migrations/complete_schema.sql
- ✓ apply_schema.ps1

---
All credentials are fresh and ready to use. The new Supabase instance is empty and waiting for the schema to be applied.
