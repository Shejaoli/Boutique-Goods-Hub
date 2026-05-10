import { useState } from "react";
import { Search, Shield, ShieldOff } from "lucide-react";
import { useListCustomers, useToggleCustomerBlock, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

type Customer = {
  id: number; name: string; email: string; phone?: string | null;
  totalOrders: number; totalSpent: number; isBlocked: boolean; createdAt: string;
};

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListCustomers({ search: search || undefined }, { query: { enabled: !!token, queryKey: getListCustomersQueryKey({ search: search || undefined }) } });
  const toggleBlock = useToggleCustomerBlock();

  const customers = ((data as { customers?: Customer[] } | undefined)?.customers ?? []) as Customer[];

  const handleToggle = (c: Customer) => {
    toggleBlock.mutate({ id: c.id, data: { isBlocked: !c.isBlocked } } as Parameters<typeof toggleBlock.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListCustomersQueryKey({}) }); toast({ title: c.isBlocked ? "Customer unblocked" : "Customer blocked" }); },
      onError: () => toast({ title: "Failed to update customer", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm">{customers.length} registered customers</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="pl-9 rounded-xl" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Orders</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Spent</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{c.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{c.phone ?? "—"}</td>
                    <td className="px-3 py-3 font-semibold">{c.totalOrders}</td>
                    <td className="px-3 py-3 font-semibold text-primary hidden sm:table-cell">RWF {c.totalSpent.toLocaleString()}</td>
                    <td className="px-3 py-3 text-muted-foreground hidden lg:table-cell">{new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-right">
                      <Switch checked={c.isBlocked} onCheckedChange={() => handleToggle(c)} className={c.isBlocked ? "data-[state=checked]:bg-destructive" : ""} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No customers found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
