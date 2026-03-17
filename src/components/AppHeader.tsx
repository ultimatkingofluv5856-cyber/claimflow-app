import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="glass-card mx-3 sm:mx-4 mt-[env(safe-area-inset-top,16px)] sm:mt-4 mb-4 sm:mb-6 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40 bg-card/95 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Claims Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">{user?.name}</span>
            <span className="hidden sm:inline"> ({user?.role})</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-border">
            {user?.profile_picture_url ? (
              <AvatarImage src={user.profile_picture_url} alt={user.name} />
            ) : (
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm font-medium text-foreground hidden lg:inline">{user?.name}</span>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="h-8 sm:h-9 px-2 sm:px-3">
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
