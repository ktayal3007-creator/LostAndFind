# Message Status System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FINDIT.AI Message Status System                  │
│                         (WhatsApp-like)                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐                                      ┌──────────────┐
│   User A     │                                      │   User B     │
│  (Sender)    │                                      │ (Recipient)  │
└──────┬───────┘                                      └──────┬───────┘
       │                                                     │
       │ 1. Send Message                                    │
       ├────────────────────────────────────────────────────┤
       │                                                     │
       │ ┌─────────────────────────────────────────┐       │
       │ │         Supabase Database               │       │
       │ │  ┌───────────────────────────────────┐  │       │
       │ │  │      chat_messages table          │  │       │
       │ │  │                                   │  │       │
       │ │  │  id: uuid                         │  │       │
       │ │  │  message: "Hello!"                │  │       │
       │ │  │  sender_id: User A                │  │       │
       │ │  │  delivered: true ✓                │  │       │
       │ │  │  delivered_at: 2025-12-21 10:00   │  │       │
       │ │  │  read: false                      │  │       │
       │ │  │  read_at: null                    │  │       │
       │ │  └───────────────────────────────────┘  │       │
       │ └─────────────────────────────────────────┘       │
       │                                                     │
       │ 2. Status: DELIVERED (✓✓ grey)                    │
       │◄────────────────────────────────────────────────── │
       │                                                     │
       │                                                     │ 3. Opens Chat
       │                                                     ├──────────┐
       │                                                     │          │
       │                                                     │ 4. markMessagesAsRead()
       │                                                     │          │
       │ ┌─────────────────────────────────────────┐       │◄─────────┘
       │ │         Supabase Database               │       │
       │ │  ┌───────────────────────────────────┐  │       │
       │ │  │      chat_messages table          │  │       │
       │ │  │                                   │  │       │
       │ │  │  id: uuid                         │  │       │
       │ │  │  message: "Hello!"                │  │       │
       │ │  │  sender_id: User A                │  │       │
       │ │  │  delivered: true ✓                │  │       │
       │ │  │  delivered_at: 2025-12-21 10:00   │  │       │
       │ │  │  read: true ✓                     │  │       │
       │ │  │  read_at: 2025-12-21 10:05        │  │       │
       │ │  └───────────────────────────────────┘  │       │
       │ └─────────────────────────────────────────┘       │
       │                                                     │
       │ 5. Status: READ (✓✓ blue)                         │
       │◄────────────────────────────────────────────────── │
       │                                                     │
       │ 6. Polling (every 3s)                              │
       │◄───────────────────────────────────────────────────┤
       │                                                     │
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ChatDialog.tsx (Main Component)             │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Message Rendering Loop                            │ │  │
│  │  │                                                    │ │  │
│  │  │  messages.map((msg) => {                          │ │  │
│  │  │    const isOwnMessage = msg.sender_id === user.id │ │  │
│  │  │                                                    │ │  │
│  │  │    return (                                       │ │  │
│  │  │      <div>                                        │ │  │
│  │  │        <p>{msg.message}</p>                       │ │  │
│  │  │        <div>                                      │ │  │
│  │  │          <span>{timestamp}</span>                 │ │  │
│  │  │          {isOwnMessage && (                       │ │  │
│  │  │            <MessageStatusIcon                     │ │  │
│  │  │              status={getMessageStatus(msg)}       │ │  │
│  │  │            />                                     │ │  │
│  │  │          )}                                       │ │  │
│  │  │        </div>                                     │ │  │
│  │  │      </div>                                       │ │  │
│  │  │    )                                              │ │  │
│  │  │  })                                               │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Polling Logic (every 3 seconds)                   │ │  │
│  │  │                                                    │ │  │
│  │  │  useEffect(() => {                                │ │  │
│  │  │    const interval = setInterval(loadMessages, 3000)│ │  │
│  │  │    return () => clearInterval(interval)           │ │  │
│  │  │  }, [conversationId])                             │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         MessageStatusIcon.tsx (Status Component)         │  │
│  │                                                          │  │
│  │  export const MessageStatusIcon = ({ status }) => {     │  │
│  │    if (status === 'sent') return <Check />  // ✓       │  │
│  │    if (status === 'delivered')                          │  │
│  │      return <CheckCheck className="text-gray" />  // ✓✓ │  │
│  │    return <CheckCheck className="text-blue" />  // ✓✓   │  │
│  │  }                                                       │  │
│  │                                                          │  │
│  │  export const getMessageStatus = (msg) => {             │  │
│  │    if (msg.read || msg.read_at) return 'read'          │  │
│  │    if (msg.delivered) return 'delivered'                │  │
│  │    return 'sent'                                        │  │
│  │  }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    api.ts Functions                      │  │
│  │                                                          │  │
│  │  sendMessage(conversationId, senderId, message)         │  │
│  │  ├─ Insert message to database                          │  │
│  │  ├─ Set delivered = true                                │  │
│  │  ├─ Set delivered_at = now()                            │  │
│  │  └─ Return message with status                          │  │
│  │                                                          │  │
│  │  markMessagesAsRead(conversationId, userId)             │  │
│  │  ├─ Find unread messages                                │  │
│  │  ├─ Update read = true                                  │  │
│  │  ├─ Set read_at = now()                                 │  │
│  │  └─ Return success                                      │  │
│  │                                                          │  │
│  │  getConversationMessages(conversationId)                │  │
│  │  ├─ Fetch all messages                                  │  │
│  │  ├─ Include status fields                               │  │
│  │  └─ Return messages array                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       Database Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              chat_messages Table Schema                  │  │
│  │                                                          │  │
│  │  ┌────────────────┬──────────────┬──────────────────┐   │  │
│  │  │ Column         │ Type         │ Default          │   │  │
│  │  ├────────────────┼──────────────┼──────────────────┤   │  │
│  │  │ id             │ uuid         │ gen_random_uuid()│   │  │
│  │  │ conversation_id│ uuid         │ NOT NULL         │   │  │
│  │  │ sender_id      │ uuid         │ NOT NULL         │   │  │
│  │  │ message        │ text         │ NOT NULL         │   │  │
│  │  │ created_at     │ timestamptz  │ now()            │   │  │
│  │  │ delivered      │ boolean      │ false            │   │  │
│  │  │ delivered_at   │ timestamptz  │ null             │   │  │
│  │  │ read           │ boolean      │ false            │   │  │
│  │  │ read_at        │ timestamptz  │ null             │   │  │
│  │  │ edited_at      │ timestamptz  │ null             │   │  │
│  │  │ is_deleted     │ boolean      │ false            │   │  │
│  │  │ deleted_at     │ timestamptz  │ null             │   │  │
│  │  └────────────────┴──────────────┴──────────────────┘   │  │
│  │                                                          │  │
│  │  Indexes:                                                │  │
│  │  - conversation_id (for fast message lookup)            │  │
│  │  - sender_id (for user message queries)                 │  │
│  │  - created_at (for chronological ordering)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Status State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    Message Status States                        │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Message    │
                    │   Created    │
                    └──────┬───────┘
                           │
                           │ sendMessage()
                           │ delivered = true
                           │ delivered_at = now()
                           ▼
                    ┌──────────────┐
                    │     SENT     │
                    │      ✓       │
                    │   (1 tick)   │
                    └──────┬───────┘
                           │
                           │ Immediately
                           │ (server delivery)
                           ▼
                    ┌──────────────┐
                    │  DELIVERED   │
                    │     ✓✓       │
                    │ (2 grey ticks)│
                    └──────┬───────┘
                           │
                           │ Recipient opens chat
                           │ markMessagesAsRead()
                           │ read = true
                           │ read_at = now()
                           ▼
                    ┌──────────────┐
                    │     READ     │
                    │     ✓✓       │
                    │ (2 blue ticks)│
                    └──────────────┘

