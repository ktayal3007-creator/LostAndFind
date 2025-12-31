# Task: Enhance Chat System with Advanced Messaging & Attachments

## Plan

- [x] Step 1: Database Schema Updates (Completed)
  - [x] Add attachment fields to chat_messages table
  - [x] Create storage bucket for chat attachments
  - [x] Update RLS policies for attachments

- [x] Step 2: Backend API Updates (Completed)
  - [x] Add sendMessageWithAttachment function
  - [x] Add file upload utilities
  - [x] Update message fetching to include attachments

- [x] Step 3: Message Input Enhancements (Completed)
  - [x] Add paste detection for text and images
  - [x] Add image preview component for pasted images
  - [x] Add clipboard image handling

- [x] Step 4: Attachment Upload UI (Completed)
  - [x] Add paperclip icon next to input
  - [x] Create file picker dialog
  - [x] Add file type validation
  - [x] Add upload progress indicator
  - [x] Add file preview before sending

- [x] Step 5: Message Display with Attachments (Completed)
  - [x] Update message component to show attachments
  - [x] Add image viewer for image attachments
  - [x] Add document download for file attachments
  - [x] Add file type icons

- [x] Step 6: Chat List Management (WhatsApp-like) (Completed)
  - [x] Add long-press detection on chat items
  - [x] Create context menu for delete option
  - [x] Implement delete chat functionality
  - [x] Update chat list to respect deletion

- [x] Step 7: Testing & Validation (Completed)
  - [x] Test paste functionality
  - [x] Test file uploads
  - [x] Test chat deletion
  - [x] Test message reappearance after deletion
  - [x] Run lint check

## Notes
- Chat deletion is user-specific (already implemented with deleted_by_user_ids)
- Messages after deletion should reappear (already handled by RPC function)
- Attachment support added to database and UI
- WhatsApp-style UX patterns implemented
- All features completed and tested
