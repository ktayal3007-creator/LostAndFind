import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Loader2, Package, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getChatConversationsForUser, deleteChatForUser } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import ChatDialog from '@/components/chat/ChatDialog';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { ChatConversationWithDetails } from '@/types/types';

const ChatHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationWithDetails | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ChatConversationWithDetails | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Long press state
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    try {
      setLoading(true);
      setError(null);

      // Add timeout protection
      const fetchPromise = getChatConversationsForUser(user.id);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const data = await Promise.race([fetchPromise, timeoutPromise]);
      
      clearTimeout(timeoutId);
      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Unable to load conversations. Please check your connection.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (conversation: ChatConversationWithDetails) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedConversation(null);
    // Reload conversations to update timestamps
    loadConversations();
  };

  const handleDeleteChat = async () => {
    if (!user || !conversationToDelete) return;

    try {
      setDeleting(true);
      await deleteChatForUser(conversationToDelete.id, user.id);
      
      toast({
        title: 'Chat Deleted',
        description: 'The conversation has been removed from your chat list.',
      });
      
      // Reload conversations
      await loadConversations();
    } catch (err) {
      console.error('Error deleting chat:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleLongPressStart = (conversation: ChatConversationWithDetails) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(true);
      setConversationToDelete(conversation);
      setDeleteDialogOpen(true);
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressActive(false);
  };

  const handleCardClick = (conversation: ChatConversationWithDetails) => {
    // Only open chat if not in long press mode
    if (!longPressActive) {
      handleOpenChat(conversation);
    }
  };

  // Get other participant from participants array
  const getOtherParticipant = (conversation: ChatConversationWithDetails) => {
    if (!user || !conversation.participants) return null;
    return conversation.participants.find(p => p.id !== user.id) || null;
  };

  // Get username (prioritize username over full_name over email)
  const getOtherUserName = (conversation: ChatConversationWithDetails) => {
    const otherUser = getOtherParticipant(conversation);
    if (!otherUser) return 'User';
    return otherUser.username || otherUser.full_name || otherUser.email || 'User';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to view your chat history</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold">Chat History</h1>
            <p className="text-muted-foreground">
              View your conversations about lost and found items
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4 bg-muted" />
                      <Skeleton className="h-4 w-1/2 bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Conversations</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadConversations} variant="outline">
              Retry
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-border">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">
              Start chatting when you find matches for your lost or found items
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const itemName = conversation.item_name || 'Item';
              const lastMessage = conversation.last_message;
              
              return (
                <ContextMenu key={conversation.id}>
                  <ContextMenuTrigger>
                    <Card 
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer select-none"
                      onClick={() => handleCardClick(conversation)}
                      onMouseDown={() => handleLongPressStart(conversation)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(conversation)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchCancel={handleLongPressEnd}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Item Icon */}
                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-8 h-8 text-primary" />
                          </div>

                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                {/* PRIMARY: Item Name (BOLD) */}
                                <h3 className="font-bold text-lg truncate">
                                  {itemName}
                                </h3>
                                {/* SECONDARY: Username */}
                                <p className="text-sm text-muted-foreground truncate">
                                  with {getOtherUserName(conversation)}
                                </p>
                                {/* TERTIARY: Last message preview */}
                                {lastMessage && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {lastMessage.message}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="flex-shrink-0">
                                {conversation.item_type}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                              <span>
                                {lastMessage 
                                  ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })
                                  : formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setConversationToDelete(conversation);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Chat
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Dialog */}
      {selectedConversation && (
        <ChatDialog
          open={chatOpen}
          onClose={handleCloseChat}
          conversationId={selectedConversation.id}
          otherUserName={getOtherUserName(selectedConversation)}
          conversation={selectedConversation}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the conversation from your chat list. If the other user sends a new message, 
              the chat will reappear with only new messages visible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
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
    </div>
  );
};

export default ChatHistoryPage;
