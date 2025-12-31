import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, PackageCheck, PackageX, Search, Sparkles, Zap, Star, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ItemCard from '@/components/common/ItemCard';
import { getRecentLostItems, getRecentFoundItems, getRecentReturnedItems, getLostItemsCount, getFoundItemsCount, getReturnedItemsCount } from '@/db/api';
import type { LostItemWithProfile, FoundItemWithProfile } from '@/types/types';

const HomePage: React.FC = () => {
  const [lostItems, setLostItems] = useState<LostItemWithProfile[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemWithProfile[]>([]);
  const [returnedItems, setReturnedItems] = useState<Array<LostItemWithProfile | FoundItemWithProfile>>([]);
  const [lostCount, setLostCount] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [returnedCount, setReturnedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        // Set a timeout for the entire fetch operation (10 seconds max)
        const fetchPromise = Promise.all([
          getRecentLostItems(5),
          getRecentFoundItems(5),
          getRecentReturnedItems(5),
          getLostItemsCount(),
          getFoundItemsCount(),
          getReturnedItemsCount(),
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 10000);
        });

        const [lost, found, returned, lostTotal, foundTotal, returnedTotal] = await Promise.race([
          fetchPromise,
          timeoutPromise,
        ]);

        clearTimeout(timeoutId);

        if (isMounted) {
          setLostItems(lost || []);
          setFoundItems(found || []);
          setReturnedItems(returned || []);
          setLostCount(lostTotal || 0);
          setFoundCount(foundTotal || 0);
          setReturnedCount(returnedTotal || 0);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching items:', err);
        if (isMounted) {
          setError('Unable to load data. Please check your connection.');
          // Set empty arrays to prevent undefined errors
          setLostItems([]);
          setFoundItems([]);
          setReturnedItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling to refresh data every 30 seconds (reduced from 5 for mobile performance)
    const intervalId = setInterval(fetchData, 30000);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      
      {/* Hero Section with Enhanced Gradient */}
      <section className="relative overflow-hidden">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,0,100,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.05),transparent_70%)] animate-pulse" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        
        <div className="relative container mx-auto px-4 py-20 xl:py-32">
          <div className="text-center max-w-5xl mx-auto animate-fade-in">
            {/* Badge with enhanced styling */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/30 mb-8 animate-pulse-glow backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI-Powered Multi-Campus Lost & Found Platform
              </span>
              <Zap className="w-4 h-4 text-accent animate-pulse" />
            </div>
            
            {/* Hero title with enhanced effects */}
            <h1 className="text-6xl xl:text-8xl font-black mb-8 tracking-tight">
              <span className="inline-block bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.5)] animate-gradient">
                FINDIT
              </span>
              <span className="text-foreground">.AI</span>
            </h1>
            
            {/* Subtitle with better spacing */}
            <p className="text-xl xl:text-3xl text-muted-foreground mb-4 leading-relaxed font-light">
              Lost something? Found something?
            </p>
            <p className="text-lg xl:text-xl text-muted-foreground/80 mb-12 leading-relaxed max-w-3xl mx-auto">
              We're here to help reunite our IIIT Guwahati Campus with their belongings through intelligent matching and instant notifications.
            </p>
            
            {/* CTA Buttons with enhanced styling */}
            <div className="flex flex-col xl:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="text-lg h-14 px-8 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg shadow-accent/50 hover:shadow-xl hover:shadow-accent/60 transition-all duration-300 group">
                <Link to="/report-lost">
                  <PackageX className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Report Lost Item
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" className="text-lg h-14 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 group">
                <Link to="/report-found">
                  <PackageCheck className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Report Found Item
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg h-14 px-8 border-2 border-primary/40 hover:border-primary hover:bg-primary/10 transition-all duration-300 group backdrop-blur-sm">
                <Link to="/lost-items">
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Search Items
                </Link>
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 hover:scale-105">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Instant Matching</div>
                  <div className="text-sm text-muted-foreground">AI-powered search</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 hover:scale-105">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Secure Platform</div>
                  <div className="text-sm text-muted-foreground">Privacy protected</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 hover:scale-105">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">High Success Rate</div>
                  <div className="text-sm text-muted-foreground">Items reunited daily</div>
                </div>
              </div>
            </div>

            {/* Stats - Enhanced Circular Design with Glassmorphism */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 max-w-5xl mx-auto">
              {/* Lost Items Stat */}
              <div className="flex flex-col items-center group">
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border-2 border-accent/40 flex items-center justify-center mb-6 transition-all duration-500 hover:scale-110 hover:border-accent/60 backdrop-blur-sm">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/10 to-transparent animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-accent/5 blur-xl group-hover:bg-accent/10 transition-all duration-500" />
                  <div className="relative z-10 text-center select-none">
                    <div className="text-6xl font-black text-accent mb-2 drop-shadow-[0_0_20px_rgba(255,0,100,0.5)]">{lostCount}</div>
                    <div className="text-sm text-accent/90 font-semibold uppercase tracking-wider">Items</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full animate-ping opacity-75" />
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                    <PackageX className="w-5 h-5 text-accent" />
                    Lost Items
                  </div>
                  <div className="text-sm text-muted-foreground">Waiting to be found</div>
                </div>
              </div>

              {/* Found Items Stat */}
              <div className="flex flex-col items-center group">
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-2 border-primary/40 flex items-center justify-center mb-6 transition-all duration-500 hover:scale-110 hover:border-primary/60 backdrop-blur-sm">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all duration-500" />
                  <div className="relative z-10 text-center select-none">
                    <div className="text-6xl font-black text-primary mb-2 drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">{foundCount}</div>
                    <div className="text-sm text-primary/90 font-semibold uppercase tracking-wider">Items</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-ping opacity-75" />
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                    <PackageCheck className="w-5 h-5 text-primary" />
                    Found Items
                  </div>
                  <div className="text-sm text-muted-foreground">Ready to be claimed</div>
                </div>
              </div>

              {/* Successful Returns Stat */}
              <div className="flex flex-col items-center group">
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-green-400/20 via-green-400/10 to-transparent border-2 border-green-400/40 flex items-center justify-center mb-6 transition-all duration-500 hover:scale-110 hover:border-green-400/60 backdrop-blur-sm">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/10 to-transparent animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-green-400/5 blur-xl group-hover:bg-green-400/10 transition-all duration-500" />
                  <div className="relative z-10 text-center select-none">
                    <div className="text-6xl font-black text-green-400 mb-2 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">{returnedCount}</div>
                    <div className="text-sm text-green-400/90 font-semibold uppercase tracking-wider">Returns</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping opacity-75" />
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-green-400" />
                    Success Stories
                  </div>
                  <div className="text-sm text-muted-foreground">Happy reunions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lost Items Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
              <PackageX className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Lost Items</h2>
              <p className="text-muted-foreground">Help reunite people with their belongings</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="interactive-scale">
            <Link to="/lost-items" className="flex items-center gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <Skeleton className="h-48 w-full bg-muted" />
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <PackageX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : lostItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{lostItems.map((item, index) => (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ItemCard item={item} type="lost" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-border">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No lost items reported yet</p>
          </div>
        )}
      </section>

      {/* Found Items Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <PackageCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Found Items</h2>
              <p className="text-muted-foreground">Browse items waiting to be claimed</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="interactive-scale">
            <Link to="/found-items" className="flex items-center gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <Skeleton className="h-48 w-full bg-muted" />
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <PackageCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : foundItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {foundItems.map((item, index) => (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ItemCard item={item} type="found" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-border">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No found items listed yet</p>
          </div>
        )}
      </section>

      {/* Recently Returned Section */}
      <section className="container mx-auto px-4 py-12 pb-20">
        <div className="flex items-center justify-between mb-8 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <Sparkles className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Success Stories</h2>
              <p className="text-muted-foreground">Celebrating successful reunions</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="interactive-scale">
            <Link to="/history" className="flex items-center gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <Skeleton className="h-48 w-full bg-muted" />
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : returnedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {returnedItems.map((item, index) => (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ItemCard item={item} type="returned" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card/30 rounded-xl border border-border">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No success stories yet</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
