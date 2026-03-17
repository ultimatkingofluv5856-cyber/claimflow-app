import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingManagerClaims, getPendingAdminClaims, approveClaimAsManager, approveClaimAsAdmin, rejectClaim, getClaimById } from '@/lib/claims-api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, RefreshCw, UserCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AttachmentPreview from '@/components/views/AttachmentPreview';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ApprovalViewProps {
  type: 'manager' | 'admin';
}

export default function ApprovalView({ type }: ApprovalViewProps) {
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ claimId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState<{ claimId: string } | null>(null);
  const [approveDescription, setApproveDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewClaim, setViewClaim] = useState<any>(null);

  const loadClaims = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = type === 'manager'
        ? await getPendingManagerClaims(user.email, user.role)
        : await getPendingAdminClaims();
      setClaims(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadClaims(); }, [user, type]);

  const handleApprove = async () => {
    if (!approveModal) return;
    setProcessing(true);
    try {
      if (type === 'manager') await approveClaimAsManager(approveModal.claimId, user!.email, approveDescription);
      else await approveClaimAsAdmin(approveModal.claimId, user!.email, approveDescription);
      toast.success('Claim approved');
      setApproveModal(null);
      setApproveDescription('');
      loadClaims();
    } catch (e: any) { toast.error(e.message); }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    setProcessing(true);
    try {
      await rejectClaim(rejectModal!.claimId, rejectReason, user!.email, type === 'manager' ? 'Manager' : 'Admin');
      toast.success('Claim rejected');
      setRejectModal(null);
      setRejectReason('');
      loadClaims();
    } catch (e: any) { toast.error(e.message); }
    setProcessing(false);
  };

  const handleView = async (claimId: string) => {
    const data = await getClaimById(claimId);
    setViewClaim(data);
  };

  const Icon = type === 'manager' ? UserCheck : ShieldCheck;
  const title = type === 'manager' ? 'Manager Approval' : 'Admin Approval';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h2 className="font-bold flex items-center gap-2"><Icon className="h-5 w-5" /> {title}</h2>
          <Button variant="outline" size="sm" onClick={loadClaims}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50"><th className="p-3 text-left">Claim ID</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">User</th><th className="p-3 text-left">Site</th><th className="p-3 text-right">With Bill</th><th className="p-3 text-right">Without Bill</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Actions</th></tr></thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="p-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : claims.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">No pending claims</td></tr>
              ) : claims.map(c => (
                <tr key={c.claimId} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs">{c.claimId}</td>
                  <td className="p-3">{formatDate(c.date)}</td>
                  <td className="p-3">{c.submittedBy}</td>
                  <td className="p-3">{c.site}</td>
                  <td className="p-3 text-right">₹{(c.totalWithBill ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right">₹{(c.totalWithoutBill ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">₹{c.amount.toFixed(2)}</td>
                  <td className="p-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleView(c.claimId)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-success" onClick={() => setApproveModal({ claimId: c.claimId })} disabled={processing}><Check className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRejectModal({ claimId: c.claimId })}><X className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal with Description */}
      <Dialog open={!!approveModal} onOpenChange={() => setApproveModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Claim - {approveModal?.claimId}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Notes / Description (optional)</Label>
              <Textarea
                placeholder="Add any notes about this approval..."
                value={approveDescription}
                onChange={e => setApproveDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModal(null)}>Cancel</Button>
            <Button className="gradient-success text-success-foreground" onClick={handleApprove} disabled={processing}>
              {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />} Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Claim - {rejectModal?.claimId}</DialogTitle></DialogHeader>
          <div>
            <Label>Reason for Rejection *</Label>
            <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Claim Modal */}
      <Dialog open={!!viewClaim} onOpenChange={() => setViewClaim(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Claim Details - {viewClaim?.claimId}</DialogTitle></DialogHeader>
          {viewClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Submitted By:</strong> {viewClaim.submittedBy}</div>
                <div><strong>Site:</strong> {viewClaim.site}</div>
                <div><strong>With Bill:</strong> ₹{(viewClaim.totalWithBill ?? 0).toFixed(2)}</div>
                <div><strong>Without Bill:</strong> ₹{(viewClaim.totalWithoutBill ?? 0).toFixed(2)}</div>
                <div><strong>Grand Total:</strong> ₹{(viewClaim.amount ?? 0).toFixed(2)}</div>
                <div><strong>Status:</strong> {viewClaim.status}</div>
              </div>
              {viewClaim.fileIds && viewClaim.fileIds.length > 0 && (
                <AttachmentPreview fileIds={viewClaim.fileIds} claimId={viewClaim.claimId} />
              )}
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left border">Category</th>
                    <th className="p-2 text-left border">Code</th>
                    <th className="p-2 text-left border">Description</th>
                    <th className="p-2 text-right border">With Bill (₹)</th>
                    <th className="p-2 text-right border">Without Bill (₹)</th>
                    <th className="p-2 text-right border">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewClaim.expenses?.map((e: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 border">{e.category}</td>
                      <td className="p-2 border">{e.projectCode}</td>
                      <td className="p-2 border">{e.description}</td>
                      <td className="p-2 text-right border">₹{(e.amountWithBill ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right border">₹{(e.amountWithoutBill ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right border font-medium">₹{(e.amount ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-muted/50">
                    <td colSpan={3} className="p-2 border text-right">TOTAL</td>
                    <td className="p-2 text-right border">₹{(viewClaim.totalWithBill ?? 0).toFixed(2)}</td>
                    <td className="p-2 text-right border">₹{(viewClaim.totalWithoutBill ?? 0).toFixed(2)}</td>
                    <td className="p-2 text-right border">₹{(viewClaim.amount ?? 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
