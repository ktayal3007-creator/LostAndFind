import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { getOrCreateConversation } from '@/db/api';
import ChatDialog from './ChatDialog';
import { useToast } from '@/hooks/use-toast';

interface ChatButtonProps {
  itemId: string;
  itemType: 'lost' | 'found';
  itemOwnerId?: string;
  itemOwnerEmail?: string;
  itemOwnerUsername?: string;
  itemOwnerFullName?: string;
}

const ChatButton = ({ itemId, itemType, itemOwnerId, itemOwnerEmail, itemOwnerUsername, itemOwnerFullName }: ChatButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chatOpen, setChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getOtherUserName = () => {
    return itemOwnerUsername || itemOwnerFullName || itemOwnerEmail || 'User';
  };

  const handleStartChat = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to start a conversation',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!itemOwnerId) {
      toast({
        title: 'Error',
        description: 'Cannot start conversation - item owner not found',
        variant: 'destructive',
      });
      return;
    }

    // Don't allow chatting with yourself
    if (user.id === itemOwnerId) {
      toast({
        title: 'Cannot Chat',
        description: 'You cannot chat with yourself',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create or get conversation
      const conv = await getOrCreateConversation(
        itemType === 'lost' ? itemId : null,
        itemType === 'found' ? itemId : null,
        itemType === 'lost' ? itemOwnerId : user.id,
        itemType === 'found' ? itemOwnerId : user.id
      );

      if (conv) {
        setConversationId(conv.id);
        setConversation(conv);
        setChatOpen(true);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleStartChat}
        disabled={loading}
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {loading ? 'Loading...' : 'Contact Owner'}
      </Button>

      {conversationId && (
        <ChatDialog
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          conversationId={conversationId}
          otherUserName={getOtherUserName()}
          conversation={conversation}
        />
      )}
    </>
  );
};

export default ChatButton;
