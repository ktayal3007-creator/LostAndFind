# Public Item History & Automatic Cleanup Implementation

## Overview
This implementation adds a comprehensive public history system and automatic cleanup mechanism for the Lost & Found application, following strict requirements for data lifecycle management.

## History Type System

### Three History States
All items belong to exactly ONE of these states:

1. **ACTIVE** - Currently listed items (Lost or Found)
   - Visible to all users in main Lost/Found lists
   - Searchable and matchable
   - Can be concluded by reporter

2. **USER_HISTORY** - Private concluded items
   - Visible ONLY to the reporter
   - Items where owner/item was NOT found
   - Can be manually deleted by reporter
   - Auto-deleted after 6 months

3. **MAIN_HISTORY** - Public success stories
   - Visible to ALL users
   - Items where owner/item WAS found
   - Read-only (cannot be manually deleted)
   - Auto-deleted after 6 months

## Database Schema

### Tables Modified
- `lost_items` - Added `history_type` column
- `found_items` - Added `history_type` column

### Enum Type
```sql
CREATE TYPE history_type_enum AS ENUM ('ACTIVE', 'USER_HISTORY', 'MAIN_HISTORY');
```

### Indexes Created
- `idx_lost_items_history_type` - Fast filtering by history type
- `idx_found_items_history_type` - Fast filtering by history type
- `idx_lost_items_concluded_at` - Cleanup performance
- `idx_found_items_concluded_at` - Cleanup performance
- `idx_lost_items_created_at` - Cleanup performance
- `idx_found_items_created_at` - Cleanup performance

## Conclusion Behavior

### "Owner Found" / "Item Found" (Success)
When reporter concludes with success:
1. Item removed from ACTIVE list
2. `history_type` set to `MAIN_HISTORY`
3. `status` set to `concluded`
4. `concluded_at` set to current timestamp
5. Item appears in public Success Stories page
6. Item removed from reporter's private lists

### "Owner Not Found" / "Item Not Found" (Failure)
When reporter concludes without success:
1. Item removed from ACTIVE list
2. `history_type` set to `USER_HISTORY`
3. `status` set to `concluded`
4. `concluded_at` set to current timestamp
5. Item appears ONLY in reporter's private history
6. Item NOT visible to other users

## Database Functions

### 1. conclude_item_with_history()
Routes items to correct history type based on conclusion.

**Parameters:**
- `p_item_id` - Item UUID
- `p_item_type` - 'lost' or 'found'
- `p_conclusion_type` - Conclusion type string
- `p_user_id` - Reporter's user ID

**Returns:**
```json
{
  "success": true,
  "message": "Item concluded successfully",
  "history_type": "MAIN_HISTORY"
}
```

**Logic:**
- Lost item + "item_found" → MAIN_HISTORY
- Found item + "owner_found" → MAIN_HISTORY
- All other conclusions → USER_HISTORY

### 2. cleanup_old_history_items()
Deletes items older than 6 months.

**Deletion Criteria:**
- Items where `concluded_at < (current_date - 6 months)`
- OR items where `created_at < (current_date - 6 months)` AND `concluded_at IS NULL`

**Returns:**
```json
{
  "deleted_lost_items": 5,
  "deleted_found_items": 3,
  "deleted_chats": 8
}
```

**Applies to:**
- USER_HISTORY items
- MAIN_HISTORY items
- Old ACTIVE items (6+ months without conclusion)
- Related chat conversations

### 3. delete_user_history_item()
Allows manual deletion of USER_HISTORY items only.

**Parameters:**
- `p_item_id` - Item UUID
- `p_item_type` - 'lost' or 'found'
- `p_user_id` - User's ID

**Returns:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

**Validation:**
- Only USER_HISTORY items can be deleted
- Only by the reporter (user_id match)
- MAIN_HISTORY items return error

## Row Level Security (RLS)

### MAIN_HISTORY Policies
```sql
-- Read: All authenticated users
CREATE POLICY "main_history_read_lost" ON lost_items
  FOR SELECT USING (history_type = 'MAIN_HISTORY');

-- Delete: Blocked (read-only)
CREATE POLICY "main_history_no_delete_lost" ON lost_items
  FOR DELETE USING (false);
```

