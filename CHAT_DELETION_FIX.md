# Chat Deletion Fix - WhatsApp-Like Behavior

## 🎯 Problem Fixed

**Previous Behavior (Broken):**
- When User A deleted a chat, they were added to `deleted_by_user_ids` array
- User B sends a new message
- The chat's `updated_at` was updated, but User A remained in `deleted_by_user_ids`
- Result: **User A never saw the new message** ❌

**New Behavior (Fixed):**
- When User A deletes a chat, a timestamp is recorded in `chat_user_deletions` table
- User B sends a new message
- The new message's `created_at` is after User A's deletion timestamp
- Result: **Chat automatically reappears for User A with only new messages** ✅

---

## 🏗️ Architecture Changes

### Database Schema

#### New Table: `chat_user_deletions`
```sql
CREATE TABLE chat_user_deletions (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id),
  user_id UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(conversation_id, user_id)
);
```

**Purpose:** Track when each user deleted each conversation

**Key Features:**
- One record per user per conversation
- `deleted_at` timestamp determines which messages to hide
- Automatic restoration when new messages arrive

---

### New Database Functions

#### 1. `get_user_conversations_with_deletions(p_user_id UUID)`
**Returns:** All conversations with deletion info
- `user_deleted_at`: When user deleted this chat (NULL if not deleted)
- `has_new_messages`: TRUE if messages exist after deletion

**Logic:**
```sql
-- Show chat if:
-- 1. Never deleted (user_deleted_at IS NULL), OR
-- 2. Has messages after deletion (has_new_messages = TRUE)
```

#### 2. `get_conversation_messages_for_user(p_conversation_id UUID, p_user_id UUID)`
**Returns:** Messages filtered by deletion timestamp

**Logic:**
```sql
-- Return messages where:
-- created_at > user_deleted_at (or all if not deleted)
```

#### 3. `delete_chat_for_user(p_conversation_id UUID, p_user_id UUID)`
**Action:** Records deletion timestamp

**Logic:**
```sql
INSERT INTO chat_user_deletions (conversation_id, user_id, deleted_at)
VALUES (p_conversation_id, p_user_id, NOW())
ON CONFLICT (conversation_id, user_id)
DO UPDATE SET deleted_at = NOW();
```

---

## 📝 Frontend Changes

### API Updates

#### `getChatConversationsForUser(userId: string)`
**Before:**
```typescript
// Filtered by deleted_by_user_ids array
const filtered = data.filter(conv => {
  return !conv.deleted_by_user_ids.includes(userId);
});
```

**After:**
```typescript
// Uses new RPC function with deletion timestamps
const { data } = await supabase.rpc('get_user_conversations_with_deletions', {
  p_user_id: userId
});

// Show chats that are:
// 1. Never deleted, OR
// 2. Have new messages after deletion
const filtered = data.filter(conv => {
  return conv.user_deleted_at === null || conv.has_new_messages === true;
});
```

#### `getConversationMessages(conversationId: string, userId: string)`
**Before:**
```typescript
// Returned ALL messages
const { data } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('conversation_id', conversationId);
```

**After:**
```typescript
// Returns only messages after deletion timestamp
const { data } = await supabase.rpc('get_conversation_messages_for_user', {
  p_conversation_id: conversationId,
  p_user_id: userId
});
```

### Component Updates

#### `ChatDialog.tsx`
**Change:** Pass `userId` to `getConversationMessages`
```typescript
// Before
const data = await getConversationMessages(conversationId);

// After
const data = await getConversationMessages(conversationId, user.id);
```

---

## 🔄 How It Works

### Scenario: User A Deletes Chat, User B Sends Message

#### Step 1: User A Deletes Chat
```
Time: 2025-01-15 10:00:00

Action: User A clicks "Delete Chat"

Database:
  INSERT INTO chat_user_deletions
  VALUES (conv_id, user_a_id, '2025-01-15 10:00:00')

Result: Chat disappears from User A's list
```

#### Step 2: User B Sends Message
```
Time: 2025-01-15 11:00:00

Action: User B sends "Hey, I found your item!"

Database:
  INSERT INTO chat_messages
  VALUES (conv_id, user_b_id, 'Hey, I found your item!', '2025-01-15 11:00:00')

Result: Message saved normally (no blocking)
```

