# Chat Deletion Flow Diagram

## 🔄 Complete Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHAT DELETION & RESTORATION FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: USER A DELETES CHAT                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

User A's View                    Database                      User B's View
┌──────────────┐                ┌──────────────┐              ┌──────────────┐
│ Chat List    │                │ chat_user_   │              │ Chat List    │
│              │                │ deletions    │              │              │
│ ✉️ Chat #123 │  ─────────────>│              │              │ ✉️ Chat #123 │
│ ✉️ Chat #456 │   DELETE       │ INSERT:      │              │ ✉️ Chat #456 │
│              │   CLICKED      │ conv: #123   │              │              │
└──────────────┘                │ user: A      │              └──────────────┘
                                │ time: 10:00  │
      ↓                         └──────────────┘                     ↓
                                                                     
┌──────────────┐                                               ┌──────────────┐
│ Chat List    │                                               │ Chat List    │
│              │                                               │              │
│ ✉️ Chat #456 │  ← Chat #123 HIDDEN                          │ ✉️ Chat #123 │
│              │                                               │ ✉️ Chat #456 │
└──────────────┘                                               └──────────────┘
                                                                     ↑
                                                               STILL VISIBLE


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: USER B SENDS NEW MESSAGE                                            │
└─────────────────────────────────────────────────────────────────────────────┘

User A's View                    Database                      User B's View
┌──────────────┐                ┌──────────────┐              ┌──────────────┐
│ Chat List    │                │ chat_        │              │ Chat #123    │
│              │                │ messages     │              │              │
│ ✉️ Chat #456 │                │              │              │ [Type here]  │
│              │                │ INSERT:      │  <───────────│ "Hey! Found  │
└──────────────┘                │ conv: #123   │   SEND MSG   │  your item!" │
                                │ sender: B    │              │              │
      ↓                         │ msg: "Hey!"  │              └──────────────┘
      ↓                         │ time: 11:00  │
      ↓                         └──────────────┘
      ↓                                ↓
      ↓                                ↓
      ↓                         ┌──────────────┐
      ↓                         │ COMPARISON:  │
      ↓                         │ 11:00 > 10:00│
      ↓                         │ = TRUE ✅    │
      ↓                         └──────────────┘
      ↓                                ↓
      ↓                                ↓
┌──────────────┐                      ↓                       ┌──────────────┐
│ Chat List    │  <───────────────────┘                       │ Chat #123    │
│              │   AUTO RESTORE                               │              │
│ 🔔 Chat #123 │   (has_new_messages = TRUE)                  │ ✓✓ Delivered │
│ ✉️ Chat #456 │                                              │              │
└──────────────┘                                               └──────────────┘
      ↑
   REAPPEARS!


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: USER A OPENS CHAT                                                   │
└─────────────────────────────────────────────────────────────────────────────┘

User A's View                    Database Query                User B's View
┌──────────────┐                ┌──────────────┐              ┌──────────────┐
│ Chat List    │                │ SELECT *     │              │ Chat #123    │
│              │                │ FROM msgs    │              │              │
│ 🔔 Chat #123 │  ─────────────>│ WHERE        │              │ Old Msg 1    │
│ ✉️ Chat #456 │   CLICK        │ created_at > │              │ Old Msg 2    │
│              │                │ 10:00        │              │ Old Msg 3    │
└──────────────┘                └──────────────┘              │ Hey! Found   │
                                       ↓                       │  your item!  │
      ↓                                ↓                       └──────────────┘
      ↓                         ┌──────────────┐                     ↑
      ↓                         │ RESULT:      │                ALL MESSAGES
      ↓                         │ Only msg     │                  VISIBLE
      ↓                         │ from 11:00   │
      ↓                         └──────────────┘
      ↓                                ↓
┌──────────────┐                      ↓
│ Chat #123    │  <───────────────────┘
│              │   FILTERED MESSAGES
│ Hey! Found   │   (Old messages HIDDEN)
│  your item!  │
│              │
│ [Type here]  │
└──────────────┘
      ↑
ONLY NEW MESSAGES!


┌─────────────────────────────────────────────────────────────────────────────┐
│ TIMELINE VISUALIZATION                                                      │
└─────────────────────────────────────────────────────────────────────────────┘

