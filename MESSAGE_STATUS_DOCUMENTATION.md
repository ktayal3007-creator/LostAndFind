# Message Status & Image Upload Updates

## Overview
This document describes the recent updates to FINDIT.AI including WhatsApp-like message status system and increased image upload size limit.

---

## 1. Image Upload Size Increase

### What Changed
The maximum image upload size has been increased from **1MB to 10MB** across all image upload features.

### Affected Components
- **ReportLostPage.tsx**: Lost item image uploads
- **ReportFoundPage.tsx**: Found item image uploads
- **storage.ts**: Core upload validation logic

### Technical Details
```typescript
// Old limit
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

// New limit
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### User Experience
- Users can now upload higher quality images
- Better detail visibility for item identification
- More flexible image size requirements
- Error message updated: "Image must be less than 10MB"

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

---

## 2. WhatsApp-like Message Status System

### Overview
A comprehensive message delivery and read receipt system similar to WhatsApp, providing real-time feedback on message status.

### Message Status States

#### 1. **Sent** (Single Grey Tick ✓)
- **When**: Message successfully sent to server
- **Indicator**: Single grey checkmark
- **Database**: Message created, `delivered = false`

#### 2. **Delivered** (Double Grey Ticks ✓✓)
- **When**: Message delivered to recipient's device/server
- **Indicator**: Double grey checkmarks
- **Database**: `delivered = true`, `delivered_at` timestamp set
- **Logic**: Automatically set when message is sent (server-side delivery)

#### 3. **Read** (Double Blue Ticks ✓✓)
- **When**: Recipient opens chat and views the message
- **Indicator**: Double blue checkmarks
- **Database**: `read = true`, `read_at` timestamp set
- **Logic**: Updated when recipient opens the chat screen

### Database Schema

```sql
-- chat_messages table fields
delivered BOOLEAN DEFAULT false
delivered_at TIMESTAMP WITH TIME ZONE
read BOOLEAN DEFAULT false
read_at TIMESTAMP WITH TIME ZONE
```

### Implementation Details

#### Backend API Updates

**sendMessage Function**
```typescript
// Messages are marked as delivered immediately upon sending
const { data, error } = await supabase
  .from('chat_messages')
  .insert({
    conversation_id: conversationId,
    sender_id: senderId,
    message,
    delivered: true, // Auto-delivered
    delivered_at: new Date().toISOString(),
  })
```

**markMessagesAsRead Function**
```typescript
// Updates read status when chat is opened
const { error } = await supabase
  .from('chat_messages')
  .update({ 
    read: true,
    read_at: new Date().toISOString(),
  })
  .eq('conversation_id', conversationId)
  .neq('sender_id', userId)
  .eq('read', false);
```

#### Frontend Components

**MessageStatusIcon Component**
- Location: `src/components/chat/MessageStatusIcon.tsx`
- Displays appropriate tick icon based on message status
- Color-coded: Grey for sent/delivered, Blue for read

**Status Determination Logic**
```typescript
export const getMessageStatus = (message): MessageStatus => {
  if (message.read || message.read_at) {
    return 'read';
  }
  if (message.delivered || message.delivered_at) {
    return 'delivered';
  }
  return 'sent';
};
```

### User Experience

#### For Senders
- See real-time status updates on their messages
- Single tick: Message sent
- Double grey ticks: Message delivered
- Double blue ticks: Message read by recipient
- Status appears below message timestamp
- Only visible on sender's own messages

#### For Recipients
- No status indicators shown on received messages
- Opening chat automatically marks messages as read
- Read receipts sent back to sender in real-time

### Real-time Updates
- Chat polls for new messages every 3 seconds
- Status updates reflected automatically
- No manual refresh required
- Smooth transition between status states

### Edge Cases Handled

1. **Deleted Messages**: No status shown for deleted messages
2. **Edited Messages**: Status preserved after editing
3. **Offline Recipients**: Messages remain in "delivered" state until chat is opened
4. **Multiple Recipients**: Each message tracked independently

### Privacy Considerations
- Read receipts are automatic (no opt-out currently)
- Status only visible to message sender
- Recipients don't see status on received messages
- Timestamps stored for audit purposes

---

## 3. Technical Architecture

### Component Structure
```
src/
├── components/
│   └── chat/
│       ├── ChatDialog.tsx (Updated with status display)
│       ├── MessageStatusIcon.tsx (New component)
│       └── ChatButton.tsx
├── db/
│   └── api.ts (Updated sendMessage & markMessagesAsRead)
├── types/
│   └── types.ts (Updated ChatMessage interface)
└── pages/
    ├── ReportLostPage.tsx (Updated image size)
    └── ReportFoundPage.tsx (Updated image size)
```

### Data Flow

#### Message Sending Flow
```
User types message
    ↓
Click Send
    ↓
sendMessage() API call
    ↓
Insert to database with delivered=true
    ↓
Display with double grey ticks (delivered)
    ↓