#### Step 3: User A Fetches Chats
```
Time: 2025-01-15 11:01:00

Action: User A opens chat list

Query:
  SELECT * FROM get_user_conversations_with_deletions(user_a_id)
  
Check:
  - user_deleted_at = '2025-01-15 10:00:00'
  - last_message.created_at = '2025-01-15 11:00:00'
  - has_new_messages = TRUE (11:00 > 10:00)

Result: Chat APPEARS in User A's list ✅
```

#### Step 4: User A Opens Chat
```
Action: User A clicks on the chat

Query:
  SELECT * FROM get_conversation_messages_for_user(conv_id, user_a_id)
  WHERE created_at > '2025-01-15 10:00:00'

Result: Only shows messages after 10:00:00
  - Old messages (before deletion): HIDDEN
  - New message (11:00:00): VISIBLE ✅
```

---

## ✅ Correct Behavior Checklist

### ✅ Requirement 1: Soft Delete Per User
- [x] Deletion is local to each user
- [x] Other user's view is unaffected
- [x] No data is permanently deleted

### ✅ Requirement 2: Hide Old Messages
- [x] Messages before deletion timestamp are hidden
- [x] Only new messages after deletion are shown
- [x] Chat appears as "fresh conversation"

### ✅ Requirement 3: Automatic Restoration
- [x] New message automatically restores chat
- [x] No manual action required
- [x] Works for both users independently

### ✅ Requirement 4: Never Block Messages
- [x] Deletion never prevents message delivery
- [x] Messages are always saved to database
- [x] Sender is never blocked

### ✅ Requirement 5: Unread Badge Works
- [x] New messages trigger unread count
- [x] Notifications work normally
- [x] Read/unread status tracked correctly

### ✅ Requirement 6: Both Users Can Delete
- [x] Each user can delete independently
- [x] Both deletions tracked separately
- [x] Chat restores for each user on new message

---

## 🧪 Testing Scenarios

### Test 1: Basic Deletion and Restoration
```
1. User A deletes chat
   ✅ Chat disappears from User A's list
   ✅ Chat still visible to User B

2. User B sends message
   ✅ Message saved successfully
   ✅ Chat reappears for User A
   ✅ Only new message visible to User A
```

### Test 2: Both Users Delete
```
1. User A deletes chat at 10:00
2. User B deletes chat at 10:30
3. User A sends message at 11:00
   ✅ Chat reappears for User B (11:00 > 10:30)
   ✅ Chat visible to User A (they sent it)
   ✅ User B only sees message from 11:00
```

### Test 3: Multiple Deletions
```
1. User A deletes chat at 10:00
2. User B sends message at 11:00
3. User A sees message, then deletes again at 12:00
4. User B sends another message at 13:00
   ✅ Chat reappears for User A
   ✅ Only message from 13:00 visible
   ✅ Messages from 11:00 are hidden
```

### Test 4: Conclusion Requirement
```
1. User A is item reporter
2. User A tries to delete without conclusion
   ✅ Deletion blocked with message
   ✅ "Please complete conclusion before deleting chat"

3. User A concludes item
4. User A deletes chat
   ✅ Deletion succeeds
```

---

## 🔍 Edge Cases Handled

### Edge Case 1: Rapid Message Exchange
**Scenario:** User B sends multiple messages quickly after User A deletes
**Result:** ✅ All messages after deletion are visible

### Edge Case 2: Simultaneous Deletion
**Scenario:** Both users delete at nearly the same time
**Result:** ✅ Each deletion tracked independently with precise timestamps

### Edge Case 3: Old Conversation Restoration
**Scenario:** Chat deleted months ago, new message arrives
**Result:** ✅ Chat reappears with only the new message

### Edge Case 4: Message Sent During Deletion
**Scenario:** User B sends message while User A is deleting
**Result:** ✅ Timestamp comparison ensures correct visibility

### Edge Case 5: Re-deletion After Restoration
**Scenario:** User A deletes, chat restores, User A deletes again
**Result:** ✅ New deletion timestamp recorded, process repeats

---

## 📊 Database Migration

### Migration File
`supabase/migrations/00024_fix_chat_deletion_with_timestamps.sql`

### What It Does
1. ✅ Creates `chat_user_deletions` table
2. ✅ Sets up RLS policies
3. ✅ Creates helper functions
4. ✅ Updates existing functions
5. ✅ Migrates old `deleted_by_user_ids` data
6. ✅ Grants necessary permissions