Time: 09:00 ─────────────────────────────────────────────────────────────────
              User A & B chatting normally
              ┌─────────────────────────────────────┐
              │ Old Message 1                       │
              │ Old Message 2                       │
              │ Old Message 3                       │
              └─────────────────────────────────────┘

Time: 10:00 ─────────────────────────────────────────────────────────────────
              ⚡ USER A DELETES CHAT
              ┌─────────────────────────────────────┐
              │ chat_user_deletions                 │
              │ deleted_at = 10:00 ← TIMESTAMP      │
              └─────────────────────────────────────┘
                         ↓
              ┌─────────────────────────────────────┐
              │ User A's View: Chat HIDDEN          │
              │ User B's View: Chat VISIBLE         │
              └─────────────────────────────────────┘

Time: 11:00 ─────────────────────────────────────────────────────────────────
              ⚡ USER B SENDS MESSAGE
              ┌─────────────────────────────────────┐
              │ New Message: "Hey! Found your item!"│
              │ created_at = 11:00                  │
              └─────────────────────────────────────┘
                         ↓
              ┌─────────────────────────────────────┐
              │ Check: 11:00 > 10:00 ? YES ✅       │
              │ has_new_messages = TRUE             │
              └─────────────────────────────────────┘
                         ↓
              ┌─────────────────────────────────────┐
              │ User A's View: Chat REAPPEARS 🔔    │
              │ User B's View: Chat VISIBLE         │
              └─────────────────────────────────────┘

Time: 11:01 ─────────────────────────────────────────────────────────────────
              ⚡ USER A OPENS CHAT
              ┌─────────────────────────────────────┐
              │ Query: WHERE created_at > 10:00     │
              └─────────────────────────────────────┘
                         ↓
              ┌─────────────────────────────────────┐
              │ User A sees:                        │
              │ ❌ Old Message 1 (09:00) HIDDEN     │
              │ ❌ Old Message 2 (09:00) HIDDEN     │
              │ ❌ Old Message 3 (09:00) HIDDEN     │
              │ ✅ New Message (11:00) VISIBLE      │
              └─────────────────────────────────────┘
              ┌─────────────────────────────────────┐
              │ User B sees:                        │
              │ ✅ Old Message 1 (09:00) VISIBLE    │
              │ ✅ Old Message 2 (09:00) VISIBLE    │
              │ ✅ Old Message 3 (09:00) VISIBLE    │
              │ ✅ New Message (11:00) VISIBLE      │
              └─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ DATABASE STRUCTURE                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ chat_conversations                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ id: #123                                                                    │
