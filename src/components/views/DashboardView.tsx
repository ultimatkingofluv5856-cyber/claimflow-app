import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardSummary, getDashboardChartData, getManagerAssignedUsersWithBalances } from '@/lib/claims-api';
import { FileText, Users, Clock, UserCheck, ShieldCheck, Wallet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Rupee icon component
function RupeeIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 3v18M18 9H8c-1 0-2 1-2 2v2c0 1 1 2 2 2h10M8 15h10" />
    </svg>
  );
}

function formatCurrency(num: number) {
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({ icon: Icon, label, value, subtitle, color = 'text-primary' }: { icon: any; label: string; value: string | number; subtitle: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="text-muted-foreground mb-3"><Icon className={`h-8 w-8 mx-auto ${color}`} /></div>
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-2">{subtitle}</div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STATUS_COLORS: Record<string, string> = {
  'Approved': '#10b981',
  'Rejected': '#ef4444',
  'Pending Manager Approval': '#f59e0b',
  'Pending Admin Approval': '#3b82f6',
};

export default function DashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [managerUsers, setManagerUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [result, charts] = await Promise.all([
        getDashboardSummary(user.email, user.role),
        getDashboardChartData(user.email, user.role),
      ]);
      setData(result);
      setChartData(charts);
      
      // Load manager's assigned users if manager
      if (user.role === 'Manager') {
        const assignedUsers = await getManagerAssignedUsersWithBalances(user.email);
        setManagerUsers(assignedUsers);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, [user]);

  if (loading) return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="h-20 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-muted" />)}
      </div>
    </div>
  );

  const isUserRole = data?.role === 'User';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gradient">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Quick summary of claims and balances</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {isUserRole ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={FileText} label="My Claims" value={data?.myClaims ?? 0} subtitle="Total claims submitted" />
          <StatCard icon={RupeeIcon} label="My Amount" value={formatCurrency(data?.myAmount ?? 0)} subtitle="Total amount claimed" color="text-success" />
          <StatCard icon={Wallet} label="My Balance" value={formatCurrency(data?.myBalance ?? 0)} subtitle="Available balance" color="text-info" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <StatCard icon={FileText} label="Total Claims" value={data?.totalClaims ?? 0} subtitle="All claims in system" />
            <StatCard icon={Users} label="Total Users" value={data?.totalUsers ?? 0} subtitle="Registered users" color="text-info" />
            <StatCard icon={RupeeIcon} label="Total Amount" value={formatCurrency(data?.totalAmount ?? 0)} subtitle="Total claimed amount" color="text-success" />
            <StatCard icon={Clock} label="Pending Claims" value={data?.pendingClaims ?? 0} subtitle="Awaiting approval" color="text-warning" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <StatCard icon={UserCheck} label="Pending Manager" value={data?.pendingManagerClaims ?? 0} subtitle="Awaiting manager approval" color="text-warning" />
            <StatCard icon={ShieldCheck} label="Pending Admin" value={data?.pendingAdminClaims ?? 0} subtitle="Awaiting admin approval" color="text-destructive" />
          </div>

          {/* Manager: Assigned Users with Balances */}
          {user?.role === 'Manager' && managerUsers.length > 0 && (
            <div className="glass-card p-6 mt-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Assigned Employees</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-3 text-left">Employee Name</th>
                      <th className="p-3 text-right">Current Balance</th>
                      <th className="p-3 text-right">Last Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerUsers.map((emp, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3">{emp.name}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency(emp.balance)}</td>
                        <td className="p-3 text-right text-xs text-muted-foreground">
                          {emp.lastTransactionDate ? new Date(emp.lastTransactionDate).toLocaleDateString('en-IN') : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Charts Section */}
      {chartData && (
        <div className="mt-6 space-y-6">
          {/* Monthly Trend */}
          {chartData.monthly?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 text-foreground">Monthly Claims Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                  />
                  <Legend />
                  <Bar dataKey="withBill" name="With Bill" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withoutBill" name="Without Bill" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            {chartData.byCategory?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Spend by Category</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData.byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {chartData.byCategory.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Status Distribution */}
            {chartData.byStatus?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Claims by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData.byStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {chartData.byStatus.map((entry: any, i: number) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
