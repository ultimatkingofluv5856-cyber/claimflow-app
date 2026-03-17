# Supabase Migration Guide for New Instance

## New Supabase Instance Details
- **URL**: https://jluzssnjbwykkhomxomy.supabase.co
- **Project ID**: jluzssnjbwykkhomxomy
- **Publishable Key**: sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXpzc25qYnd5a2tob214b215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDc5NTgsImV4cCI6MjA4ODk2Mzk1OH0.WSRutLRhrqEEr3FGFVJOw73kBEFvUJbuv0fkfYcBo9U

## Steps to Apply Schema

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Login to your account and select the new project: **jluzssnjbwykkhomxomy**
3. Navigate to **SQL Editor**
4. Create a new query
5. Copy the entire content from `supabase/migrations/complete_schema.sql`
6. Paste it into the SQL Editor
7. Click **Run** to execute all migrations at once

**Note**: This script includes:
- All table schemas
- All RLS (Row Level Security) policies
- All storage buckets
- Default indexes
- Initial data (admin user, company settings, dropdown values)

### Option 2: Using Supabase CLI (If CLI is set up)

```bash
cd c:\Users\Kulo5\Downloads\claimflow-pro-main\ (2)\claimflow-pro-main
supabase db push --linked
```

This will execute all pending migrations to the new instance.

### Option 3: Manual Individual Migrations

If you need to apply migrations individually:

1. Execute migration files in this order:
   - `supabase/migrations/20260304193914_8dc62815-49cb-497b-87b9-d10cb4650158.sql`
   - `supabase/migrations/20260306083542_6d973e48-a1cf-494d-a5e4-66f90b2f9be6.sql`
   - `supabase/migrations/20260306083845_a1ba9a4c-1c47-4143-8dd3-f8061768013e.sql`
   - `supabase/migrations/20260307062555_3c49e67f-b3f3-47c8-add1-9e33d619f475.sql`
   - `supabase/migrations/20260309082456_7efea780-3ca9-4782-b124-be3d0a9528cc.sql`

2. Use the SQL Editor for each file

## Configuration Updated

The following files have been updated with the new credentials:
- `.env` - Updated VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
- `supabase/config.toml` - Updated project_id

## Database Schema Overview

### Tables Created:
1. **users** - User accounts with roles (User, Manager, Admin, Super Admin)
2. **sessions** - Custom session tokens for authentication
3. **claims** - Expense claims with approval workflow
4. **expense_items** - Line items within claims
5. **transactions** - Financial transactions and balance tracking
6. **app_lists** - Dropdown master data (categories, projects)
7. **company_settings** - Global application configuration
8. **notifications** - User notifications
9. **audit_logs** - Activity audit trail

### Storage Buckets Created:
1. **claim-attachments** - For claim documents/receipts
2. **company-assets** - For company branding and assets
3. **user-avatars** - For user profile pictures

### RLS Policies:
All RLS policies are configured with "Allow all access" because this app uses custom session-based authentication (not Supabase Auth). Authentication is handled entirely in the application logic.

## Verification

After applying the schema:

1. Check the **Authentication** section in Supabase Dashboard
2. Verify all tables appear in the **Table Editor**
3. Confirm storage buckets exist in the **Storage** section
4. Test the connection by running the app locally

## Default Admin Account

- **Email**: admin@example.com
- **Password**: admin123 (SHA-256 hashed in database)
- **Role**: Super Admin

## Notes

- The database uses custom session tokens stored in the `sessions` table
- All RLS policies allow full access because authorization is handled in the application
- The default admin can create other users through the app
- Make sure to change the default admin password after first login
