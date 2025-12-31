import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, Loader2, Trash2, MoreVertical, Edit2, X, Check, CheckCircle } from 'lucide-react';
import { getConversationMessages, sendMessage, markMessagesAsRead, deleteChatForUser, editMessage, softDeleteMessage, concludeItem, canDeleteChat } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { ChatMessage } from '@/types/types';
import { MessageStatusIcon, getMessageStatus } from './MessageStatusIcon';
import { MessageAttachment } from './MessageAttachment';

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  otherUserName: string;
  conversation?: any; // Full conversation object with item details
}

const ChatDialog = ({ open, onClose, conversationId, otherUserName, conversation }: ChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConclusionDialog, setShowConclusionDialog] = useState(false);
  const [conclusionType, setConclusionType] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [concluding, setConcluding] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && conversationId) {
      loadMessages();
      checkCanDelete();
      // Poll for new messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [open, conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId || !user) return;
    
    try {
      setLoading(true);
      const data = await getConversationMessages(conversationId, user.id);
      setMessages(data);
      
      // Mark messages as read
      await markMessagesAsRead(conversationId, user.id);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId) return;

    try {
      setSending(true);
      setError('');
      
      await sendMessage(
        conversationId, 
        user.id, 
        newMessage.trim()
      );
      
      setNewMessage('');
      
      // Reload messages
      await loadMessages();
    } catch (err) {
      setError('Failed to send message');
      console.error('[CHAT] Error sending message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const checkCanDelete = async () => {
    if (!user || !conversationId) return;

    try {
      const result = await canDeleteChat(conversationId, user.id);
      setCanDelete(result.canDelete);
      setDeleteReason(result.reason || '');
    } catch (err) {
      console.error('Error checking delete permission:', err);
      setCanDelete(false);
    }
  };

  const handleConcludeItem = async (type: string) => {
    if (!user || !conversation) return;

    try {
      setConcluding(true);
      
      // Use item_type from conversation
      const itemId = conversation.item_id;
      const itemType = conversation.item_type;

      if (!itemId) {
        throw new Error('Item not found');
      }

      await concludeItem(itemId, itemType, type, user.id);

      toast({
        title: 'Item Concluded',
        description: `Item marked as ${type.replace('_', ' ')}`,
      });

      setShowConclusionDialog(false);
      setConclusionType('');
      
      // Refresh delete permission
      await checkCanDelete();
    } catch (err) {
      console.error('Error concluding item:', err);
      toast({
        title: 'Error',
        description: 'Failed to conclude item',
        variant: 'destructive',
      });
    } finally {
      setConcluding(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!user || !conversationId) return;

    try {
      setDeleting(true);
      const result = await deleteChatForUser(conversationId, user.id);
      
      toast({
        title: 'Chat Deleted',
        description: result.message || 'This chat has been removed from your list',
      });

      setShowDeleteDialog(false);
      onClose();
    } catch (err: any) {
      console.error('Error deleting chat:', err);
      toast({
        title: 'Cannot Delete Chat',
        description: err.message || 'Failed to delete chat',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // CRITICAL: Show conclusion button ONLY to item reporter when item not concluded
  const shouldShowConclusionButton = () => {
    if (!user || !conversation) return false;

    // Check if current user is the item reporter
    const isItemReporter = conversation.item_reporter_id === user.id;
    
    // Show button ONLY if:
    // 1. Current user is the item reporter
    // 2. Item has NOT been concluded yet
    return isItemReporter && conversation.conclusion_status === null;
  };

  const getConclusionOptions = () => {
    if (!user || !conversation) return [];

    // Options based on item type
    if (conversation.item_type === 'lost') {
      return [
        { value: 'item_found', label: 'Item Found' },
        { value: 'item_not_found', label: 'Item Not Found' },
      ];
    } else if (conversation.item_type === 'found') {
      return [
        { value: 'owner_found', label: 'Owner Found' },
        { value: 'owner_not_found', label: 'Owner Not Found' },
      ];
    }

    return [];
  };

  const handleDeleteHistory = handleDeleteChat;

  const handleStartEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.message);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingText.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      await editMessage(messageId, editingText.trim());
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, message: editingText.trim(), edited_at: new Date().toISOString() }
          : msg
      ));

      toast({
        title: 'Message Updated',
        description: 'Your message has been edited',
      });

      handleCancelEdit();
    } catch (err) {
      console.error('Error editing message:', err);
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await softDeleteMessage(messageId);
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_deleted: true, deleted_at: new Date().toISOString(), message: '' }
          : msg
      ));

      toast({
        title: 'Message Deleted',
        description: 'Your message has been removed',
      });

      setMessageToDelete(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-2xl h-[600px] p-0 flex flex-col">
          {/* SINGLE SCROLL CONTAINER - Contains header + messages + input */}
          <div className="flex-1 overflow-y-auto" ref={scrollRef}>
            <div className="flex flex-col min-h-full">
              {/* SCROLLABLE HEADER - Shows username and item name */}
              <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* PRIMARY: Other user's username */}
                    <h2 className="text-xl font-bold truncate">
                      {otherUserName}
                    </h2>
                    {/* SECONDARY: Item name */}
                    <p className="text-sm text-muted-foreground truncate">
                      Regarding: <span className="font-medium">{conversation?.item_name || 'Item'}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {shouldShowConclusionButton() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConclusionDialog(true)}
                        className="text-primary hover:text-primary"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Conclude
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (canDelete) {
                          setShowDeleteDialog(true);
                        } else {
                          toast({
                            title: 'Cannot Delete',
                            description: deleteReason || 'Please conclude the item first',
                            variant: 'destructive',
                          });
                        }
                      }}
                      disabled={!canDelete}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="px-6 pt-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* MESSAGES AREA */}
              <div className="flex-1 px-6 py-4 space-y-4">
                {loading && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === user?.id;
                    const isEditing = editingMessageId === msg.id;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="h-7 px-2"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-7 px-2"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm">
                                    {msg.is_deleted ? (
                                      <span className="italic opacity-70">This message was deleted</span>
                                    ) : (
                                      msg.message
                                    )}
                                  </p>
                                  
                                  {/* Show attachment if present */}
                                  {msg.attachment_url && msg.attachment_type && !msg.is_deleted && (
                                    <MessageAttachment
                                      attachmentUrl={msg.attachment_url}
                                      attachmentFullUrl={msg.attachment_full_url}
                                      attachmentType={msg.attachment_type}
                                      attachmentName={msg.attachment_name || 'file'}
                                      attachmentSize={msg.attachment_size || undefined}
                                    />
                                  )}
                                </div>
                                {isOwnMessage && !msg.is_deleted && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-70 hover:opacity-100"
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleStartEdit(msg)}>
                                        <Edit2 className="w-3 h-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setMessageToDelete(msg.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs opacity-70">
                                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                </p>
                                {msg.edited_at && (
                                  <span className="text-xs opacity-70 italic">(edited)</span>
                                )}
                                {/* Message Status - Only show for own messages */}
                                {isOwnMessage && !msg.is_deleted && (
                                  <MessageStatusIcon 
                                    status={getMessageStatus(msg)} 
                                    className="ml-1"
                                  />
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* MESSAGE INPUT - At bottom of scroll container */}
              <div className="sticky bottom-0 bg-background border-t px-6 py-4">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={sending || !newMessage.trim()} 
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete chat dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this chat from your list. The other user will still be able to see the conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHistory}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conclusion dialog */}
      <AlertDialog open={showConclusionDialog} onOpenChange={setShowConclusionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conclude Item</AlertDialogTitle>
            <AlertDialogDescription>
              Please select the outcome for this item. This will remove the item from active listings and move it to your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            {getConclusionOptions().map((option) => (
              <Button
                key={option.value}
                variant={conclusionType === option.value ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setConclusionType(option.value)}
                disabled={concluding}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={concluding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => conclusionType && handleConcludeItem(conclusionType)}
              disabled={!conclusionType || concluding}
            >
              {concluding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Concluding...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete single message dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatDialog;
