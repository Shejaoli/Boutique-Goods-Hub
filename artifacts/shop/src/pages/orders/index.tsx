import { useLocation } from "wouter";
import { Link } from "wouter";
import { Package, ChevronRight } from "lucide-react";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  packed: { label: "Packed", color: "bg-purple-100 text-purple-700" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-accent/10 text-accent" },
  delivered: { label: "Delivered", color: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
};

type Order = { id: number; status: string; total: number; createdAt: string; items: { productName: string; quantity: number }[] };

export default function OrdersPage() {
  const { token } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading } = useListOrders({}, { query: { enabled: !!token, queryKey: getListOrdersQueryKey({}) } });
  const orders = ((data as { orders?: Order[] } | undefined)?.orders ?? []) as Order[];

  if (!token) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2">Track your orders</h2>
      <p className="text-muted-foreground text-sm mb-4">Sign in to view your order history</p>
      <Button onClick={() => navigate("/auth/login")} className="bg-primary text-white rounded-xl">Sign in</Button>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2">No orders yet</h2>
      <p className="text-muted-foreground text-sm mb-4">Your order history will appear here</p>
      <Button onClick={() => navigate("/products")} className="bg-primary text-white rounded-xl">Start Shopping</Button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="font-serif text-2xl font-bold mb-4">My Orders</h1>
      <div className="space-y-3">
        {orders.map(order => {
          const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-muted text-muted-foreground" };
          return (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-card rounded-2xl p-4 border border-border hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {order.items.slice(0, 3).map(i => `${i.productName} x${i.quantity}`).join(", ")}
                  {order.items.length > 3 ? ` +${order.items.length - 3} more` : ""}
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary">₦{order.total.toLocaleString()}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
