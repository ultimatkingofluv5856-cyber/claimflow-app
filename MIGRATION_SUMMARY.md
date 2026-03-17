# Supabase Migration Summary - ClaimFlow Pro

## ✓ Changes Completed

### 1. Configuration Files Updated
- **`.env`** - Updated with new Supabase credentials:
  - `VITE_SUPABASE_PROJECT_ID="jluzssnjbwykkhomxomy"`
  - `VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_4asrkSm-8ZTQpqApszfynA_WoHOPQsB"`
  - `VITE_SUPABASE_URL="https://jluzssnjbwykkhomxomy.supabase.co"`

- **`supabase/config.toml`** - Updated with new project ID:
  - `project_id = "jluzssnjbwykkhomxomy"`

### 2. Database Schema Files Created
- **`supabase/migrations/complete_schema.sql`** - Complete schema with:
  - All 9 database tables (users, sessions, claims, expense_items, transactions, app_lists, company_settings, notifications, audit_logs)
  - All RLS (Row Level Security) policies for custom session-based authentication
  - 3 storage buckets (claim-attachments, company-assets, user-avatars)
  - All necessary indexes for performance
  - Default data (admin user, company settings, dropdown values)

### 3. Migration Guides Created
- **`SUPABASE_MIGRATION_GUIDE.md`** - Detailed step-by-step instructions
- **`apply_schema.ps1`** - Helper PowerShell script with setup checklist

## 🚀 Next Steps: Apply the Schema to Your New Instance

### Step 1: Go to Supabase Dashboard
1. Open: https://app.supabase.com
2. Login with your account
3. Select project: **jluzssnjbwykkhomxomy**

### Step 2: Run the SQL Schema
1. Navigate to **SQL Editor** section
2. Click **"New query"**
3. Open the file: `supabase/migrations/complete_schema.sql`
4. Copy ALL the SQL content
5. Paste into the SQL Editor
6. Click **"Run"** to execute

⏱️ **Execution time:** ~5-10 seconds

### Step 3: Verify the Setup
After execution, verify in the Supabase Dashboard:
1. Check **Table Editor** - Should see 9 tables
2. Check **Storage** - Should see 3 buckets
3. Check **Authentication** - Custom session setup confirmed

### Step 4: Run Your Application
```bash
npm install
npm run dev
```

## 📋 What Gets Created

### Database Tables (9 total)
| Table | Purpose |
|-------|---------|
| users | User accounts with roles |
| sessions | Custom authentication tokens |
| claims | Expense claim submissions |
| expense_items | Line items in claims |
| transactions | Financial transaction history |
| app_lists | Dropdown master data |
| company_settings | Global app configuration |
| notifications | User notifications |
| audit_logs | Activity audit trail |

### Storage Buckets (3 total)
| Bucket | Purpose |
|--------|---------|
| claim-attachments | Claim documents & receipts |
| company-assets | Branding & assets |
| user-avatars | User profile pictures |

### Default Data
- **Admin Account:**
  - Email: `admin@example.com`
  - Password: `admin123` (SHA-256 hashed)
  - Role: `Super Admin`

- **Sample Categories:**
  - Travel, Food & Accommodation, Office Supplies, Transportation, Communication, Miscellaneous

- **Sample Projects:**
  - Head Office (HO), Site A (SA), Site B (SB)

## 🔒 Security Notes

### RLS (Row Level Security)
- All tables have RLS enabled
- Policies allow full access (application handles authorization)
- This is by design since the app uses custom session tokens, not Supabase Auth

### Authentication Method
- **Custom session-based authentication** (not Supabase Auth)
- Sessions stored in `sessions` table
- Token validation happens in application logic
- Supports multiple user roles: User, Manager, Admin, Super Admin

### Important
- Change the default admin password immediately after first login
- The anon key is used for client-side database access
- All authorization is handled in the application layer

## 📚 File Locations

```
Project Root/
├── .env                                          # (UPDATED) Supabase credentials
├── supabase/
│   ├── config.toml                              # (UPDATED) Project ID
│   └── migrations/
│       ├── 20260304193914_*.sql                 # Original migrations
│       ├── 20260306083542_*.sql                 # Original migrations
│       ├── 20260306083845_*.sql                 # Original migrations
│       ├── 20260307062555_*.sql                 # Original migrations
│       ├── 20260309082456_*.sql                 # Original migrations
│       └── complete_schema.sql                  # (NEW) Combined schema
├── SUPABASE_MIGRATION_GUIDE.md                  # (NEW) Detailed guide
└── apply_schema.ps1                             # (NEW) Setup helper script
```

## ✅ Verification Checklist

After applying the schema:
- [ ] Schema executed successfully in SQL Editor
- [ ] All 9 tables visible in Table Editor
- [ ] All 3 storage buckets created
- [ ] Default admin user created
- [ ] Application starts with `npm run dev`
- [ ] Can login with admin@example.com / admin123
- [ ] Dashboard loads without errors

## ⚠️ Important Notes

1. **The new instance is empty** - You'll need to run the SQL from `complete_schema.sql`
2. **No data migration** - This is a fresh schema setup
3. **Custom auth** - The app doesn't use Supabase's built-in auth
4. **RLS is permissive** - Security is enforced at the application layer
5. **Change admin password** - First step after login

## 🆘 Troubleshooting

**SQL execution fails?**
- Check for special characters in the SQL file
- Ensure the entire SQL is copied (don't cut off at the end)
- Try executing in smaller chunks if needed

**Tables not appearing?**
- Refresh the Supabase Dashboard
- Check the SQL execution result for errors
- Verify you're in the correct project

**Connection issues in app?**
- Verify `.env` file has correct credentials
- Clear browser cache and localStorage
- Check browser console for errors
- Ensure the SQL schema was fully executed

**Questions?**
- See `SUPABASE_MIGRATION_GUIDE.md` for more details
- Check individual migration files for specific changes

---

**Status:** ✓ All configuration files updated. Ready for schema application in Supabase Dashboard.

**Last Updated:** March 13, 2026
