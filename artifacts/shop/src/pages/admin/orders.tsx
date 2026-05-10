import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  packed: { label: "Packed", color: "bg-purple-100 text-purple-700" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-accent/10 text-accent" },
  delivered: { label: "Delivered", color: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
};

const STATUS_ORDER = ["pending", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"];

type Order = {
  id: number; customerId: number; customerName: string; items: { productName: string; quantity: number; price: number; subtotal: number }[];
  subtotal: number; discount: number; total: number; status: string;
  paymentMethod: string; deliveryType: string; deliveryAddress?: string | null;
  promoCode?: string | null; createdAt: string;
};

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useListOrders(
    { status: statusFilter || undefined, limit: 100 },
    { query: { enabled: !!token, queryKey: getListOrdersQueryKey({ status: statusFilter || undefined, limit: 100 }) } }
  );

  const updateStatus = useUpdateOrderStatus();
  const orders = ((data as { orders?: Order[] } | undefined)?.orders ?? []) as Order[];
  const filtered = search ? orders.filter(o => o.customerName?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search)) : orders;

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatus.mutate({ id: orderId, data: { status } } as Parameters<typeof updateStatus.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListOrdersQueryKey({}) }); toast({ title: "Order status updated" }); },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
      </div>

      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or order ID..." className="pl-9 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Order</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Items</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Payment</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(order => {
                  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-muted text-muted-foreground" };
                  const isExpanded = expanded === order.id;
                  return (
                    <>
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold">#{order.id}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium">{order.customerName}</p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                        <td className="px-3 py-3 font-bold text-primary">RWF {order.total.toLocaleString()}</td>
                        <td className="px-3 py-3 text-muted-foreground capitalize hidden sm:table-cell">{order.paymentMethod?.replace(/_/g, " ")}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setExpanded(isExpanded ? null : order.id)} className="text-muted-foreground hover:text-foreground">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${order.id}-expanded`}>
                          <td colSpan={7} className="px-4 py-3 bg-muted/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2">ITEMS</p>
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex justify-between text-sm py-0.5">
                                    <span>{item.productName} x{item.quantity}</span>
                                    <span className="font-medium">RWF {item.subtotal.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2">UPDATE STATUS</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {STATUS_ORDER.filter(s => s !== order.status).map(s => (
                                    <button key={s} onClick={() => handleStatusChange(order.id, s)} className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all border ${STATUS_CONFIG[s]?.color ?? ""} border-current/20 hover:opacity-80`}>
                                      {STATUS_CONFIG[s]?.label}
                                    </button>
                                  ))}
                                </div>
                                {order.deliveryAddress && <p className="text-xs text-muted-foreground mt-2"><span className="font-medium text-foreground">Deliver to:</span> {order.deliveryAddress}</p>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No orders found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
