# Claim History Attachments - Testing Guide

## Issue Fixed
When clicking the action button to view claim details in Claim History, attachments were not showing in the preview modal.

## Root Cause
1. Duplicate import statement for `Eye`, `Download`, `Paperclip` from lucide-react that caused "Identifier has already been declared" error
2. Desktop table action buttons were always using the first file's URL instead of each individual file's URL
3. Missing Supabase integration in ClaimHistoryView for generating public URLs

## Changes Made

### 1. **src/components/views/ClaimHistoryView.tsx**
- ✅ Removed duplicate lucide-react import (line 17)
- ✅ Added Supabase import for storage public URL generation
- ✅ Added `getPublicUrl()` helper function to generate public URLs for each file
- ✅ Fixed desktop table action buttons to use correct file URL for each attachment (was using `c.fileIds?.[0]?.url`, now using `getPublicUrl(file)`)
- ✅ Modal dialog properly passes fileIds to AttachmentPreview component

### 2. **src/components/views/AttachmentPreview.tsx**
- ✅ Component already correctly implements file preview and download functionality
- ✅ Uses public URL generation for file access
- ✅ Supports image preview, PDF iframe, and generic file downloads

### 3. **src/lib/claims-api.ts**
- ✅ `getClaimsHistory()` returns fileIds from `drive_file_ids` database column
- ✅ `getClaimById()` returns fileIds from `drive_file_ids` database column
- ✅ Both functions properly map the field to `fileIds` in response objects

## How It Works

1. When a claim is submitted in **SubmitClaimView**:
   - Files are uploaded via FileUpload component
   - Uploaded file paths are passed to `submitClaim()` as `fileIds`
   - These are stored in the database as `drive_file_ids` array

2. When viewing claim history in **ClaimHistoryView**:
   - Claim list is loaded with `getClaimsHistory()`
   - Each claim includes its `fileIds` array
   - Clicking "Details" or "Attachments" button calls `getClaimById()`
   - Modal opens with claim details + AttachmentPreview component

3. In the **AttachmentPreview** component:
   - Each file ID is converted to a public URL via Supabase storage
   - Files can be viewed (opens in new tab) or downloaded
   - Images show thumbnails with preview capability
   - PDFs show in iframe viewer
   - Other file types show icon with download option

## Testing Steps

1. **Submit a New Claim with Attachments**:
   - Go to "Submit Claim" tab
   - Fill in claim details
   - Upload 2-3 files (JPG, PDF, etc.)
   - Submit the claim

2. **View Claim History**:
   - Go to "Claim History" tab
   - Find your newly created claim in the list
   - Click "Details" or "Attachments" button

3. **Verify Attachments**:
   - Modal should open showing claim details
   - Attachments section should be visible with file count
   - Each file should show thumbnail (for images) or file icon
   - Eye icon and Download icon should be visible on hover
   - Clicking Eye should open file in new tab
   - Clicking Download should download the file

## Database Fields

| Table   | Column          | Type     | Purpose                              |
|---------|-----------------|----------|--------------------------------------|
| claims  | drive_file_ids  | TEXT[]   | Array of file paths from Supabase   |

## Storage Structure

Files are stored in Supabase 'claim-attachments' bucket with path format:
```
{claimId}/{timestamp}-{index}.{extension}
Example: C-1647360000123/1647360045000-0.jpg
```

## All Errors Fixed
✅ SyntaxError: Identifier 'Eye' has already been declared - FIXED (removed duplicate import)
✅ Attachment view/download links broken in desktop table - FIXED (use correct file URL)
✅ Attachments not showing in modal preview - FIXED (proper fileIds mapping & retrieval)

## Verification
All files compile without TypeScript errors. The implementation is complete and ready for testing.
