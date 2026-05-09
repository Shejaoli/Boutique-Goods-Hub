import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useListSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, getListSuppliersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Supplier = { id: number; name: string; contactPerson?: string | null; phone?: string | null; address?: string | null; totalSpent?: number };

export default function AdminSuppliersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", address: "" });

  const { data, isLoading } = useListSuppliers({ query: { enabled: !!token, queryKey: getListSuppliersQueryKey() } });
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const suppliers = (data as Supplier[] | undefined) ?? [];

  const openAdd = () => { setForm({ name: "", contactPerson: "", phone: "", address: "" }); setEditSupplier(null); setShowModal(true); };
  const openEdit = (s: Supplier) => { setForm({ name: s.name, contactPerson: s.contactPerson ?? "", phone: s.phone ?? "", address: s.address ?? "" }); setEditSupplier(s); setShowModal(true); };

  const handleSave = () => {
    const data = { name: form.name, contactPerson: form.contactPerson || null, phone: form.phone || null, address: form.address || null };
    if (editSupplier) {
      updateSupplier.mutate({ id: editSupplier.id, data } as Parameters<typeof updateSupplier.mutate>[0], {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); setShowModal(false); toast({ title: "Supplier updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createSupplier.mutate({ data }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); setShowModal(false); toast({ title: "Supplier added" }); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (s: Supplier) => {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    deleteSupplier.mutate({ id: s.id } as Parameters<typeof deleteSupplier.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); toast({ title: "Supplier deleted" }); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold">Suppliers</h1><p className="text-muted-foreground text-sm">{suppliers.length} suppliers</p></div>
        <Button onClick={openAdd} className="bg-primary text-white rounded-xl gap-2"><Plus className="w-4 h-4" />Add Supplier</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="grid gap-3">
          {suppliers.map(s => (
            <div key={s.id} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">{s.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{s.name}</p>
                <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-muted-foreground">
                  {s.contactPerson && <span>{s.contactPerson}</span>}
                  {s.phone && <span>{s.phone}</span>}
                  {s.address && <span className="truncate max-w-48">{s.address}</span>}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(s)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-all">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(s)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-all text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {suppliers.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">No suppliers yet</p>}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif">{editSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white rounded-xl" onClick={handleSave} disabled={createSupplier.isPending || updateSupplier.isPending}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
