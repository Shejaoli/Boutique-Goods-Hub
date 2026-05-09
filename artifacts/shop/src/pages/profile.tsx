import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { User, Package, Heart, LogOut, Edit2, Save, Star } from "lucide-react";
import { useUpdateCustomer, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const updateCustomer = useUpdateCustomer();

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2">Your profile</h2>
      <p className="text-muted-foreground text-sm mb-4">Sign in to view your profile</p>
      <Button onClick={() => navigate("/auth/login")} className="bg-primary text-white rounded-xl">Sign in</Button>
    </div>
  );

  const handleSave = () => {
    updateCustomer.mutate({ id: user.id, data: { name: form.name, phone: form.phone } } as Parameters<typeof updateCustomer.mutate>[0], {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setEditing(false);
        toast({ title: "Profile updated" });
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
    });
  };

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* Header */}
      <div className="bg-primary rounded-2xl p-5 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-serif font-bold text-2xl">{user.name[0]}</span>
        </div>
        <div className="text-white">
          <h1 className="font-serif text-xl font-bold">{user.name}</h1>
          <p className="text-white/70 text-sm">{user.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span className="text-white text-xs font-medium">{user.loyaltyPoints ?? 0} loyalty points</span>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Personal Info</h2>
          {!editing ? (
            <button onClick={() => { setForm({ name: user.name, phone: user.phone ?? "" }); setEditing(true); }} className="flex items-center gap-1 text-primary text-sm font-medium">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <button onClick={handleSave} disabled={updateCustomer.isPending} className="flex items-center gap-1 text-success text-sm font-medium">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Full name</Label>
            {editing ? (
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 rounded-xl h-10" />
            ) : (
              <p className="text-sm font-medium mt-0.5">{user.name}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email address</Label>
            <p className="text-sm font-medium mt-0.5">{user.email}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone number</Label>
            {editing ? (
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 rounded-xl h-10" />
            ) : (
              <p className="text-sm font-medium mt-0.5">{user.phone ?? "Not set"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-card rounded-2xl border border-border mb-4 overflow-hidden">
        {[
          { href: "/orders", icon: Package, label: "My Orders" },
          { href: "/wishlist", icon: Heart, label: "My Wishlist" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-all cursor-pointer border-b border-border last:border-0">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">{label}</span>
              <span className="text-muted-foreground text-xs">›</span>
            </div>
          </Link>
        ))}
      </div>

      <Button onClick={handleLogout} variant="outline" className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5">
        <LogOut className="w-4 h-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}
