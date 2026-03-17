import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClaimsHistory, getClaimById, getUsersDirectory, getCompanySettings } from '@/lib/claims-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, RefreshCw, Eye, Filter, Download, FileText, Paperclip, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AttachmentPreview from '@/components/views/AttachmentPreview';
import { supabase } from '@/integrations/supabase/client';
import { exportClaimsCSV } from '@/lib/export-utils';
import { amountToWords } from '@/lib/amount-to-words';

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes('approved') && !s.includes('pending')) return <Badge className="px-2 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Approved</Badge>;
  if (s.includes('reject')) return <Badge className="px-2 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Rejected</Badge>;
  return <Badge className="px-2 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>{status}</Badge>;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getPublicUrl(fileId: string) {
  try {
    const { data } = supabase.storage.from('claim-attachments').getPublicUrl(fileId);
    return data?.publicUrl || '';
  } catch (e) {
    return '';
  }
}

function generateClaimPDFHtml(claims: any[], companySettings: any) {
  const logo = companySettings?.logo_url ? `<img src="${companySettings.logo_url}" style="height:50px;margin-bottom:8px" />` : '';
  const companyName = companySettings?.company_name || 'Company';
  const nonRejected = claims.filter(c => !c.status.toLowerCase().includes('reject'));
  const rejectedAmount = claims.filter(c => c.status.toLowerCase().includes('reject')).reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalAmount = nonRejected.reduce((sum, c) => sum + (c.amount || 0), 0);
  const grandTotal = claims.reduce((sum, c) => sum + (c.amount || 0), 0);

  const rows = claims.map(c => `
    <tr>
      <td>${c.claimId}</td>
      <td>${formatDate(c.date)}</td>
      <td>${c.submittedBy}</td>
      <td>${c.site}</td>
      <td class="text-right">₹${(c.totalWithBill ?? 0).toFixed(2)}</td>
      <td class="text-right">₹${(c.totalWithoutBill ?? 0).toFixed(2)}</td>
      <td class="text-right"><strong>₹${(c.amount ?? 0).toFixed(2)}</strong></td>
      <td>${c.status}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Claims Report - ${companyName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f5f5f5; font-weight: bold; }
  .text-right { text-align: right; }
  h1 { color: #2563eb; font-size: 18px; margin: 0; }
  .header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px; }
  .summary { margin-top: 15px; font-size: 13px; }
  .rejected { color: #dc2626; }
  @media print { body { padding: 0; } }
</style></head><body>
  <div class="header">
    ${logo}
    <div>
      <h1>${companyName}</h1>
      <p style="margin:2px 0;color:#666">Claims Report • Generated: ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Claim ID</th><th>Date</th><th>Submitted By</th><th>Site</th><th class="text-right">With Bill</th><th class="text-right">Without Bill</th><th class="text-right">Total</th><th>Status</th></tr></thead>
    <tbody>${rows}
      <tr style="font-weight:bold;background:#f5f5f5">
        <td colspan="6" class="text-right">GRAND TOTAL</td>
        <td class="text-right">₹${grandTotal.toFixed(2)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="summary">
    <p><strong>Total Claims:</strong> ${claims.length} | <strong>Total Amount:</strong> ₹${grandTotal.toFixed(2)}</p>
    ${rejectedAmount > 0 ? `<p class="rejected"><strong>Rejected Amount:</strong> ₹${rejectedAmount.toFixed(2)} | <strong>Net Amount (excl. rejected):</strong> ₹${totalAmount.toFixed(2)}</p>` : ''}
    <p><strong>Amount in Words:</strong> ${amountToWords(totalAmount)}</p>
  </div>
</body></html>`;
}

export default function ClaimHistoryView() {
  const { user, isAdmin } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [filters, setFilters] = useState({ userEmail: '', startDate: '', endDate: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getClaimsHistory(user.email, user.role, filters.userEmail || filters.startDate || filters.endDate ? filters : undefined);
      setClaims(data);
      setSelectedIds(new Set());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadHistory(); }, [user]);
  useEffect(() => { 
    if (isAdmin) getUsersDirectory().then(setUsers); 
    getCompanySettings().then(setCompanySettings);
  }, [isAdmin]);

  const viewClaim = async (claimId: string) => {
    const data = await getClaimById(claimId);
    setSelectedClaim(data);
  };

  const toggleSelect = (claimId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(claimId)) next.delete(claimId);
      else next.add(claimId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === claims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(claims.map(c => c.claimId)));
    }
  };

  const getSelectedClaims = () => claims.filter(c => selectedIds.has(c.claimId));

  const downloadPDF = (claimsForPdf?: any[]) => {
    const target = claimsForPdf || claims;
    if (target.length === 0) return;
    const html = generateClaimPDFHtml(target, companySettings);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { w.onload = () => { w.print(); }; }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const selectedTotal = getSelectedClaims().reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <div className="glass-card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {isAdmin && (
            <div>
              <Label className="text-xs">User</Label>
              <Select value={filters.userEmail} onValueChange={v => setFilters({ ...filters, userEmail: v === 'all' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(u => <SelectItem key={u.email} value={u.email}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
          <div className="flex items-end gap-2">
            <Button size="sm" onClick={loadHistory}><Filter className="h-4 w-4 mr-1" /> Apply</Button>
            <Button size="sm" variant="outline" onClick={() => { setFilters({ userEmail: '', startDate: '', endDate: '' }); loadHistory(); }}>Reset</Button>
          </div>
        </div>
      </div>

      {/* Selection banner */}
      {selectedIds.size > 0 && (
        <div className="glass-card p-3 flex items-center justify-between border-l-4 border-l-primary animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">{selectedIds.size} selected</Badge>
            <span className="text-sm text-muted-foreground">Total: <strong className="text-foreground">₹{selectedTotal.toFixed(2)}</strong></span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadPDF(getSelectedClaims())}>
              <FileText className="h-4 w-4 mr-1" /> Download Selected PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
          <h2 className="font-bold flex items-center gap-2"><History className="h-5 w-5" /> Claim History</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadPDF()} disabled={claims.length === 0} className="h-9 sm:h-8 flex-1 sm:flex-none">
              <FileText className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">PDF Report</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportClaimsCSV(claims)} disabled={claims.length === 0} className="h-9 sm:h-8 flex-1 sm:flex-none">
              <Download className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadHistory} className="h-9 sm:h-8">
              <RefreshCw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block md:hidden p-3 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : claims.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No claims found</div>
          ) : claims.map(c => (
            <div key={c.claimId} className={`border border-border rounded-lg p-4 space-y-3 bg-card ${selectedIds.has(c.claimId) ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.has(c.claimId)}
                      onCheckedChange={() => toggleSelect(c.claimId)}
                    />
                    <p className="font-mono text-xs text-muted-foreground">{c.claimId}</p>
                  </div>
                  <p className="font-semibold mt-1">{c.site}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(c.date)}</p>
                  {isAdmin && <p className="text-xs text-muted-foreground">By: {c.submittedBy}</p>}
                </div>
                {statusBadge(c.status)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">With Bill</p>
                  <p className="font-medium">₹{(c.totalWithBill ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Without Bill</p>
                  <p className="font-medium">₹{(c.totalWithoutBill ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">₹{c.amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="h-9 flex-1" onClick={() => viewClaim(c.claimId)}>
                  <Eye className="h-4 w-4 mr-1" /> Details
                </Button>
                {c.fileIds && c.fileIds.length > 0 && (
                  <Button variant="outline" size="sm" className="h-9 flex-1" onClick={() => viewClaim(c.claimId)}>
                    <Paperclip className="h-4 w-4 mr-1 text-primary" /> Attachments ({c.fileIds.length})
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={claims.length > 0 && selectedIds.size === claims.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-3 font-semibold">ID</th>
                <th className="text-left p-3 font-semibold">Date</th>
                {isAdmin && <th className="text-left p-3 font-semibold">User</th>}
                <th className="text-left p-3 font-semibold">Site</th>
                <th className="text-right p-3 font-semibold">With Bill</th>
                <th className="text-right p-3 font-semibold">Without Bill</th>
                <th className="text-right p-3 font-semibold">Total</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-center p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: isAdmin ? 10 : 9 }).map((_, j) => (
                      <td key={j} className="p-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : claims.length === 0 ? (
                <tr><td colSpan={isAdmin ? 10 : 9} className="text-center p-8 text-muted-foreground">No claims found</td></tr>
              ) : claims.map(c => (
                <tr key={c.claimId} className={`border-b border-border hover:bg-muted/30 transition-colors ${selectedIds.has(c.claimId) ? 'bg-primary/5' : ''}`}>
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(c.claimId)}
                      onCheckedChange={() => toggleSelect(c.claimId)}
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">{c.claimId}</td>
                  <td className="p-3">{formatDate(c.date)}</td>
                  {isAdmin && <td className="p-3">{c.submittedBy}</td>}
                  <td className="p-3">{c.site}</td>
                  <td className="p-3 text-right">₹{(c.totalWithBill ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right">₹{(c.totalWithoutBill ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">₹{c.amount.toFixed(2)}</td>
                  <td className="p-3 text-center">{statusBadge(c.status)}</td>
                  <td className="p-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => viewClaim(c.claimId)} title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Claim Details - {selectedClaim?.claimId}</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="flex justify-between sm:block"><strong>Status:</strong> <span>{selectedClaim.status}</span></div>
                <div className="flex justify-between sm:block"><strong>Submitted By:</strong> <span>{selectedClaim.submittedBy}</span></div>
                <div className="flex justify-between sm:block"><strong>Site:</strong> <span>{selectedClaim.site}</span></div>
                <div className="flex justify-between sm:block"><strong>Date:</strong> <span>{formatDate(selectedClaim.date)}</span></div>
                <div className="flex justify-between sm:block"><strong>With Bill:</strong> <span>₹{(selectedClaim.totalWithBill ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between sm:block"><strong>Without Bill:</strong> <span>₹{(selectedClaim.totalWithoutBill ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between sm:block text-primary font-semibold"><strong>Grand Total:</strong> <span>₹{(selectedClaim.amount ?? 0).toFixed(2)}</span></div>
                {selectedClaim.rejectionReason && <div className="col-span-1 sm:col-span-2 text-destructive"><strong>Rejection Reason:</strong> {selectedClaim.rejectionReason}</div>}
              </div>
              
              {/* Attachments Section */}
              <div className="border border-border rounded-lg p-3 bg-muted/20">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> Attachments ({selectedClaim.fileIds?.length || 0})
                </h4>
                {selectedClaim.fileIds && selectedClaim.fileIds.length > 0 ? (
                  <AttachmentPreview fileIds={selectedClaim.fileIds} claimId={selectedClaim.claimId} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No attachments for this claim</p>
                )}
              </div>
              
              <h4 className="font-semibold text-sm sm:text-base">Expenses</h4>
              
              {/* Mobile Expenses */}
              <div className="block sm:hidden space-y-2">
                {selectedClaim.expenses?.map((e: any, i: number) => (
                  <div key={i} className="border border-border rounded p-3 text-sm space-y-1 bg-card">
                    <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{e.category}</span></div>
                    {e.projectCode && <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span>{e.projectCode}</span></div>}
                    {e.claimDate && <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(e.claimDate)}</span></div>}
                    {e.description && <div className="flex justify-between"><span className="text-muted-foreground">Desc</span><span className="text-right max-w-[60%]">{e.description}</span></div>}
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold text-primary">₹{(e.amount ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="bg-primary/10 rounded p-3 text-sm">
                  <div className="flex justify-between font-bold">
                    <span>Grand Total</span>
                    <span className="text-primary">₹{(selectedClaim.amount ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Expenses Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left border">Category</th>
                      <th className="p-2 text-left border">Code</th>
                      <th className="p-2 text-left border">Date</th>
                      <th className="p-2 text-left border">Description</th>
                      <th className="p-2 text-right border">With Bill (₹)</th>
                      <th className="p-2 text-right border">Without Bill (₹)</th>
                      <th className="p-2 text-right border">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClaim.expenses?.map((e: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 border">{e.category}</td>
                        <td className="p-2 border">{e.projectCode}</td>
                        <td className="p-2 border">{e.claimDate ? formatDate(e.claimDate) : ''}</td>
                        <td className="p-2 border">{e.description}</td>
                        <td className="p-2 text-right border">₹{(e.amountWithBill ?? 0).toFixed(2)}</td>
                        <td className="p-2 text-right border">₹{(e.amountWithoutBill ?? 0).toFixed(2)}</td>
                        <td className="p-2 text-right border font-medium">₹{(e.amount ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-muted/50">
                      <td colSpan={4} className="p-2 border text-right">TOTAL</td>
                      <td className="p-2 text-right border">₹{(selectedClaim.totalWithBill ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right border">₹{(selectedClaim.totalWithoutBill ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right border">₹{(selectedClaim.amount ?? 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
