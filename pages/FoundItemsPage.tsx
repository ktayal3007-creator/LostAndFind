import React, { useEffect, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import SearchBar from '@/components/common/SearchBar';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ItemCard from '@/components/common/ItemCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getFoundItems } from '@/db/api';
import type { FoundItemWithProfile } from '@/types/types';
import { useDebounce } from '@/hooks/use-debounce';

const FoundItemsPage: React.FC = () => {
  const [items, setItems] = useState<FoundItemWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent infinite loading
        const fetchPromise = getFoundItems(
          debouncedSearch,
          dateRange?.from,
          dateRange?.to
        );

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 10000);
        });

        const data = await Promise.race([fetchPromise, timeoutPromise]);
        
        clearTimeout(timeoutId);

        if (isMounted) {
          setItems(data || []);
        }
      } catch (err) {
        console.error('Error fetching found items:', err);
        if (isMounted) {
          setError('Unable to load items. Please check your connection.');
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [debouncedSearch, dateRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <PackageCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold">Found Items</h1>
            <p className="text-muted-foreground">Browse all reported found items</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col xl:flex-row gap-4 mb-8 animate-slide-in">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search found items by name, description, location..."
            />
          </div>
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <Skeleton className="h-48 w-full bg-muted" />
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <PackageCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Items</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-border">
            <PackageCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No found items</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Found {items.length} {items.length === 1 ? 'item' : 'items'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} type="found" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FoundItemsPage;
