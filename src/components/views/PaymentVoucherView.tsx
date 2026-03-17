import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClaimsHistory, getClaimById, getCompanySettings } from '@/lib/claims-api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, RefreshCw, Eye, Printer, Download } from 'lucide-react';
import { amountToWords } from '@/lib/amount-to-words';

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PaymentVoucherView() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  const loadClaims = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await getClaimsHistory(user.email, user.role);
      setClaims(all.filter(c => c.status.toLowerCase() === 'approved'));
      const settings = await getCompanySettings();
      setCompanySettings(settings);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadClaims(); }, [user]);

  const viewVoucher = async (claimId: string) => {
    const data = await getClaimById(claimId);
    setVoucher(data);
  };

  const printVoucher = () => {
    const content = document.getElementById('voucher-content');
    if (!content) return;
    const w = window.open('', '', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<html><head><title>Payment Voucher</title><style>
      body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f5f5f5; }
      .text-right { text-align: right; }
      h2 { color: #2563eb; }
      .sig-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; margin-top: 60px; text-align: center; }
      .sig-box { border-top: 1px solid #333; padding-top: 8px; }
      @media print { body { padding: 10px; } }
    </style></head><body>${content.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  const exportVoucherHTML = () => {
    if (!voucher) return;
    const content = document.getElementById('voucher-content');
    if (!content) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Voucher ${voucher.claimId}</title>
<style>body{font-family:Arial;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 8px}th{background:#f5f5f5}.text-right{text-align:right}h2{color:#2563eb}</style>
</head><body>${content.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher-${voucher.claimId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h2 className="font-bold flex items-center gap-2"><Receipt className="h-5 w-5" /> Payment Vouchers</h2>
          <Button variant="outline" size="sm" onClick={loadClaims}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50"><th className="p-3 text-left">Claim ID</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">User</th><th className="p-3 text-left">Site</th><th className="p-3 text-right">With Bill</th><th className="p-3 text-right">Without Bill</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">Loading...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">No approved claims</td></tr>
              ) : claims.map(c => (
                <tr key={c.claimId} className="border-b border-border hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{c.claimId}</td>
                  <td className="p-3">{formatDate(c.date)}</td>
                  <td className="p-3">{c.submittedBy}</td>
                  <td className="p-3">{c.site}</td>
                  <td className="p-3 text-right">₹{(c.totalWithBill ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right">₹{(c.totalWithoutBill ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">₹{c.amount.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => viewVoucher(c.claimId)}><Eye className="h-4 w-4 mr-1" /> Voucher</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!voucher} onOpenChange={() => setVoucher(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Payment Voucher - {voucher?.claimId}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportVoucherHTML}><Download className="h-4 w-4 mr-1" /> Export</Button>
                <Button variant="outline" size="sm" onClick={printVoucher}><Printer className="h-4 w-4 mr-1" /> Print</Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {voucher && (
            <div id="voucher-content">
              <div className="border-2 border-border rounded-lg p-6">
                {/* Company Header */}
                <div className="text-center mb-4">
                  {companySettings?.logo_url && (
                    <img src={companySettings.logo_url} alt="Logo" className="h-12 mx-auto mb-2" />
                  )}
                  <h2 className="text-xl font-bold text-primary">{companySettings?.company_name || 'Company'}</h2>
                  {companySettings?.company_subtitle && (
                    <p className="text-sm text-muted-foreground">{companySettings.company_subtitle}</p>
                  )}
                  <h3 className="text-lg font-semibold mt-2 border-y border-border py-1">PAYMENT VOUCHER</h3>
                </div>

                {/* Voucher Info */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div><strong>Voucher No:</strong> {voucher.claimId}</div>
                  <div><strong>Date:</strong> {formatDate(voucher.date)}</div>
                  <div><strong>Paid To:</strong> {voucher.submittedBy}</div>
                  <div><strong>Site / Project:</strong> {voucher.site}</div>
                  <div><strong>Status:</strong> <span className={voucher.status === 'Approved' ? 'text-green-600 font-semibold' : ''}>{voucher.status}</span></div>
                </div>

                {/* Approval Details */}
                {voucher.status === 'Approved' && (
                  <div className="bg-muted/30 rounded-lg p-3 mb-4 text-sm">
                    <h4 className="font-semibold mb-1">Approval Details</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {voucher.managerEmail && (
                        <>
                          <div><strong>Manager:</strong> {voucher.managerEmail}</div>
                          <div><strong>Manager Status:</strong> {voucher.managerApprovalStatus}</div>
                          {voucher.managerApprovalDate && <div><strong>Manager Approval Date:</strong> {formatDate(voucher.managerApprovalDate)}</div>}
                        </>
                      )}
                      {voucher.adminEmail && (
                        <>
                          <div><strong>Admin:</strong> {voucher.adminEmail}</div>
                          {voucher.adminApprovalDate && <div><strong>Final Approval Date:</strong> {formatDate(voucher.adminApprovalDate)}</div>}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Expense Table with Project Code */}
                <table className="w-full text-sm border">
                  <thead><tr className="bg-muted">
                    <th className="p-2 text-left border">Category</th>
                    <th className="p-2 text-left border">Project Code</th>
                    <th className="p-2 text-left border">Description</th>
                    <th className="p-2 text-right border">With Bill</th>
                    <th className="p-2 text-right border">Without Bill</th>
                    <th className="p-2 text-right border">Total</th>
                  </tr></thead>
                  <tbody>
                    {voucher.expenses?.map((e: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2 border">{e.category}</td>
                        <td className="p-2 border">{e.projectCode || '—'}</td>
                        <td className="p-2 border">{e.description}</td>
                        <td className="p-2 text-right border">₹{(e.amountWithBill ?? 0).toFixed(2)}</td>
                        <td className="p-2 text-right border">₹{(e.amountWithoutBill ?? 0).toFixed(2)}</td>
                        <td className="p-2 text-right border font-medium">₹{(e.amount ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-muted/50">
                      <td colSpan={3} className="p-2 border text-right">TOTAL</td>
                      <td className="p-2 text-right border">₹{(voucher.totalWithBill ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right border">₹{(voucher.totalWithoutBill ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right border">₹{(voucher.amount ?? 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Amount in Words */}
                <div className="mt-3 p-3 bg-muted/20 rounded text-sm">
                  <strong>Amount in Words:</strong> {amountToWords(voucher.amount || 0)}
                </div>

                {/* Signature Section */}
                {voucher.status === 'Approved' && (
                  <div className="grid grid-cols-3 gap-8 mt-10 text-center text-sm">
                    <div>
                      <div className="border-t border-foreground pt-2 mt-8">Prepared By</div>
                      <p className="text-xs text-muted-foreground mt-1">{voucher.adminEmail || 'Admin'}</p>
                    </div>
                    <div>
                      <div className="border-t border-foreground pt-2 mt-8">Checked By</div>
                      <p className="text-xs text-muted-foreground mt-1">{voucher.managerEmail || 'Manager'}</p>
                    </div>
                    <div>
                      <div className="border-t border-foreground pt-2 mt-8">Approved By</div>
                      <p className="text-xs text-muted-foreground mt-1">{voucher.adminEmail || 'Super Admin'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
