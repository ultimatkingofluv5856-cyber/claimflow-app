import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Loader2 } from 'lucide-react';

// Lazy load views for better performance
const DashboardView = lazy(() => import('@/components/views/DashboardView'));
const SubmitClaimView = lazy(() => import('@/components/views/SubmitClaimView'));
const ClaimHistoryView = lazy(() => import('@/components/views/ClaimHistoryView'));
const TransactionsView = lazy(() => import('@/components/views/TransactionsView'));
const UserBalanceView = lazy(() => import('@/components/views/UserBalanceView'));
const ApprovalView = lazy(() => import('@/components/views/ApprovalView'));
const PaymentVoucherView = lazy(() => import('@/components/views/PaymentVoucherView'));
const UserManagementView = lazy(() => import('@/components/views/UserManagementView'));
const SettingsView = lazy(() => import('@/components/views/SettingsView'));
const AuditLogView = lazy(() => import('@/components/views/AuditLogView'));
const UserProfileView = lazy(() => import('@/components/views/UserProfileView'));

function ViewLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function Index() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'submit': return <SubmitClaimView />;
      case 'history': return <ClaimHistoryView />;
      case 'transactions': return <TransactionsView />;
      case 'balances': return <UserBalanceView />;
      case 'manager-approval': return <ApprovalView type="manager" />;
      case 'admin-approval': return <ApprovalView type="admin" />;
      case 'voucher': return <PaymentVoucherView />;
      case 'users': return <UserManagementView />;
      case 'settings': return <SettingsView />;
      case 'audit': return <AuditLogView />;
      case 'profile': return <UserProfileView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top,0px)]">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar activeView={activeView} onNavigate={setActiveView} />
      </div>
      
      <div className="md:ml-[70px] transition-all duration-300">
        <AppHeader />
        <main className="px-3 sm:px-4 pb-24 md:pb-8">
          <Suspense fallback={<ViewLoader />}>
            {renderView()}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeView={activeView} onNavigate={setActiveView} />
    </div>
  );
}