│ participant_ids: [User A, User B]                                          │
│ item_id: #789                                                               │
│ created_at: 2025-01-15 09:00:00                                            │
│ updated_at: 2025-01-15 11:00:00 ← Updated when new message sent            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ chat_messages                   │  │ chat_user_deletions             │
├─────────────────────────────────┤  ├─────────────────────────────────┤
│ id: #1                          │  │ id: #001                        │
│ conversation_id: #123           │  │ conversation_id: #123           │
│ sender_id: User A               │  │ user_id: User A                 │
│ message: "Old Message 1"        │  │ deleted_at: 10:00 ← TIMESTAMP   │
│ created_at: 09:00 ← BEFORE      │  │ created_at: 10:00               │
├─────────────────────────────────┤  └─────────────────────────────────┘
│ id: #2                          │                ↓
│ conversation_id: #123           │         USED FOR FILTERING
│ sender_id: User B               │                ↓
│ message: "Old Message 2"        │  ┌─────────────────────────────────┐
│ created_at: 09:00 ← BEFORE      │  │ QUERY LOGIC:                    │
├─────────────────────────────────┤  │ SELECT * FROM chat_messages     │
│ id: #3                          │  │ WHERE conversation_id = #123    │
│ conversation_id: #123           │  │ AND (                           │
│ sender_id: User A               │  │   deleted_at IS NULL OR         │
│ message: "Old Message 3"        │  │   created_at > deleted_at       │
│ created_at: 09:00 ← BEFORE      │  │ )                               │
├─────────────────────────────────┤  └─────────────────────────────────┘
│ id: #4                          │
│ conversation_id: #123           │
│ sender_id: User B               │
│ message: "Hey! Found item!"     │
│ created_at: 11:00 ← AFTER ✅    │
└─────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ COMPARISON: BEFORE vs AFTER                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ ❌ BEFORE (BROKEN)              │  │ ✅ AFTER (FIXED)                │
├─────────────────────────────────┤  ├─────────────────────────────────┤
│                                 │  │                                 │
│ 1. User A deletes chat          │  │ 1. User A deletes chat          │
│    → Added to array:            │  │    → Timestamp recorded:        │
│      deleted_by_user_ids        │  │      deleted_at = 10:00         │
│                                 │  │                                 │
│ 2. User B sends message         │  │ 2. User B sends message         │
│    → Message saved              │  │    → Message saved              │
│    → updated_at changed         │  │    → created_at = 11:00         │
│    → User A still in array ❌   │  │    → 11:00 > 10:00 ✅           │
│                                 │  │                                 │
│ 3. User A fetches chats         │  │ 3. User A fetches chats         │
│    → Filter: NOT IN array       │  │    → Check: has_new_messages?   │
│    → User A in array            │  │    → YES (11:00 > 10:00)        │
│    → Chat HIDDEN ❌             │  │    → Chat SHOWN ✅              │
│                                 │  │                                 │
│ 4. Result:                      │  │ 4. Result:                      │
│    User A NEVER sees message ❌ │  │    User A sees new message ✅   │
│                                 │  │    Old messages hidden ✅       │
│                                 │  │    WhatsApp-like behavior ✅    │
└─────────────────────────────────┘  └─────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ EDGE CASE: BOTH USERS DELETE                                                │
└─────────────────────────────────────────────────────────────────────────────┘

Time: 10:00 ─────────────────────────────────────────────────────────────────
              User A deletes chat
              ┌─────────────────────────────────────┐
              │ chat_user_deletions                 │
              │ User A: deleted_at = 10:00          │
              └─────────────────────────────────────┘

Time: 10:30 ─────────────────────────────────────────────────────────────────
              User B deletes chat
              ┌─────────────────────────────────────┐
              │ chat_user_deletions                 │
              │ User A: deleted_at = 10:00          │
              │ User B: deleted_at = 10:30          │
              └─────────────────────────────────────┘
              ┌─────────────────────────────────────┐
              │ Both users: Chat HIDDEN             │
              └─────────────────────────────────────┘

Time: 11:00 ─────────────────────────────────────────────────────────────────
              User A sends message
              ┌─────────────────────────────────────┐
              │ New Message created_at = 11:00      │
              └─────────────────────────────────────┘
                         ↓
              ┌─────────────────────────────────────┐
              │ Check for User A:                   │
              │ 11:00 > 10:00 ? YES ✅              │
              │ (but User A sent it, so visible)    │
              └─────────────────────────────────────┘
                         ↓
              ┌─────────────────────────────────────┐
              │ Check for User B:                   │
              │ 11:00 > 10:30 ? YES ✅              │
              │ has_new_messages = TRUE             │
              └─────────────────────────────────────┘
                         ↓
              ┌─────────────────────────────────────┐
              │ User A: Chat VISIBLE (sent msg)     │
              │ User B: Chat REAPPEARS 🔔           │
              └─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ KEY TAKEAWAYS                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

✅ Deletion is LOCAL to each user (independent timestamps)
✅ New messages AUTOMATICALLY restore chats (timestamp comparison)
✅ Old messages are HIDDEN (filtered by timestamp)
✅ Message delivery is NEVER blocked (always saved)
✅ Works like WHATSAPP (familiar user experience)

┌─────────────────────────────────────────────────────────────────────────────┐
│ The magic is in the timestamp comparison:                                  │
│                                                                             │
│   IF message.created_at > user_deletion.deleted_at                          │
│   THEN show_message = TRUE                                                  │
│   ELSE show_message = FALSE                                                 │
│                                                                             │
│ This simple logic enables all the complex behavior! 🎯                      │
└─────────────────────────────────────────────────────────────────────────────┘
