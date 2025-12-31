import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sent' | 'delivered' | 'read';

interface MessageStatusIconProps {
  status: MessageStatus;
  className?: string;
}

/**
 * WhatsApp-like message status indicator
 * - sent: single grey tick
 * - delivered: double grey ticks
 * - read: double blue ticks
 */
export const MessageStatusIcon = ({ status, className }: MessageStatusIconProps) => {
  if (status === 'sent') {
    return (
      <Check 
        className={cn('w-4 h-4 text-muted-foreground', className)} 
        strokeWidth={2.5}
      />
    );
  }

  if (status === 'delivered') {
    return (
      <CheckCheck 
        className={cn('w-4 h-4 text-muted-foreground', className)} 
        strokeWidth={2.5}
      />
    );
  }

  // read status - blue ticks
  return (
    <CheckCheck 
      className={cn('w-4 h-4 text-blue-500', className)} 
      strokeWidth={2.5}
    />
  );
};

/**
 * Get message status based on database fields
 */
export const getMessageStatus = (message: {
  read: boolean;
  delivered?: boolean;
  read_at?: string | null;
  delivered_at?: string | null;
}): MessageStatus => {
  if (message.read || message.read_at) {
    return 'read';
  }
  if (message.delivered || message.delivered_at) {
    return 'delivered';
  }
  return 'sent';
};
