# Chat Deletion Quick Reference

## 🎯 What Was Fixed

**Problem:** When User A deleted a chat and User B sent a new message, User A never saw it.

**Solution:** Implemented WhatsApp-like soft delete with automatic chat restoration.

---

## ✅ New Behavior

### User Deletes Chat
```
1. User clicks "Delete Chat"
2. Deletion timestamp recorded in database
3. Chat disappears from user's list
4. Old messages hidden for that user
```

### Other User Sends Message
```
1. Message saved normally (never blocked)
2. Chat automatically reappears for user who deleted it
3. Only new messages (after deletion) are visible
4. Unread badge and notifications work normally
```

---

## 🔧 Technical Changes

### Database
- ✅ New table: `chat_user_deletions` (tracks deletion timestamps)
- ✅ New function: `get_user_conversations_with_deletions()` (shows chats with new messages)
- ✅ New function: `get_conversation_messages_for_user()` (filters messages by timestamp)
- ✅ Updated: `delete_chat_for_user()` (uses timestamps instead of array)

### Frontend
- ✅ `getChatConversationsForUser()` - Uses new RPC function
- ✅ `getConversationMessages()` - Now requires `userId` parameter
- ✅ `ChatDialog.tsx` - Passes `userId` when loading messages

### Types
- ✅ Added `user_deleted_at?: string | null` to `ChatConversationWithDetails`
- ✅ Added `has_new_messages?: boolean` to `ChatConversationWithDetails`

---

## 📝 Key Features

### ✅ Soft Delete Per User
- Deletion is local to each user
- Other user's view is unaffected
- No data is permanently deleted

### ✅ Automatic Restoration
- New message automatically restores chat
- No manual action required
- Works independently for each user

### ✅ Message Filtering
- Old messages (before deletion) are hidden
- New messages (after deletion) are visible
- Chat appears as fresh conversation

### ✅ Never Blocks Delivery
- Deletion never prevents message delivery
- Messages always saved to database
- Sender is never blocked

---

## 🧪 Testing Checklist

### Basic Flow
- [ ] User A deletes chat → Chat disappears
- [ ] User B sends message → Message saved
- [ ] User A refreshes → Chat reappears
- [ ] User A opens chat → Only new message visible

### Both Users Delete
- [ ] User A deletes at 10:00
- [ ] User B deletes at 10:30
- [ ] User A sends message at 11:00
- [ ] Chat reappears for User B (11:00 > 10:30)

### Multiple Deletions
- [ ] User A deletes, chat restores, deletes again
- [ ] Each deletion updates timestamp
- [ ] Messages filtered by latest deletion time

### Conclusion Requirement
- [ ] Item reporter can't delete without conclusion
- [ ] Error message shown
- [ ] After conclusion, deletion works

---

## 🔍 Debugging

### Chat doesn't reappear?
```sql
-- Check if new messages exist after deletion
SELECT 
  m.created_at as message_time,
  d.deleted_at as deletion_time,
  m.created_at > d.deleted_at as should_show
FROM chat_messages m
JOIN chat_user_deletions d ON d.conversation_id = m.conversation_id
WHERE d.user_id = 'USER_ID' AND m.conversation_id = 'CONV_ID'
ORDER BY m.created_at DESC;
```

### Old messages still visible?
```typescript
// Ensure userId is passed to getConversationMessages
const messages = await getConversationMessages(conversationId, user.id);
// NOT: await getConversationMessages(conversationId); ❌
```

### Can't delete chat?
```sql
-- Check deletion validation
SELECT * FROM can_user_delete_chat('CONV_ID', 'USER_ID');
-- Returns: { can_delete: boolean, reason: text }
```

---

## 📊 Database Schema

### chat_user_deletions
```sql
id              UUID PRIMARY KEY
conversation_id UUID REFERENCES chat_conversations(id)
user_id         UUID REFERENCES profiles(id)
deleted_at      TIMESTAMPTZ NOT NULL
created_at      TIMESTAMPTZ NOT NULL
UNIQUE(conversation_id, user_id)
```

### Indexes
```sql
idx_chat_user_deletions_conversation (conversation_id)
idx_chat_user_deletions_user (user_id)
idx_chat_user_deletions_lookup (conversation_id, user_id)
```

---

## 🎨 User Experience

### Before
```
User A: Deletes chat
User B: Sends message
User A: Never sees message ❌
```

### After
```
User A: Deletes chat
User B: Sends message
User A: Chat reappears with new message ✅
```

---

## 🚀 Migration Applied

**File:** `supabase/migrations/00024_fix_chat_deletion_with_timestamps.sql`

**Status:** ✅ Applied Successfully

**Includes:**
- ✅ Table creation
- ✅ RLS policies
- ✅ Helper functions
- ✅ Data migration
- ✅ Permissions

---

## 📚 Related Files

### Documentation
- `CHAT_DELETION_FIX.md` - Complete technical documentation

### Code Files
- `src/db/api.ts` - Updated API functions
- `src/types/types.ts` - Updated TypeScript types
- `src/components/chat/ChatDialog.tsx` - Updated to pass userId

### Database
- `supabase/migrations/00024_fix_chat_deletion_with_timestamps.sql` - Migration file

---

**Version:** 2.3.0  
**Date:** December 21, 2025  
**Status:** ✅ COMPLETE  
**Behavior:** 🎯 WhatsApp-Like

---

**Quick Test:**
1. Delete a chat
2. Have other user send message
3. Refresh your chat list
4. Chat should reappear with only new message ✅