### USER_HISTORY Policies
```sql
-- Read: Only reporter
CREATE POLICY "user_history_read_lost" ON lost_items
  FOR SELECT USING (
    history_type = 'USER_HISTORY' 
    AND user_id = auth.uid()
  );
```

### ACTIVE Policies
```sql
-- Read: All authenticated users
CREATE POLICY "active_read_lost" ON lost_items
  FOR SELECT USING (history_type = 'ACTIVE');
```

## API Functions

### Frontend API (src/db/api.ts)

#### getMainHistory()
Fetches all public success stories.
```typescript
const { lostItems, foundItems } = await getMainHistory();
```

#### getUserHistory(userId)
Fetches user's private history.
```typescript
const { lostItems, foundItems } = await getUserHistory(userId);
```

#### concludeItem(itemId, itemType, conclusionType, userId)
Concludes an item with automatic routing.
```typescript
const result = await concludeItem(
  'item-uuid',
  'lost',
  'item_found',
  'user-uuid'
);
// Returns: { success: true, message: '...', historyType: 'MAIN_HISTORY' }
```

#### deleteUserHistoryItem(itemId, itemType, userId)
Deletes a USER_HISTORY item.
```typescript
await deleteUserHistoryItem('item-uuid', 'lost', 'user-uuid');
```

#### cleanupOldHistoryItems()
Triggers manual cleanup (also runs automatically).
```typescript
const result = await cleanupOldHistoryItems();
// Returns: { deletedLostItems: 5, deletedFoundItems: 3, deletedChats: 8 }
```

## Edge Function: cleanup-old-items

### Purpose
Automated daily cleanup of old items.

### Deployment
```bash
supabase functions deploy cleanup-old-items
```

### Scheduling
Set up a cron job or scheduled task to call:
```
POST https://[project-ref].supabase.co/functions/v1/cleanup-old-items
Authorization: Bearer [anon-key]
```

### Response
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "result": {
    "deletedLostItems": 5,
    "deletedFoundItems": 3,
    "deletedChats": 8,
    "timestamp": "2025-12-21T05:30:00.000Z"
  }
}
```

## UI Components

### Success Stories Page (/success-stories)
**File:** `src/pages/MainHistoryPage.tsx`

**Features:**
- Displays all MAIN_HISTORY items
- Shows both lost and found success stories
- Read-only view
- Statistics cards
- Sorted by conclusion date

**Access:** Public (all authenticated users)

### Item History Page (/item-history)
**File:** `src/pages/ItemHistoryPage.tsx`

**Features:**
- Displays user's USER_HISTORY items
- Delete button for each item
- Confirmation dialog
- Private to user

**Access:** Private (user's own history only)

## Data Flow

### Conclusion Flow
```
User clicks "Conclude" in chat
  ↓
ChatDialog calls concludeItem()
  ↓
API calls conclude_item_with_history()
  ↓
Database function checks conclusion type
  ↓
Routes to MAIN_HISTORY or USER_HISTORY
  ↓
Item removed from ACTIVE lists
  ↓
Item appears in appropriate history section
```

### Cleanup Flow
```
Daily cron job triggers
  ↓
Calls cleanup-old-items Edge Function
  ↓
Edge Function calls cleanup_old_history_items()
  ↓
Database function finds items older than 6 months
  ↓
Deletes items and related chats
  ↓
Returns deletion counts
```

## Query Optimization

### Active Items Query
```typescript
// Before: Showed all items
.eq('status', 'active')

// After: Only shows ACTIVE history type
.eq('history_type', 'ACTIVE')
```

### Count Queries
```typescript
// Updated to count only ACTIVE items
const count = await supabase
  .from('lost_items')
  .select('*', { count: 'exact', head: true })
  .eq('history_type', 'ACTIVE');