Poll for updates every 3s
```

#### Message Reading Flow
```
Recipient opens chat
    ↓
loadMessages() called
    ↓
markMessagesAsRead() called
    ↓
Update read=true, read_at=timestamp
    ↓
Sender's next poll detects change
    ↓
Status updates to double blue ticks (read)
```

---

## 4. Testing Guide

### Testing Image Upload
1. Navigate to Report Lost or Report Found page
2. Click "Upload Image" button
3. Select an image between 1MB and 10MB
4. Verify upload succeeds
5. Try uploading image > 10MB
6. Verify error message appears

### Testing Message Status

#### Test Scenario 1: Basic Flow
1. User A sends message to User B
2. Verify User A sees double grey ticks (delivered)
3. User B opens chat
4. Verify User A's ticks turn blue (read)

#### Test Scenario 2: Multiple Messages
1. User A sends 3 messages
2. All show double grey ticks
3. User B opens chat
4. All ticks turn blue simultaneously

#### Test Scenario 3: Real-time Updates
1. User A and User B both have chat open
2. User A sends message
3. User B sees message appear
4. User A sees ticks turn blue within 3 seconds

#### Test Scenario 4: Offline Behavior
1. User A sends message
2. User B is offline/hasn't opened chat
3. Message stays at double grey ticks
4. User B opens chat later
5. Ticks turn blue for User A

---

## 5. Performance Considerations

### Polling Strategy
- Interval: 3 seconds
- Only active when chat is open
- Automatically stops when chat closes
- Minimal database load

### Database Queries
- Indexed on conversation_id for fast lookups
- Efficient update queries with specific conditions
- No unnecessary full table scans

### Network Efficiency
- Status updates piggyback on message polling
- No separate API calls for status
- Minimal data transfer overhead

---

## 6. Future Enhancements

### Potential Improvements
1. **Typing Indicators**: Show when other user is typing
2. **Online Status**: Display user online/offline status
3. **Last Seen**: Show last active timestamp
4. **Read Receipt Toggle**: Allow users to disable read receipts
5. **Delivery Reports**: Detailed delivery failure reasons
6. **Bulk Status Updates**: Optimize for multiple messages
7. **Push Notifications**: Real-time alerts for new messages

### Scalability Considerations
- Consider WebSocket for real-time updates at scale
- Implement message status caching
- Add database indexes for performance
- Consider read receipt batching

---

## 7. Troubleshooting

### Common Issues

#### Status Not Updating
**Problem**: Message status stuck at grey ticks
**Solution**: 
- Check if recipient has opened chat
- Verify polling is active (every 3s)
- Check browser console for errors
- Verify database connection

#### Image Upload Fails
**Problem**: Cannot upload images
**Solution**:
- Verify file size < 10MB
- Check file format (JPG, PNG, WebP only)
- Ensure Supabase storage bucket exists
- Check storage permissions

#### Status Shows Incorrectly
**Problem**: Wrong status displayed
**Solution**:
- Check database fields (delivered, read, delivered_at, read_at)
- Verify getMessageStatus() logic
- Clear browser cache
- Check for JavaScript errors

---

## 8. API Reference

### sendMessage
```typescript
sendMessage(
  conversationId: string,
  senderId: string,
  message: string
): Promise<ChatMessage | null>
```
Sends a message and marks it as delivered immediately.

### markMessagesAsRead
```typescript
markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void>
```
Marks all unread messages in a conversation as read.

### getMessageStatus
```typescript
getMessageStatus(message: {
  read: boolean;
  delivered?: boolean;
  read_at?: string | null;
  delivered_at?: string | null;
}): MessageStatus
```
Determines message status based on database fields.

---

## 9. Security & Privacy

### Data Protection
- Message status timestamps stored securely
- Read receipts only visible to sender
- No exposure of recipient activity patterns
- Database-level access controls

### Privacy Features
- Status only shown on sender's messages
- Recipients don't see their own read status
- No tracking of message viewing duration
- Timestamps used only for status display

---

## 10. Changelog

### Version 2.1.0 (2025-12-21)

#### Added
- WhatsApp-like message status system
- Single tick (sent) indicator
- Double grey ticks (delivered) indicator
- Double blue ticks (read) indicator
- MessageStatusIcon component
- Real-time status updates via polling
- Automatic read receipt tracking

#### Changed
- Image upload size limit: 1MB → 10MB
- Updated ReportLostPage.tsx validation
- Updated ReportFoundPage.tsx validation
- Updated storage.ts validation
- Enhanced ChatMessage type with status fields
- Improved sendMessage API function
- Enhanced markMessagesAsRead API function

#### Fixed
- Message status tracking accuracy
- Read receipt timing issues
- Image upload error messages

---

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Verify database schema matches specification
4. Test with different browsers
5. Check network connectivity

---

**Last Updated**: December 21, 2025
**Version**: 2.1.0
**Status**: Production Ready ✅
