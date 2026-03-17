import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  BarChart3, FileUp, History, UserCheck, ShieldCheck, Users, Menu, UserCircle
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Scale, Receipt, Settings, Shield, LogOut } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const primaryNavItems = [
  { id: 'dashboard', icon: BarChart3, label: 'Home', roles: ['all'] },
  { id: 'submit', icon: FileUp, label: 'Submit', roles: ['all'] },
  { id: 'history', icon: History, label: 'History', roles: ['all'] },
  { id: 'profile', icon: UserCircle, label: 'Profile', roles: ['all'] },
];

const allNavItems = [
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard', roles: ['all'] },
  { id: 'submit', icon: FileUp, label: 'Submit Claim', roles: ['all'] },
  { id: 'history', icon: History, label: 'Claim History', roles: ['all'] },
  { id: 'transactions', icon: ArrowLeftRight, label: 'Transactions', roles: ['all'] },
  { id: 'balances', icon: Scale, label: 'User Balances', roles: ['all'] },
  { id: 'manager-approval', icon: UserCheck, label: 'Manager Approval', roles: ['Manager', 'Super Admin'] },
  { id: 'admin-approval', icon: ShieldCheck, label: 'Admin Approval', roles: ['Admin', 'Super Admin'] },
  { id: 'voucher', icon: Receipt, label: 'Payment Voucher', roles: ['Admin', 'Super Admin'] },
  { id: 'users', icon: Users, label: 'User Management', roles: ['Admin', 'Super Admin'] },
  { id: 'audit', icon: Shield, label: 'Audit Trail', roles: ['Admin', 'Super Admin'] },
  { id: 'settings', icon: Settings, label: 'Settings', roles: ['Admin', 'Super Admin'] },
  { id: 'profile', icon: UserCircle, label: 'My Profile', roles: ['all'] },
];

export default function MobileBottomNav({ activeView, onNavigate }: MobileBottomNavProps) {
  const { user, logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredAllItems = allNavItems.filter(item => {
    if (item.roles.includes('all')) return true;
    return item.roles.includes(user?.role || '');
  });

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setSheetOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
        
        {/* More Menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full py-1 text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
            <SheetHeader className="pb-4 border-b border-border">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="grid grid-cols-3 gap-3">
                {filteredAllItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
              <Button 
                variant="destructive" 
                className="w-full h-12" 
                onClick={() => { logout(); setSheetOpen(false); }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
