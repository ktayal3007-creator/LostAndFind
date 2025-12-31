import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, Sparkles, Zap, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import PhoneCollectionModal from '@/components/common/PhoneCollectionModal';

const Header: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, profile, signOut } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Check if user needs to add phone number
  useEffect(() => {
    if (user && profile && !profile.phone) {
      setShowPhoneModal(true);
    }
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Lost Items', path: '/lost-items' },
    { name: 'Found Items', path: '/found-items' },
    { name: 'Report Lost', path: '/report-lost' },
    { name: 'Report Found', path: '/report-found' },
    { name: 'Smart Search', path: '/image-search' },
    { name: 'Chats', path: '/chats' },
    { name: 'History', path: '/history' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Enhanced Logo */}
          <Link to="/" className="flex items-center space-x-3 group relative">
            {/* Animated glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 rounded-full" />
            
            {/* Logo icon with multiple layers */}
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/50">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
              <Search className="w-6 h-6 text-background relative z-10 drop-shadow-lg" />
              <Sparkles className="w-3 h-3 text-background absolute top-1 right-1 animate-pulse" />
            </div>
            
            {/* Logo text with gradient */}
            <div className="flex items-center relative">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                FINDIT
              </span>
              <span className="text-2xl font-black tracking-tight text-foreground">.AI</span>
              <Zap className="w-4 h-4 text-accent ml-1 animate-pulse" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 interactive-scale ${
                  isActive(item.path)
                    ? 'bg-primary text-background shadow-lg shadow-primary/50'
                    : 'text-foreground hover:bg-secondary hover:text-primary border border-transparent hover:border-primary/20'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Auth Buttons - Desktop */}
            <div className="ml-4 flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-primary/30 hover:border-primary">
                      <User className="w-4 h-4 mr-2" />
                      {profile?.email?.split('@')[0] || 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      {profile?.email}
                    </DropdownMenuItem>
                    {profile?.phone && (
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        {profile.phone}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon" className="border-primary/30 hover:border-primary interactive-scale">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-card border-border overflow-y-auto">
              <nav className="flex flex-col space-y-3 mt-8 pb-8">
                <Link to="/" className="flex items-center space-x-3 mb-6 group relative" onClick={() => setIsOpen(false)}>
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/50">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                    <Search className="w-6 h-6 text-background relative z-10 drop-shadow-lg" />
                    <Sparkles className="w-3 h-3 text-background absolute top-1 right-1 animate-pulse" />
                  </div>
                  <div className="flex items-center relative">
                    <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                      FINDIT
                    </span>
                    <span className="text-2xl font-black tracking-tight text-foreground">.AI</span>
                    <Zap className="w-4 h-4 text-accent ml-1 animate-pulse" />
                  </div>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-primary text-background shadow-lg shadow-primary/50'
                        : 'text-foreground hover:bg-secondary hover:text-primary border border-transparent hover:border-primary/20'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Auth Buttons - Mobile */}
                <div className="pt-4 mt-4 border-t border-border space-y-3">
                  {user ? (
                    <>
                      <div className="px-4 py-2 bg-secondary/50 rounded-lg">
                        <div className="text-sm font-medium text-foreground">{profile?.email?.split('@')[0] || 'User'}</div>
                        <div className="text-xs text-muted-foreground">{profile?.email}</div>
                        {profile?.phone && (
                          <div className="text-xs text-muted-foreground">{profile.phone}</div>
                        )}
                      </div>
                      <Button 
                        onClick={() => { handleSignOut(); setIsOpen(false); }} 
                        variant="outline" 
                        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full bg-gradient-to-r from-primary to-primary/80">
                      <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Phone Collection Modal */}
      <PhoneCollectionModal 
        open={showPhoneModal} 
        onClose={() => setShowPhoneModal(false)} 
      />
    </header>
  );
};

export default Header;
