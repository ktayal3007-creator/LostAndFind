import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ItemCard from '@/components/common/ItemCard';
import { getReturnedItems } from '@/db/api';
import type { LostItemWithProfile, FoundItemWithProfile } from '@/types/types';

const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<Array<LostItemWithProfile | FoundItemWithProfile>>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await getReturnedItems(dateRange?.from, dateRange?.to);
        setItems(data);
      } catch (error) {
        console.error('Error fetching returned items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [dateRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
            <Package className="w-7 h-7 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold">History of Returns</h1>
            <p className="text-muted-foreground">
              Successful reunions and happy endings
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-8 animate-slide-in">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No returned items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filter criteria
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {items.length} successful {items.length === 1 ? 'return' : 'returns'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} type="returned" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
