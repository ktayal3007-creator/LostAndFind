# Task: Implement Image Upload Size Increase & WhatsApp-like Message Status System

## Plan

- [x] Step 1: Increase Image Upload Size to 10MB
  - [x] Update ReportLostPage.tsx file size validation
  - [x] Update ReportFoundPage.tsx file size validation
  - [x] Update storage.ts upload function validation
  - [x] Test image upload with larger files

- [x] Step 2: Add Message Status Database Schema
  - [x] Verify existing status fields (delivered, read, delivered_at, read_at)
  - [x] Add status enum field if needed
  - [x] Create indexes for performance

- [x] Step 3: Update Backend API Functions
  - [x] Update sendMessage to set initial status as 'sent'
  - [x] Create updateMessageStatus function
  - [x] Update markMessagesAsRead to update status and read_at
  - [x] Add auto-delivery status update logic

- [x] Step 4: Create Message Status UI Components
  - [x] Create MessageStatusIcon component with tick icons
  - [x] Implement single tick (sent)
  - [x] Implement double grey tick (delivered)
  - [x] Implement double blue tick (read)

- [x] Step 5: Update ChatDialog Component
  - [x] Add status display to message bubbles
  - [x] Implement real-time status updates
  - [x] Add read tracking when chat opens
  - [x] Update message polling to include status

- [x] Step 6: Testing & Validation
  - [x] Test image upload with 10MB files
  - [x] Test message status flow (sent → delivered → read)
  - [x] Test real-time status updates
  - [x] Run lint validation
  - [x] Test edge cases (offline, deleted messages)

## Notes
- Database already has delivered, delivered_at, read, read_at fields ✅
- Added proper status tracking logic ✅
- WhatsApp-like behavior implemented: sent (1 tick) → delivered (2 grey) → read (2 blue) ✅
- All lint checks passed ✅
- Image upload size increased to 10MB across all components ✅
