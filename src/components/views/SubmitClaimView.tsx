import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { submitClaim, getDropdownOptions, getCurrentBalance } from '@/lib/claims-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Send, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import FileUpload, { FileUploadHandle } from '@/components/views/FileUpload';

interface ExpenseRow {
  id: string;
  category: string;
  projectCode: string;
  claimDate: string;
  description: string;
  amountWithBill: number;
  amountWithoutBill: number;
}

export default function SubmitClaimView() {
  const { user } = useAuth();
  const fileUploadRef = useRef<FileUploadHandle>(null);
  const [site, setSite] = useState('');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: crypto.randomUUID(), category: '', projectCode: '', claimDate: '', description: '', amountWithBill: 0, amountWithoutBill: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [dropdown, setDropdown] = useState<any>({ projects: [], categories: [], projectCodes: [], byProject: {} });
  const [tempClaimId, setTempClaimId] = useState(() => 'C-' + Date.now());
  const [balance, setBalance] = useState<number | null>(null);
  const [fileUploadKey, setFileUploadKey] = useState(0); // Key to force FileUpload reset

  useEffect(() => {
    getDropdownOptions().then(setDropdown);
    if (user) getCurrentBalance(user.email).then(setBalance);
  }, [user]);

  const getFilteredProjectCodes = () => {
    if (!site) return [];
    const codes = dropdown.byProject?.[site] || [];
    const globalCodes = dropdown.byProject?.[''] || [];
    return [...new Set([...codes, ...globalCodes])];
  };

  const addRow = () => {
    setExpenses([...expenses, { id: crypto.randomUUID(), category: '', projectCode: '', claimDate: '', description: '', amountWithBill: 0, amountWithoutBill: 0 }]);
  };

  const removeRow = (id: string) => {
    if (expenses.length <= 1) return;
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateRow = (id: string, field: string, value: any) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const totalWithBill = expenses.reduce((sum, e) => sum + (e.amountWithBill || 0), 0);
  const totalWithoutBill = expenses.reduce((sum, e) => sum + (e.amountWithoutBill || 0), 0);
  const grandTotal = totalWithBill + totalWithoutBill;

  useEffect(() => {
    setExpenses(prev => prev.map(e => ({ ...e, projectCode: '' })));
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site) { toast.error('Please select a project site'); return; }
    if (expenses.some(ex => !ex.category || (ex.amountWithBill === 0 && ex.amountWithoutBill === 0))) {
      toast.error('All expense rows must have category and at least one amount');
      return;
    }

    setLoading(true);
    try {
      // Upload pending files first and get the paths
      let uploadedPaths: string[] = [];
      if (fileUploadRef.current) {
        uploadedPaths = await fileUploadRef.current.uploadAll();
      }

      const result = await submitClaim({
        site,
        expenses: expenses.map(ex => ({
          category: ex.category,
          projectCode: ex.projectCode,
          claimDate: ex.claimDate,
          description: ex.description,
          amountWithBill: ex.amountWithBill || 0,
          amountWithoutBill: ex.amountWithoutBill || 0,
        })),
        fileIds: uploadedPaths,
      }, user!.email, user!.name);
      if (result.ok) {
        toast.success(result.message);
        // Reset all form fields
        setSite('');
        setExpenses([{ id: crypto.randomUUID(), category: '', projectCode: '', claimDate: '', description: '', amountWithBill: 0, amountWithoutBill: 0 }]);
        // Generate new temp claim ID and force FileUpload component to reset
        setTempClaimId('C-' + Date.now());
        setFileUploadKey(prev => prev + 1);
        // Refresh balance
        if (user) getCurrentBalance(user.email).then(setBalance);
      }
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    }
    setLoading(false);
  };

  const filteredCodes = getFilteredProjectCodes();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      {/* Balance Banner */}
      {balance !== null && (
        <div className="glass-card p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Available Balance</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">₹{balance.toFixed(2)}</p>
            </div>
          </div>
          {grandTotal > 0 && (
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">After this claim</p>
              <p className={`text-lg font-bold ${(balance - grandTotal) < 0 ? 'text-destructive' : 'text-success'}`}>
                ₹{(balance - grandTotal).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" /> New Claim Submission
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user?.name || ''} readOnly className="bg-muted h-11 sm:h-10" />
            </div>
            <div className="space-y-2">
              <Label>Project Site</Label>
              <Select value={site} onValueChange={setSite}>
                <SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Select project site" /></SelectTrigger>
                <SelectContent>
                  {dropdown.projects.map((p: any) => (
                    <SelectItem key={p.name} value={p.name}>{p.name} {p.code ? `(${p.code})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm sm:text-base">Expense Details</h3>
            <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-9 sm:h-8">
              <PlusCircle className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Add Expense</span>
            </Button>
          </div>

          {/* Mobile Card View for Expenses */}
          <div className="block md:hidden space-y-4 mb-4">
            {expenses.map((exp, idx) => (
              <div key={exp.id} className="border border-border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Expense #{idx + 1}</span>
                  {expenses.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(exp.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={exp.category} onValueChange={v => updateRow(exp.id, 'category', v)}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {dropdown.categories.map((c: string) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" className="h-10" value={exp.claimDate} onChange={e => updateRow(exp.id, 'claimDate', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Project Code</Label>
                  <Select value={exp.projectCode} onValueChange={v => updateRow(exp.id, 'projectCode', v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder={site ? "Select code" : "Select site first"} /></SelectTrigger>
                    <SelectContent>
                      {filteredCodes.length === 0 ? (
                        <SelectItem value="none" disabled>No codes available</SelectItem>
                      ) : filteredCodes.map((code: string) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input className="h-10" value={exp.description} onChange={e => updateRow(exp.id, 'description', e.target.value)} placeholder="Enter description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">With Bill (₹)</Label>
                    <Input type="number" min="0" step="0.01" className="h-10" value={exp.amountWithBill || ''} onChange={e => updateRow(exp.id, 'amountWithBill', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Without Bill (₹)</Label>
                    <Input type="number" min="0" step="0.01" className="h-10" value={exp.amountWithoutBill || ''} onChange={e => updateRow(exp.id, 'amountWithoutBill', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-primary">₹{((exp.amountWithBill || 0) + (exp.amountWithoutBill || 0)).toFixed(2)}</span>
                </div>
              </div>
            ))}
            {/* Mobile Total Summary */}
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total With Bill</span>
                <span className="font-medium">₹{totalWithBill.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Without Bill</span>
                <span className="font-medium">₹{totalWithoutBill.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-primary/20 pt-2">
                <span>Grand Total</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Desktop Expense Table */}
          <div className="hidden md:block overflow-x-auto border border-border rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-semibold text-xs">#</th>
                  <th className="p-2 text-left font-semibold text-xs">Category</th>
                  <th className="p-2 text-left font-semibold text-xs">Project Code</th>
                  <th className="p-2 text-left font-semibold text-xs">Date</th>
                  <th className="p-2 text-left font-semibold text-xs">Description</th>
                  <th className="p-2 text-right font-semibold text-xs">With Bill (₹)</th>
                  <th className="p-2 text-right font-semibold text-xs">Without Bill (₹)</th>
                  <th className="p-2 text-right font-semibold text-xs">Total (₹)</th>
                  <th className="p-2 text-center font-semibold text-xs"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, idx) => (
                  <tr key={exp.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-2 text-muted-foreground">{idx + 1}</td>
                    <td className="p-2">
                      <Select value={exp.category} onValueChange={v => updateRow(exp.id, 'category', v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {dropdown.categories.map((c: string) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select value={exp.projectCode} onValueChange={v => updateRow(exp.id, 'projectCode', v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={site ? "Code" : "Site first"} /></SelectTrigger>
                        <SelectContent>
                          {filteredCodes.length === 0 ? (
                            <SelectItem value="none" disabled>No codes</SelectItem>
                          ) : filteredCodes.map((code: string) => (
                            <SelectItem key={code} value={code}>{code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input type="date" className="h-8 text-xs" value={exp.claimDate} onChange={e => updateRow(exp.id, 'claimDate', e.target.value)} />
                    </td>
                    <td className="p-2">
                      <Input className="h-8 text-xs" value={exp.description} onChange={e => updateRow(exp.id, 'description', e.target.value)} placeholder="Description" />
                    </td>
                    <td className="p-2">
                      <Input type="number" min="0" step="0.01" className="h-8 text-xs text-right" value={exp.amountWithBill || ''} onChange={e => updateRow(exp.id, 'amountWithBill', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    </td>
                    <td className="p-2">
                      <Input type="number" min="0" step="0.01" className="h-8 text-xs text-right" value={exp.amountWithoutBill || ''} onChange={e => updateRow(exp.id, 'amountWithoutBill', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    </td>
                    <td className="p-2 text-right font-medium text-xs">
                      ₹{((exp.amountWithBill || 0) + (exp.amountWithoutBill || 0)).toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      {expenses.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(exp.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={5} className="p-2 text-right text-xs">TOTAL</td>
                  <td className="p-2 text-right text-xs">₹{totalWithBill.toFixed(2)}</td>
                  <td className="p-2 text-right text-xs">₹{totalWithoutBill.toFixed(2)}</td>
                  <td className="p-2 text-right text-xs text-primary">₹{grandTotal.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attachments */}
          <div className="border border-border rounded-lg p-3 sm:p-4 mb-4 bg-muted/10">
            <h3 className="font-semibold text-sm mb-2">Attachments (Bills / Receipts)</h3>
            <FileUpload
              ref={fileUploadRef}
              key={fileUploadKey}
              claimId={tempClaimId}
              maxFiles={10}
              maxSizeMB={5}
            />
          </div>

          <Button type="submit" className="w-full h-12 sm:h-10 gradient-primary text-primary-foreground text-base sm:text-sm" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
            {loading ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </form>
      </div>
    </div>
  );
}
