import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { useListPromoCodes, useCreatePromoCode, useDeletePromoCode, getListPromoCodesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type PromoCode = { id: number; code: string; type: string; value: number; maxUses?: number | null; usageCount: number; expiresAt?: string | null; isActive: boolean };

export default function AdminPromoPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percent", value: "", maxUses: "", expiresAt: "" });

  const { data, isLoading } = useListPromoCodes({ query: { enabled: !!token, queryKey: getListPromoCodesQueryKey() } });
  const createPromo = useCreatePromoCode();
  const deletePromo = useDeletePromoCode();

  const codes = (data as PromoCode[] | undefined) ?? [];

  const handleSave = () => {
    createPromo.mutate({
      data: {
        code: form.code.toUpperCase(), type: form.type, value: parseFloat(form.value),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null, isActive: true,
      }
    } as Parameters<typeof createPromo.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPromoCodesQueryKey() }); setShowModal(false); toast({ title: "Promo code created" }); setForm({ code: "", type: "percent", value: "", maxUses: "", expiresAt: "" }); },
      onError: () => toast({ title: "Failed to create promo code", variant: "destructive" }),
    });
  };

  const handleDelete = (p: PromoCode) => {
    if (!confirm(`Delete promo code "${p.code}"?`)) return;
    deletePromo.mutate({ id: p.id } as Parameters<typeof deletePromo.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPromoCodesQueryKey() }); toast({ title: "Promo code deleted" }); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold">Promo Codes</h1><p className="text-muted-foreground text-sm">{codes.length} codes</p></div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-white rounded-xl gap-2"><Plus className="w-4 h-4" />Create Code</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="grid gap-3">
          {codes.map(c => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const maxed = c.maxUses && c.usageCount >= c.maxUses;
            const valid = c.isActive && !expired && !maxed;
            return (
              <div key={c.id} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold font-mono text-primary">{c.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${valid ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{valid ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span>{c.type === "percent" ? `${c.value}% off` : `RWF ${c.value} off`}</span>
                    <span>Used: {c.usageCount}{c.maxUses ? `/${c.maxUses}` : ""}</span>
                    {c.expiresAt && <span>Expires: {c.expiresAt}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {codes.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">No promo codes yet</p>}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif">Create Promo Code</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Code *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="mt-1 rounded-xl font-mono" placeholder="SAVE20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (RWF )</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Value *</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="mt-1 rounded-xl" placeholder={form.type === "percent" ? "e.g. 20" : "e.g. 500"} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Max Uses</Label><Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} className="mt-1 rounded-xl" placeholder="Unlimited" /></div>
              <div><Label className="text-xs">Expires At</Label><Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white rounded-xl" onClick={handleSave} disabled={createPromo.isPending || !form.code || !form.value}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
