import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle, XCircle, MessageCircle, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUserMatches, updateMatchStatus, getOrCreateConversation } from '@/db/api';
import type { Match } from '@/types/types';

const MatchesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    try {
      setLoading(true);

      // Add timeout to prevent infinite loading
      const fetchPromise = getUserMatches(user.id);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const data = await Promise.race([fetchPromise, timeoutPromise]);
      
      clearTimeout(timeoutId);
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
      // Don't show error toast, just show empty state
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (matchId: string, status: 'confirmed' | 'rejected') => {
    try {
      setUpdatingMatch(matchId);
      await updateMatchStatus(matchId, status);
      
      toast({
        title: status === 'confirmed' ? 'Match Confirmed!' : 'Match Rejected',
        description: status === 'confirmed' 
          ? 'You can now chat with the other user.' 
          : 'This match has been marked as not relevant.',
      });

      loadMatches();
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: 'Error',
        description: 'Failed to update match status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingMatch(null);
    }
  };

  const handleContactUser = async (match: Match) => {
    if (!user || !match.lost_item || !match.found_item) return;

    try {
      const conversation = await getOrCreateConversation(
        match.lost_item.id,
        match.found_item.id,
        match.lost_item.user_id || '',
        match.found_item.user_id || ''
      );

      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-primary';
    return 'text-yellow-500';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    return 'destructive';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view your matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI-Powered Matches</h1>
                <p className="text-muted-foreground">
                  Potential matches found for your items
                </p>
              </div>
            </div>
          </div>

          {/* Matches List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : matches.length === 0 ? (
            <Card className="animate-slide-in">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  We'll notify you when we find potential matches for your reported items.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {matches.map((match, index) => (
                <Card
                  key={match.id}
                  className="animate-slide-in overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-xl">
                            {match.lost_item?.item_name} ↔ {match.found_item?.item_name}
                          </CardTitle>
                          <Badge variant={getScoreBadgeVariant(match.similarity_score)}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {match.similarity_score}% Match
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {match.match_reason}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          match.status === 'confirmed'
                            ? 'default'
                            : match.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {match.status === 'confirmed' ? 'Confirmed' : match.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Lost Item */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-destructive">Lost Item</h4>
                        {match.lost_item?.image_url && (
                          <img
                            src={match.lost_item.image_url}
                            alt={match.lost_item.item_name}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {match.lost_item?.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>📍 {match.lost_item?.location}</span>
                          <span>🏫 {match.lost_item?.campus}</span>
                          <span>📅 {new Date(match.lost_item?.date_lost || '').toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Found Item */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-primary">Found Item</h4>
                        {match.found_item?.image_url && (
                          <img
                            src={match.found_item.image_url}
                            alt={match.found_item.item_name}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {match.found_item?.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>📍 {match.found_item?.location}</span>
                          <span>🏫 {match.found_item?.campus}</span>
                          <span>📅 {new Date(match.found_item?.date_found || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    {match.status === 'pending' && (
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => handleUpdateStatus(match.id, 'confirmed')}
                          disabled={updatingMatch === match.id}
                          className="flex-1"
                        >
                          {updatingMatch === match.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Confirm Match
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(match.id, 'rejected')}
                          disabled={updatingMatch === match.id}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Not a Match
                        </Button>
                      </div>
                    )}

                    {match.status === 'confirmed' && (
                      <Button
                        onClick={() => handleContactUser(match)}
                        className="w-full"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact User
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