Legend:
  ✓  = Single grey checkmark (sent)
  ✓✓ = Double grey checkmarks (delivered)
  ✓✓ = Double blue checkmarks (read)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  Message Sending Flow                           │
└─────────────────────────────────────────────────────────────────┘

User A Types Message
        │
        ▼
┌───────────────┐
│ Click Send    │
│   Button      │
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────────┐
│ handleSend()                          │
│ - Validate message not empty          │
│ - Call sendMessage() API              │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ sendMessage() API Function            │
│                                       │
│ INSERT INTO chat_messages (           │
│   conversation_id,                    │
│   sender_id,                          │
│   message,                            │
│   delivered: true,                    │
│   delivered_at: now()                 │
│ )                                     │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Database Insert                       │
│ - Message stored                      │
│ - Status: delivered = true            │
│ - Timestamp: delivered_at set         │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Return Message Object                 │
│ {                                     │
│   id: "uuid",                         │
│   message: "Hello!",                  │
│   delivered: true,                    │
│   delivered_at: "2025-12-21...",      │
│   read: false,                        │
│   read_at: null                       │
│ }                                     │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Update UI                             │
│ - Add message to chat                 │
│ - Show double grey ticks (✓✓)         │
│ - Display timestamp                   │
└───────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  Message Reading Flow                           │
└─────────────────────────────────────────────────────────────────┘

User B Opens Chat
        │
        ▼
