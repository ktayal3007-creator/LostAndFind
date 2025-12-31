import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Tag, User, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LostItemWithProfile, FoundItemWithProfile, ReturnedItem } from '@/types/types';

interface ItemCardProps {
  item: LostItemWithProfile | FoundItemWithProfile | ReturnedItem;
  type: 'lost' | 'found' | 'returned';
}

const ItemCard: React.FC<ItemCardProps> = ({ item, type }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // For returned items, determine the original type
    if (type === 'returned') {
      // Check if it has date_lost or date_found to determine type
      const itemType = 'date_lost' in item ? 'lost' : 'found';
      navigate(`/${itemType}/${item.id}`);
    } else {
      navigate(`/${type}/${item.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDateField = () => {
    if (type === 'returned') {
      // For returned items, show the return_date
      return formatDate((item as ReturnedItem).return_date || (item as ReturnedItem).created_at);
    }
    if (type === 'lost') return formatDate((item as LostItemWithProfile).date_lost);
    if (type === 'found') return formatDate((item as FoundItemWithProfile).date_found);
    return formatDate(item.created_at);
  };

  const getDateLabel = () => {
    if (type === 'returned') return 'Returned on';
    if (type === 'lost') return 'Lost on';
    if (type === 'found') return 'Found on';
    return 'Date';
  };

  const getContactName = () => {
    // Get username or full_name from profile data (joined from profiles table)
    // Only for lost/found items, not returned items
    if (type === 'returned') {
      return 'See details';
    }
    const profileItem = item as LostItemWithProfile | FoundItemWithProfile;
    return profileItem.username || profileItem.full_name || 'Anonymous';
  };

  const getBadgeClass = () => {
    if (type === 'lost') return 'bg-accent/90 text-accent-foreground hover:bg-accent border-accent/50';
    if (type === 'found') return 'bg-primary/90 text-background hover:bg-primary border-primary/50';
    return 'bg-green-500/90 text-white hover:bg-green-500 border-green-500/50';
  };

  return (
    <Card
      className="card-hover cursor-pointer animate-fade-in bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden"
      onClick={handleClick}
    >
      {/* Image Section */}
      {item.image_url && (
        <div className="relative h-40 w-full overflow-hidden bg-secondary/30">
          <img 
            src={item.image_url} 
            alt={item.item_name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <Badge
              className={`${getBadgeClass()} shadow-lg interactive-scale border backdrop-blur-sm`}
            >
              {type === 'lost' ? 'Lost' : type === 'found' ? 'Found' : 'Returned'}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-2 text-foreground group-hover:text-primary transition-colors">
              {item.item_name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-muted-foreground">
              {item.description}
            </CardDescription>
          </div>
          {!item.image_url && (
            <Badge
              className={`${getBadgeClass()} shrink-0 shadow-lg interactive-scale border`}
            >
              {type === 'lost' ? 'Lost' : type === 'found' ? 'Found' : 'Returned'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
              <Tag className="w-4 h-4" />
            </div>
            <span className="font-medium">{item.category}</span>
          </div>
          <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="line-clamp-1 flex-1">{item.location} • {item.campus}</span>
          </div>
          <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
              <Calendar className="w-4 h-4" />
            </div>
            <span>{getDateLabel()} {getDateField()}</span>
          </div>
          
          {type === 'returned' ? (
            <>
              <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
                  <User className="w-4 h-4" />
                </div>
                <span className="line-clamp-1">Owner: {(item as ReturnedItem).owner_name}</span>
              </div>
              {(item as ReturnedItem).owner_contact && (
                <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="line-clamp-1 text-xs">{(item as ReturnedItem).owner_contact}</span>
                </div>
              )}
              <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
                  <User className="w-4 h-4" />
                </div>
                <span className="line-clamp-1">Finder: {(item as ReturnedItem).finder_name}</span>
              </div>
              {(item as ReturnedItem).finder_contact && (
                <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="line-clamp-1 text-xs">{(item as ReturnedItem).finder_contact}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 mr-3">
                <User className="w-4 h-4" />
              </div>
              <span className="line-clamp-1">{getContactName()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemCard;
