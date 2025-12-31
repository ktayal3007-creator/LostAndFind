import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getMainHistory } from '@/db/api';
import type { LostItemWithProfile, FoundItemWithProfile } from '@/types/types';
import { Calendar, MapPin, User, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function MainHistoryPage() {
  const [lostItems, setLostItems] = useState<LostItemWithProfile[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMainHistory();
  }, []);

  const loadMainHistory = async () => {
    try {
      setLoading(true);
      const data = await getMainHistory();
      setLostItems(data.lostItems);
      setFoundItems(data.foundItems);
    } catch (error) {
      console.error('Error loading main history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (id: string, type: 'lost' | 'found') => {
    navigate(`/${type}/${id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2 bg-muted" />
          <Skeleton className="h-6 w-96 bg-muted" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const allItems = [
    ...lostItems.map(item => ({ ...item, type: 'lost' as const })),
    ...foundItems.map(item => ({ ...item, type: 'found' as const }))
  ].sort((a, b) => {
    const dateA = new Date(a.concluded_at || a.created_at);
    const dateB = new Date(b.concluded_at || b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Success Stories</h1>
        </div>
        <p className="text-muted-foreground">
          Celebrating reunions! Items successfully returned to their owners.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Success Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {allItems.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lost Items Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {lostItems.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Found Items Returned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {foundItems.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Grid */}
      {allItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Success Stories Yet
            </h3>
            <p className="text-muted-foreground">
              Success stories will appear here when items are successfully returned to their owners.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allItems.map((item) => (
            <Card
              key={`${item.type}-${item.id}`}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleItemClick(item.id, item.type)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg line-clamp-1">
                    {item.item_name}
                  </CardTitle>
                  <Badge
                    variant={item.type === 'lost' ? 'default' : 'secondary'}
                    className="shrink-0"
                  >
                    {item.type === 'lost' ? 'Item Found' : 'Owner Found'}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Reunited
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.image_url && (
                  <div className="w-full h-40 rounded-md overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {item.full_name || item.username || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {item.location} • {item.campus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      {item.concluded_at
                        ? format(new Date(item.concluded_at), 'MMM d, yyyy')
                        : 'Recently'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