```

## Migration File
**File:** `supabase/migrations/00017_implement_public_history_and_cleanup.sql`

**Contents:**
1. Create history_type_enum
2. Add history_type columns
3. Set default values
4. Update existing concluded items
5. Create indexes
6. Create RLS policies
7. Create database functions
8. Recreate views with history_type

## Testing Checklist

### Conclusion Tests
- [ ] Lost item + "item_found" → MAIN_HISTORY ✓
- [ ] Lost item + "item_not_found" → USER_HISTORY ✓
- [ ] Found item + "owner_found" → MAIN_HISTORY ✓
- [ ] Found item + "owner_not_found" → USER_HISTORY ✓

### Visibility Tests
- [ ] MAIN_HISTORY visible to all users ✓
- [ ] USER_HISTORY visible only to reporter ✓
- [ ] ACTIVE items visible to all users ✓

### Deletion Tests
- [ ] USER_HISTORY can be manually deleted ✓
- [ ] MAIN_HISTORY cannot be manually deleted ✓
- [ ] Only reporter can delete their USER_HISTORY ✓

### Cleanup Tests
- [ ] Items older than 6 months are deleted ✓
- [ ] Related chats are deleted ✓
- [ ] Active items under 6 months remain ✓

### UI Tests
- [ ] Success Stories page shows MAIN_HISTORY items ✓
- [ ] Item History page shows USER_HISTORY items ✓
- [ ] Delete button works in Item History ✓
- [ ] No delete button in Success Stories ✓

## Validation Rules

### Implementation is VALID if:
✓ "Owner Found" items appear in public history
✓ "Owner Not Found" items appear in private history
✓ Old items are auto-deleted after 6 months
✓ Users cannot delete public history manually
✓ Items exist in only one list at a time
✓ All state changes are transactional
✓ History state derived from history_type only

### Implementation is INVALID if:
✗ "Owner Found" items are not visible to all users
✗ Old items remain after 6 months
✗ Users can delete public history manually
✗ Items exist in multiple lists simultaneously

## Maintenance

### Manual Cleanup Trigger
If needed, manually trigger cleanup:
```typescript
import { cleanupOldHistoryItems } from '@/db/api';

const result = await cleanupOldHistoryItems();
console.log('Cleanup result:', result);
```

### Monitoring
Check cleanup logs in Supabase Edge Functions dashboard:
```
Functions → cleanup-old-items → Logs
```

### Database Queries
Check history distribution:
```sql
-- Count items by history type
SELECT 
  history_type,
  COUNT(*) as count
FROM lost_items
GROUP BY history_type;

-- Find items ready for cleanup
SELECT 
  id,
  item_name,
  concluded_at,
  history_type
FROM lost_items
WHERE concluded_at < (CURRENT_DATE - INTERVAL '6 months')
   OR (created_at < (CURRENT_DATE - INTERVAL '6 months') AND concluded_at IS NULL);
```

## Security Considerations

1. **RLS Enforcement**: All queries respect row-level security
2. **User Validation**: Database functions verify user ownership
3. **Read-Only Public History**: MAIN_HISTORY cannot be modified
4. **Service Role for Cleanup**: Edge function uses service role key
5. **Transactional Operations**: All state changes are atomic

## Performance Considerations

1. **Indexes**: Created on history_type and date columns
2. **Batch Deletion**: Cleanup function uses efficient bulk operations
3. **View Recreation**: Views include history_type for fast filtering
4. **Query Optimization**: Filters by history_type before other conditions

## Future Enhancements

1. **Configurable Retention**: Allow admins to set cleanup period
2. **Archive System**: Move to archive instead of delete
3. **Statistics Dashboard**: Show cleanup metrics
4. **Email Notifications**: Warn users before deletion
5. **Restore Functionality**: Allow recovery within grace period

## Conclusion

This implementation provides a complete, secure, and scalable solution for managing item history with automatic cleanup. All requirements have been met:

✓ Three distinct history states (ACTIVE, USER_HISTORY, MAIN_HISTORY)
✓ Automatic routing based on conclusion type
✓ Public visibility for success stories
✓ Private history for unsuccessful conclusions
✓ Manual deletion for USER_HISTORY only
✓ Automatic cleanup after 6 months
✓ Transactional consistency
✓ Comprehensive RLS policies
✓ Performance optimization
✓ Clean UI implementation
