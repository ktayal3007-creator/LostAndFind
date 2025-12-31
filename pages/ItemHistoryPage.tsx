import React, { useEffect, useState } from 'react';
import { History, Loader2, Trash2, Package, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getItemHistory, deleteItemFromHistory } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { LostItemWithProfile, FoundItemWithProfile } from '@/types/types';

const ItemHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lostItems, setLostItems] = useState<LostItemWithProfile[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: 'lost' | 'found' } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getItemHistory(user.id);
      setLostItems(data.lostItems);
      setFoundItems(data.foundItems);
    } catch (err) {
      console.error('Error loading item history:', err);
      setError('Unable to load item history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!user || !deletingItem) return;

    try {
      setDeleting(true);
      await deleteItemFromHistory(deletingItem.id, deletingItem.type, user.id);

      toast({
        title: 'Item Deleted',
        description: 'The item has been permanently removed from your history',
      });

      // Refresh the list
      await loadHistory();
      setDeletingItem(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getConclusionLabel = (conclusionType: string | null) => {
    if (!conclusionType) return 'Concluded';
    
    const labels: Record<string, string> = {
      'item_found': 'Item Found',
      'item_not_found': 'Item Not Found',
      'owner_found': 'Owner Found',
      'owner_not_found': 'Owner Not Found',
    };

    return labels[conclusionType] || 'Concluded';
  };

  const getConclusionVariant = (conclusionType: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!conclusionType) return 'secondary';
    
    if (conclusionType === 'item_found' || conclusionType === 'owner_found') {
      return 'default';
    }
    
    return 'secondary';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to view your item history</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalItems = lostItems.length + foundItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold">Item History</h1>
            <p className="text-muted-foreground">
              View your concluded lost and found items
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-24 w-24 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4 bg-muted" />
                      <Skeleton className="h-4 w-1/2 bg-muted" />
                      <Skeleton className="h-4 w-2/3 bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load History</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadHistory} variant="outline">
              Retry
            </Button>
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-border">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground">
              Concluded items will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Lost Items History */}
            {lostItems.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Lost Items ({lostItems.length})
                </h2>
                <div className="grid gap-4">
                  {lostItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Item Image */}
                          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.item_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-muted-foreground" />
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">
                                  {item.item_name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                              <Badge variant={getConclusionVariant(item.conclusion_type)}>
                                {getConclusionLabel(item.conclusion_type)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Lost: {new Date(item.date_lost).toLocaleDateString()}</span>
                              </div>
                              {item.concluded_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Concluded: {formatDistanceToNow(new Date(item.concluded_at), { addSuffix: true })}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{item.category}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingItem({ id: item.id, type: 'lost' })}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Found Items History */}
            {foundItems.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Found Items ({foundItems.length})
                </h2>
                <div className="grid gap-4">
                  {foundItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Item Image */}
                          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.item_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-muted-foreground" />
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">
                                  {item.item_name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                              <Badge variant={getConclusionVariant(item.conclusion_type)}>
                                {getConclusionLabel(item.conclusion_type)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Found: {new Date(item.date_found).toLocaleDateString()}</span>
                              </div>
                              {item.concluded_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Concluded: {formatDistanceToNow(new Date(item.concluded_at), { addSuffix: true })}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{item.category}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingItem({ id: item.id, type: 'found' })}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item from History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
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

export default ItemHistoryPage;
