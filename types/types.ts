// Database types matching Supabase schema

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ItemStatus = 'active' | 'concluded';
export type LostItemConclusionType = 'item_found' | 'item_not_found';
export type FoundItemConclusionType = 'owner_found' | 'owner_not_found';
export type HistoryType = 'ACTIVE' | 'USER_HISTORY' | 'MAIN_HISTORY';

export interface LostItem {
  id: string;
  user_id: string | null;
  item_name: string;
  description: string;
  category: string;
  date_lost: string;
  location: string;
  campus: string;
  additional_info: string | null;
  image_url: string | null;
  status: ItemStatus;
  conclusion_type: LostItemConclusionType | null;
  concluded_at: string | null;
  concluded_by: string | null;
  history_type: HistoryType;
  created_at: string;
  updated_at: string;
}

// Lost item with profile data (from JOIN or view)
export interface LostItemWithProfile extends LostItem {
  username: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface FoundItem {
  id: string;
  user_id: string | null;
  item_name: string;
  description: string;
  category: string;
  date_found: string;
  location: string;
  campus: string;
  additional_info: string | null;
  image_url: string | null;
  status: ItemStatus;
  conclusion_type: FoundItemConclusionType | null;
  concluded_at: string | null;
  concluded_by: string | null;
  history_type: HistoryType;
  created_at: string;
  updated_at: string;
}

// Found item with profile data (from JOIN or view)
export interface FoundItemWithProfile extends FoundItem {
  username: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface ReturnedItem {
  id: string;
  item_name: string;
  description: string;
  category: string;
  owner_name: string;
  owner_contact: string | null;
  finder_name: string;
  finder_contact: string | null;
  return_date: string;
  location: string;
  campus: string;
  story: string | null;
  image_url: string | null;
  created_at: string;
}

export interface LostItemInput {
  user_id?: string | null;
  item_name: string;
  description: string;
  category: string;
  date_lost: string;
  location: string;
  campus: string;
  additional_info?: string;
  image_url?: string;
}

export interface FoundItemInput {
  user_id?: string | null;
  item_name: string;
  description: string;
  category: string;
  date_found: string;
  location: string;
  campus: string;
  additional_info?: string;
  image_url?: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const CATEGORIES = [
  'Wallet',
  'Bag',
  'Electronics',
  'Personal Items',
  'Accessories',
  'Keys',
  'Books',
  'ID Cards',
  'Jewelry',
  'Documents',
  'Medical',
  'Other'
] as const;

export const CAMPUSES = [
  'Academic Building',
  'Old boys Hostel',
  'Annex-1',
  'Annex-2',
  'Girls Hostel',
  'Lake Side',
  'Student Activity Centre',
  'Day Canteen',
  'Night Canteen',
  'Others'
] as const;

export interface ChatConversation {
  id: string;
  item_id: string;
  item_type: 'lost' | 'found';
  participant_ids: string[];
  // Legacy fields (kept for backward compatibility)
  lost_item_id: string | null;
  found_item_id: string | null;
  lost_item_owner_id: string;
  found_item_reporter_id: string;
  deleted_by_user_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string;
}

export interface ChatConversationWithDetails extends ChatConversation {
  item_name: string;
  item_reporter_id: string; // User ID of the person who reported the item
  conclusion_status: string | null; // Conclusion type from item
  item_details: LostItem | FoundItem;
  participants: ChatParticipant[];
  last_message: {
    id: string;
    message: string;
    sender_id: string;
    created_at: string;
  } | null;
  user_deleted_at?: string | null; // Timestamp when current user deleted this chat
  has_new_messages?: boolean; // Whether there are new messages after deletion
}

export type AttachmentType = 'image' | 'video' | 'audio';  // Documents removed from chat attachments

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read: boolean;
  sent_after_deletion: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  delivered?: boolean;
  delivered_at?: string | null;
  read_at?: string | null;
  attachment_url?: string | null;  // Storage path (for deletion)
  attachment_full_url?: string | null;  // FULL public URL (for rendering)
  attachment_type?: AttachmentType | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
}

export type MatchStatus = 'pending' | 'confirmed' | 'rejected';

export interface Match {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  similarity_score: number;
  match_reason: string;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  lost_item?: LostItem;
  found_item?: FoundItem;
}

export interface MatchNotification {
  id: string;
  match_id: string;
  user_id: string;
  notification_type: 'email' | 'in_app';
  sent_at: string;
  read_at: string | null;
  match?: Match;
}