### Data Migration
```sql
-- Migrates existing deletions to new table
INSERT INTO chat_user_deletions (conversation_id, user_id, deleted_at)
SELECT 
  cc.id,
  unnest(cc.deleted_by_user_ids),
  cc.updated_at -- Best guess for deletion time
FROM chat_conversations cc
WHERE cc.deleted_by_user_ids IS NOT NULL;
```

---

## 🎨 User Experience

### Before Fix
```
User A: "I deleted this chat"
User B: *sends message*
User A: "Where's the message? I don't see it!"
❌ Poor UX - messages lost
```

### After Fix
```
User A: "I deleted this chat"
User B: *sends message*
User A: "Oh, a new message appeared!"
✅ Great UX - just like WhatsApp
```

---

## 🚀 Performance Considerations

### Indexes Created
```sql
CREATE INDEX idx_chat_user_deletions_conversation ON chat_user_deletions(conversation_id);
CREATE INDEX idx_chat_user_deletions_user ON chat_user_deletions(user_id);
CREATE INDEX idx_chat_user_deletions_lookup ON chat_user_deletions(conversation_id, user_id);
```

### Query Optimization
- ✅ Indexed lookups for deletion timestamps
- ✅ Efficient filtering in database functions
- ✅ Minimal frontend filtering logic

### Scalability
- ✅ One record per user per conversation (bounded growth)
- ✅ No array operations (better than `deleted_by_user_ids`)
- ✅ Fast timestamp comparisons

---

## 📚 API Reference

### Frontend Functions

#### `getChatConversationsForUser(userId: string)`
**Returns:** `ChatConversationWithDetails[]`
**Filters:** Shows chats with `user_deleted_at === null` OR `has_new_messages === true`

#### `getConversationMessages(conversationId: string, userId: string)`
**Returns:** `ChatMessage[]`
**Filters:** Messages where `created_at > user_deleted_at`

#### `deleteChatForUser(conversationId: string, userId: string)`
**Returns:** `{ success: boolean, message: string }`
**Action:** Records deletion timestamp in `chat_user_deletions`

### Database Functions

#### `get_user_conversations_with_deletions(p_user_id UUID)`
**Returns:** Conversations with deletion info
**Fields:** All conversation fields + `user_deleted_at`, `has_new_messages`

#### `get_conversation_messages_for_user(p_conversation_id UUID, p_user_id UUID)`
**Returns:** Filtered messages
**Logic:** `WHERE created_at > deleted_at OR deleted_at IS NULL`

#### `delete_chat_for_user(p_conversation_id UUID, p_user_id UUID)`
**Returns:** `{ success: boolean, message: text }`
**Action:** `INSERT ... ON CONFLICT DO UPDATE SET deleted_at = NOW()`

---

## 🎯 Summary

### What Changed
✅ **Database:** New `chat_user_deletions` table with timestamps
✅ **Functions:** New RPC functions for filtered queries
✅ **API:** Updated to use timestamp-based filtering
✅ **Types:** Added `user_deleted_at` and `has_new_messages` fields

### What Stayed the Same
✅ **UI:** No visual changes
✅ **User Actions:** Delete button works the same
✅ **Message Sending:** No changes to send logic
✅ **Conclusion:** Still required before deletion

### Result
✅ **WhatsApp-like behavior:** Deletion is local, chats auto-restore
✅ **No blocked messages:** Delivery always works
✅ **Clean history:** Old messages hidden, new messages shown
✅ **Independent control:** Each user manages their own view

---

## 🔧 Troubleshooting

### Issue: Chat doesn't reappear after new message
**Check:**
1. Verify `has_new_messages` is TRUE in database
2. Check `created_at` of new message > `deleted_at`
3. Ensure frontend filter logic is correct

### Issue: Old messages still visible
**Check:**
1. Verify `getConversationMessages` passes `userId`
2. Check `deleted_at` timestamp in `chat_user_deletions`
3. Ensure RPC function is being called

### Issue: Can't delete chat
**Check:**
1. User must be participant
2. If item reporter, must conclude first
3. Check `can_user_delete_chat` function result

---

**Version:** 2.3.0  
**Date:** December 21, 2025  
**Status:** ✅ PRODUCTION READY  
**Behavior:** 🎯 WhatsApp-Like Soft Delete

---

**Note:** This implementation follows WhatsApp's chat deletion model where deletion is local to each user and chats automatically restore when new messages arrive.
