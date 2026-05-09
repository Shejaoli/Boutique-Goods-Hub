import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useListStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, getListStaffQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type StaffMember = { id: number; name: string; email: string; role: string; pin?: string | null; isActive: boolean };
const ROLES = ["owner", "staff", "delivery"];
const ROLE_COLORS: Record<string, string> = { owner: "bg-primary/10 text-primary", staff: "bg-blue-100 text-blue-700", delivery: "bg-accent/10 text-accent" };

export default function AdminStaffPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "staff", pin: "", password: "" });

  const { data, isLoading } = useListStaff({ query: { enabled: !!token, queryKey: getListStaffQueryKey() } });
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const staff = (data as StaffMember[] | undefined) ?? [];

  const openAdd = () => { setForm({ name: "", email: "", role: "staff", pin: "", password: "" }); setEditMember(null); setShowModal(true); };
  const openEdit = (s: StaffMember) => { setForm({ name: s.name, email: s.email, role: s.role, pin: s.pin ?? "", password: "" }); setEditMember(s); setShowModal(true); };

  const handleSave = () => {
    if (editMember) {
      updateStaff.mutate({ id: editMember.id, data: { name: form.name, role: form.role, pin: form.pin || null } } as Parameters<typeof updateStaff.mutate>[0], {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListStaffQueryKey() }); setShowModal(false); toast({ title: "Staff updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createStaff.mutate({ data: { name: form.name, email: form.email, role: form.role, pin: form.pin || null, password: form.password } } as Parameters<typeof createStaff.mutate>[0], {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListStaffQueryKey() }); setShowModal(false); toast({ title: "Staff added" }); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  };

  const handleToggle = (s: StaffMember) => {
    updateStaff.mutate({ id: s.id, data: { isActive: !s.isActive } } as Parameters<typeof updateStaff.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListStaffQueryKey() }); },
    });
  };

  const handleDelete = (s: StaffMember) => {
    if (!confirm(`Remove ${s.name} from staff?`)) return;
    deleteStaff.mutate({ id: s.id } as Parameters<typeof deleteStaff.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListStaffQueryKey() }); toast({ title: "Staff removed" }); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold">Staff</h1><p className="text-muted-foreground text-sm">{staff.length} team members</p></div>
        <Button onClick={openAdd} className="bg-primary text-white rounded-xl gap-2"><Plus className="w-4 h-4" />Add Staff</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="grid gap-3">
          {staff.map(s => (
            <div key={s.id} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">{s.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{s.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[s.role] ?? "bg-muted text-muted-foreground"}`}>{s.role}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.email}</p>
                {s.pin && <p className="text-xs text-muted-foreground">PIN: {s.pin}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={s.isActive} onCheckedChange={() => handleToggle(s)} />
                <button onClick={() => openEdit(s)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(s)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {staff.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">No staff members yet</p>}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif">{editMember ? "Edit Staff" : "Add Staff"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 rounded-xl" /></div>
            {!editMember && <div><Label className="text-xs">Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1 rounded-xl" /></div>}
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">PIN (optional)</Label><Input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} className="mt-1 rounded-xl" placeholder="4-digit PIN" maxLength={4} /></div>
            {!editMember && <div><Label className="text-xs">Password *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="mt-1 rounded-xl" /></div>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white rounded-xl" onClick={handleSave} disabled={createStaff.isPending || updateStaff.isPending}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
