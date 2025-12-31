# FINDIT.AI - Image Upload & Auto-fill Updates

## Plan

- [x] Step 1: Add Image Upload to Database
  - [x] Create storage bucket for item images
  - [x] Add image_url column to lost_items table (already existed)
  - [x] Add image_url column to found_items table (already existed)
  - [x] Update types in types.ts

- [x] Step 2: Add Image Upload to Report Forms
  - [x] Add image upload field to ReportLostPage
  - [x] Add image upload field to ReportFoundPage
  - [x] Implement image upload to Supabase storage
  - [x] Show image preview before upload
  - [x] Validate file size (max 1MB) and type

- [x] Step 3: Display Images in Item Cards
  - [x] Update ItemCard to show item images (already had support)
  - [x] Update ItemDetailPage to show images
  - [x] Add placeholder for items without images (already had support)

- [x] Step 4: Add Name Collection on Signup
  - [x] Add full_name field to profiles table
  - [x] Update signup form to collect name
  - [x] Update profile type

- [x] Step 5: Auto-fill Contact Info for Logged-in Users
  - [x] Remove contact_name, contact_email, contact_phone from forms when logged in
  - [x] Auto-populate from user profile
  - [x] Show info message about auto-filled data

- [x] Step 6: Fix Homepage Stats Auto-update
  - [x] Add count functions to API
  - [x] Update HomePage to use count functions
  - [x] Stats now update every 5 seconds via polling

- [x] Step 7: Testing & Lint
  - [x] Run lint check (passed)

## Completed Features

### Image Upload
- Created storage bucket: `app-8e6wgm5ndzi9_item_images`
- Added image upload utility in `src/lib/storage.ts`
- Image validation: max 1MB, JPG/PNG/WEBP only
- Image preview before upload
- Upload progress indication
- Images displayed in ItemCard and ItemDetailPage

### Auto-fill Contact Info
- Removed manual contact fields from report forms
- Contact info auto-populated from user profile (full_name, email, phone)
- Alert message shows what info will be included
- Full name collected during signup

### Stats Auto-update
- Added count functions: `getLostItemsCount`, `getFoundItemsCount`, `getReturnedItemsCount`
- HomePage polls every 5 seconds for updates
- Stats show total counts, not just recent items

## Files Modified
- `src/lib/storage.ts` - Created image upload utility
- `src/pages/ReportLostPage.tsx` - Added image upload, removed contact fields
- `src/pages/ReportFoundPage.tsx` - Added image upload, removed contact fields
- `src/pages/ItemDetailPage.tsx` - Added image display
- `src/pages/HomePage.tsx` - Updated to use count functions
- `src/db/api.ts` - Added count functions
- `src/types/types.ts` - Already had image_url support
- `src/contexts/AuthContext.tsx` - Already updated for full_name
- `src/pages/SignupPage.tsx` - Already updated for full_name
- Database: Storage bucket created, full_name column added

## Notes
- Image upload max size: 1MB
- Supported formats: JPG, PNG, WEBP
- Storage bucket naming: app-8e6wgm5ndzi9_item_images
- Auto-fill contact info from user profile when logged in
- Stats update every 5 seconds automatically
