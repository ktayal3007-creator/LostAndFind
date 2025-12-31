import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Tag, User, Mail, Phone, Info, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getLostItemById, getFoundItemById, getReturnedItemById } from '@/db/api';
import type { LostItem, FoundItem, ReturnedItem, LostItemWithProfile, FoundItemWithProfile } from '@/types/types';
import ChatButton from '@/components/chat/ChatButton';

type ItemType = 'lost' | 'found' | 'returned';

const ItemDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<LostItemWithProfile | FoundItemWithProfile | ReturnedItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !type) return;

      try {
        setLoading(true);
        let data = null;

        // Handle both URL patterns: /lost/{id} and /lost-item/{id}
        if (type === 'lost-item' || type === 'lost') {
          data = await getLostItemById(id);
        } else if (type === 'found-item' || type === 'found') {
          data = await getFoundItemById(id);
        } else if (type === 'returned-item' || type === 'returned') {
          data = await getReturnedItemById(id);
        }

        setItem(data);
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, type]);

  const getItemType = (): ItemType => {
    if (type === 'lost-item' || type === 'lost') return 'lost';
    if (type === 'found-item' || type === 'found') return 'found';
    return 'returned';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="h-12 bg-muted animate-pulse rounded-lg" />
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Item Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The item you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const itemType = getItemType();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Main Card */}
          <Card className="animate-slide-in">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-3">{item.item_name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        itemType === 'lost'
                          ? 'destructive'
                          : itemType === 'found'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {itemType === 'lost' ? 'Lost' : itemType === 'found' ? 'Found' : 'Returned'}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Image */}
              {item.image_url && (
                <div className="relative w-full overflow-hidden rounded-lg bg-secondary/30">
                  <img 
                    src={item.image_url} 
                    alt={item.item_name}
                    className="w-full max-h-96 object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        {itemType === 'lost'
                          ? 'Date Lost'
                          : itemType === 'found'
                            ? 'Date Found'
                            : 'Return Date'}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDate(
                          itemType === 'lost'
                            ? (item as LostItem).date_lost
                            : itemType === 'found'
                              ? (item as FoundItem).date_found
                              : (item as ReturnedItem).return_date
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-muted-foreground">{item.location}</p>
                      <p className="text-sm text-muted-foreground">{item.campus}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {itemType === 'returned' ? (
                    <>
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Owner (Receiver)</p>
                          <p className="text-muted-foreground">
                            {(item as ReturnedItem).owner_name}
                          </p>
                        </div>
                      </div>

                      {(item as ReturnedItem).owner_contact && (
                        <div className="flex items-start space-x-3">
                          <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Owner Email</p>
                            <a 
                              href={`mailto:${(item as ReturnedItem).owner_contact}`}
                              className="text-primary hover:underline break-all"
                            >
                              {(item as ReturnedItem).owner_contact}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Finder (Reporter)</p>
                          <p className="text-muted-foreground">
                            {(item as ReturnedItem).finder_name}
                          </p>
                        </div>
                      </div>

                      {(item as ReturnedItem).finder_contact && (
                        <div className="flex items-start space-x-3">
                          <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Finder Email</p>
                            <a 
                              href={`mailto:${(item as ReturnedItem).finder_contact}`}
                              className="text-primary hover:underline break-all"
                            >
                              {(item as ReturnedItem).finder_contact}
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Contact Name</p>
                          <p className="text-muted-foreground">
                            {(item as LostItemWithProfile | FoundItemWithProfile).username || 
                             (item as LostItemWithProfile | FoundItemWithProfile).full_name || 
                             'Anonymous'}
                          </p>
                        </div>
                      </div>

                      {(item as LostItemWithProfile | FoundItemWithProfile).email && (
                        <div className="flex items-start space-x-3">
                          <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <a
                              href={`mailto:${(item as LostItemWithProfile | FoundItemWithProfile).email}`}
                              className="text-primary hover:underline"
                            >
                              {(item as LostItemWithProfile | FoundItemWithProfile).email}
                            </a>
                          </div>
                        </div>
                      )}

                      {(item as LostItemWithProfile | FoundItemWithProfile).phone && (
                        <div className="flex items-start space-x-3">
                          <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Phone</p>
                            <a
                              href={`tel:${(item as LostItemWithProfile | FoundItemWithProfile).phone}`}
                              className="text-primary hover:underline"
                            >
                              {(item as LostItemWithProfile | FoundItemWithProfile).phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Chat Button */}
                      <div className="pt-4">
                        <ChatButton
                          itemId={item.id}
                          itemType={itemType as 'lost' | 'found'}
                          itemOwnerId={(item as LostItemWithProfile | FoundItemWithProfile).user_id}
                          itemOwnerEmail={(item as LostItemWithProfile | FoundItemWithProfile).email}
                          itemOwnerUsername={(item as LostItemWithProfile | FoundItemWithProfile).username}
                          itemOwnerFullName={(item as LostItemWithProfile | FoundItemWithProfile).full_name}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {itemType !== 'returned' && (item as LostItem | FoundItem).additional_info && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Additional Information</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {(item as LostItem | FoundItem).additional_info}
                    </p>
                  </div>
                </>
              )}

              {/* Return Story */}
              {itemType === 'returned' && (item as ReturnedItem).story && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Return Story</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {(item as ReturnedItem).story}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
