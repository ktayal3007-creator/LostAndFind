# Quick Reference: Message Status & Image Upload

## 🚀 Quick Start

### Image Upload (10MB Limit)
```typescript
// Validation in components
if (file.size > 10 * 1024 * 1024) {
  // Show error: "Image must be less than 10MB"
}
```

### Message Status Icons
- ✓ **Single Grey Tick** = Sent
- ✓✓ **Double Grey Ticks** = Delivered
- ✓✓ **Double Blue Ticks** = Read

---

## 📊 Message Status Flow

```
Send Message → Delivered (✓✓ grey) → Read (✓✓ blue)
     ↓              ↓                      ↓
  Instant      Immediate            When chat opened
```

---

## 🔧 Key Components

### MessageStatusIcon Component
```typescript
import { MessageStatusIcon, getMessageStatus } from './MessageStatusIcon';

// Usage
<MessageStatusIcon 
  status={getMessageStatus(message)} 
  className="ml-1"
/>
```

### Status Determination
```typescript
// Automatic status detection
const status = getMessageStatus({
  read: message.read,
  delivered: message.delivered,
  read_at: message.read_at,
  delivered_at: message.delivered_at
});
// Returns: 'sent' | 'delivered' | 'read'
```

---

## 💾 Database Fields

```sql
-- chat_messages table
delivered BOOLEAN DEFAULT false
delivered_at TIMESTAMP WITH TIME ZONE
read BOOLEAN DEFAULT false
read_at TIMESTAMP WITH TIME ZONE
```

---

## 🎯 API Functions

### Send Message (Auto-Delivered)
```typescript
await sendMessage(conversationId, senderId, message);
// Automatically sets delivered=true, delivered_at=now
```

### Mark as Read
```typescript
await markMessagesAsRead(conversationId, userId);
// Sets read=true, read_at=now for all unread messages
```

---

## ✅ Testing Checklist

### Image Upload
- [ ] Upload 5MB image → Success
- [ ] Upload 10MB image → Success
- [ ] Upload 11MB image → Error shown
- [ ] Upload non-image file → Error shown

### Message Status
- [ ] Send message → See grey ticks
- [ ] Recipient opens chat → Ticks turn blue
- [ ] Multiple messages → All update together
- [ ] Deleted message → No status shown
- [ ] Edited message → Status preserved

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Status not updating | Wait 3s for poll, check chat is open |
| Image upload fails | Check size < 10MB, format is JPG/PNG/WebP |
| Blue ticks not showing | Recipient must open chat screen |
| Status on wrong messages | Only sender sees status on own messages |

---

## 📁 File Locations

```
src/
├── components/chat/
│   ├── MessageStatusIcon.tsx    ← Status component
│   └── ChatDialog.tsx            ← Updated with status
├── db/api.ts                     ← sendMessage, markMessagesAsRead
├── types/types.ts                ← ChatMessage interface
├── pages/
│   ├── ReportLostPage.tsx        ← 10MB limit
│   └── ReportFoundPage.tsx       ← 10MB limit
└── lib/storage.ts                ← Upload validation
```

---

## 🎨 UI Behavior

### Sender View
```
┌─────────────────────────┐
│ Your message here       │
│ 2 mins ago (edited) ✓✓  │ ← Blue ticks (read)
└─────────────────────────┘
```

### Recipient View
```
┌─────────────────────────┐
│ Their message here      │
│ 2 mins ago              │ ← No status shown
└─────────────────────────┘
```

---

## ⚡ Performance

- **Polling**: Every 3 seconds when chat open
- **Auto-stop**: Polling stops when chat closes
- **Efficient**: Status updates piggyback on message fetch
- **Indexed**: Fast database queries on conversation_id

---

## 🔐 Privacy

- ✅ Status only visible to sender
- ✅ Recipients don't see their read status
- ✅ Timestamps stored securely
- ✅ No activity pattern tracking

---

## 📝 Code Examples

### Check Message Status
```typescript
const message = {
  read: true,
  delivered: true,
  read_at: '2025-12-21T10:30:00Z',
  delivered_at: '2025-12-21T10:29:00Z'
};

const status = getMessageStatus(message);
console.log(status); // 'read'
```

### Upload Image with Validation
```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast({
      title: 'File too large',
      description: 'Image must be less than 10MB',
      variant: 'destructive',
    });
    return;
  }

  // Validate type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast({
      title: 'Invalid file type',
      description: 'Only JPG, PNG, and WEBP images are allowed',
      variant: 'destructive',
    });
    return;
  }

  // Proceed with upload
  setImageFile(file);
};
```

---

## 🚦 Status Transitions

```
Message Lifecycle:
┌──────┐    ┌───────────┐    ┌──────┐
│ SENT │ → │ DELIVERED │ → │ READ │
└──────┘    └───────────┘    └──────┘
   ✓              ✓✓            ✓✓
 (grey)         (grey)        (blue)
```

---

## 📞 Support

**Documentation**: MESSAGE_STATUS_DOCUMENTATION.md
**Component**: src/components/chat/MessageStatusIcon.tsx
**API**: src/db/api.ts (sendMessage, markMessagesAsRead)

---

**Version**: 2.1.0 | **Updated**: 2025-12-21 | **Status**: ✅ Production Ready