┌───────────────────────────────────────┐
│ ChatDialog Opens                      │
│ - Load messages                       │
│ - Call markMessagesAsRead()           │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ markMessagesAsRead() API Function     │
│                                       │
│ UPDATE chat_messages                  │
│ SET                                   │
│   read = true,                        │
│   read_at = now()                     │
│ WHERE                                 │
│   conversation_id = ?                 │
│   AND sender_id != current_user       │
│   AND read = false                    │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Database Update                       │
│ - All unread messages updated         │
│ - read = true                         │
│ - read_at timestamp set               │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Polling Detects Change (User A)       │
│ - Next 3-second poll                  │
│ - Fetches updated messages            │
│ - Detects read = true                 │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Update User A's UI                    │
│ - Change ticks to blue (✓✓)           │
│ - Status: READ                        │
└───────────────────────────────────────┘
```

---

## Image Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Image Upload Flow (10MB Limit)                 │
└─────────────────────────────────────────────────────────────────┘

User Selects Image
        │
        ▼
┌───────────────────────────────────────┐
│ handleImageChange()                   │
│ - Get file from input                 │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Validate File Size                    │
│ if (file.size > 10 * 1024 * 1024) {  │
│   show error                          │
│   return                              │
│ }                                     │
└───────┬───────────────────────────────┘
        │ ✓ Size OK
        ▼
┌───────────────────────────────────────┐
│ Validate File Type                    │
│ validTypes = [                        │
│   'image/jpeg',                       │
│   'image/jpg',                        │
│   'image/png',                        │
│   'image/webp'                        │
│ ]                                     │
│ if (!validTypes.includes(file.type)) {│
│   show error                          │
│   return                              │
│ }                                     │
└───────┬───────────────────────────────┘
        │ ✓ Type OK
        ▼
┌───────────────────────────────────────┐
│ Create Preview                        │
│ - FileReader.readAsDataURL()          │
│ - Set preview state                   │
│ - Display thumbnail                   │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ User Submits Form                     │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ uploadImage() Function                │
│ - Upload to Supabase Storage          │
│ - Bucket: app-8e6wgm5ndzi9_item_images│
│ - Generate unique filename            │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Get Public URL                        │
│ - Retrieve public URL from Supabase   │
│ - Return URL to component             │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Save to Database                      │
│ - Include image_url in item record    │
│ - Store with lost/found item data     │
└───────────────────────────────────────┘
```

---

## Real-time Update Mechanism

```
┌─────────────────────────────────────────────────────────────────┐
│              Polling-Based Real-time Updates                    │
└─────────────────────────────────────────────────────────────────┘

Chat Opens
    │
    ▼
┌─────────────────────┐
│ Start Polling       │
│ Interval: 3 seconds │
└──────┬──────────────┘
       │
       │ Every 3 seconds
       ▼
┌──────────────────────────────────┐
│ loadMessages()                   │
│ - Fetch all conversation messages│
│ - Include status fields          │
│ - Order by created_at            │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Compare with Previous State      │
│ - New messages?                  │
│ - Status changes?                │
│ - Read receipts?                 │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Update UI if Changed             │
│ - Add new messages               │
│ - Update status icons            │
│ - Scroll to bottom               │
└──────┬───────────────────────────┘
       │
       │ Wait 3 seconds
       ▼
┌──────────────────────────────────┐
│ Repeat Polling                   │
└──────┬───────────────────────────┘
       │
       │ Chat Closes
       ▼
┌──────────────────────────────────┐
│ Stop Polling                     │
│ clearInterval()                  │
└──────────────────────────────────┘
```

---

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Strategy                         │
└─────────────────────────────────────────────────────────────────┘

Database Level:
├─ Indexes on conversation_id (fast message lookup)
├─ Indexes on sender_id (efficient filtering)
├─ Indexes on created_at (chronological ordering)
└─ Efficient UPDATE queries (only unread messages)

API Level:
├─ Batch status updates (all messages at once)
├─ Conditional updates (only if read = false)
├─ Minimal data transfer (only necessary fields)
└─ Piggyback status on message fetch (no extra calls)

Frontend Level:
├─ Polling only when chat open (no background polling)
├─ Auto-cleanup on unmount (prevent memory leaks)
├─ Efficient re-renders (React state management)
└─ Debounced status checks (avoid excessive updates)

Network Level:
├─ 3-second polling interval (balance real-time vs load)
├─ Compressed payloads (minimal JSON)
├─ Connection pooling (Supabase client)
└─ Error handling with retry logic
```

---

**Version**: 2.1.0 | **Last Updated**: 2025-12-21 | **Status**: ✅ Production Ready
