import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useListExpenses, useCreateExpense, useDeleteExpense, getListExpensesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["rent", "electricity", "salaries", "transport", "packaging", "maintenance", "other"];
type Expense = { id: number; category: string; amount: number; description?: string | null; date: string; createdAt: string };

export default function AdminExpensesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ category: "rent", amount: "", description: "", date: new Date().toISOString().split("T")[0] });

  const { data, isLoading } = useListExpenses({ month }, { query: { enabled: !!token, queryKey: getListExpensesQueryKey({ month }) } });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const expenses = (data as Expense[] | undefined) ?? [];
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = CATEGORIES.map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0);

  const handleSave = () => {
    createExpense.mutate({ data: { category: form.category, amount: parseFloat(form.amount), description: form.description || null, date: form.date } } as Parameters<typeof createExpense.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListExpensesQueryKey({}) }); setShowModal(false); toast({ title: "Expense added" }); setForm(f => ({ ...f, amount: "", description: "" })); },
      onError: () => toast({ title: "Failed to add expense", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteExpense.mutate({ id } as Parameters<typeof deleteExpense.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListExpensesQueryKey({}) }); toast({ title: "Expense deleted" }); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold">Expenses</h1><p className="text-muted-foreground text-sm">Track operational costs</p></div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-white rounded-xl gap-2"><Plus className="w-4 h-4" />Add Expense</Button>
      </div>

      {/* Month selector + total */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-44 rounded-xl" />
        <div className="bg-primary/10 rounded-xl px-4 py-2">
          <span className="text-xs text-muted-foreground">Total this month: </span>
          <span className="font-bold text-primary">₦{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {byCategory.map(({ cat, total }) => (
            <div key={cat} className="bg-card rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground capitalize mb-0.5">{cat}</p>
              <p className="font-bold text-sm">₦{total.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Description</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium capitalize">{e.category}</td>
                    <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{e.description ?? "—"}</td>
                    <td className="px-3 py-3 font-bold text-primary">₦{Number(e.amount).toLocaleString()}</td>
                    <td className="px-3 py-3 text-muted-foreground">{e.date}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(e.id)} className="text-destructive hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No expenses for this month</p>}
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif">Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Amount (₦) *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white rounded-xl" onClick={handleSave} disabled={createExpense.isPending || !form.amount}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
