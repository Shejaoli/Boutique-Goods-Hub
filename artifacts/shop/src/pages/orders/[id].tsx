import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Check } from "lucide-react";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"];
const STEP_LABELS = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  packed: { label: "Packed", color: "bg-purple-100 text-purple-700" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-accent/10 text-accent" },
  delivered: { label: "Delivered", color: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
};

type Order = {
  id: number; status: string; total: number; subtotal: number; discount: number;
  paymentMethod: string; deliveryType: string; deliveryAddress?: string | null;
  createdAt: string; promoCode?: string | null;
  items: { id: number; productName: string; quantity: number; price: number; unit: string; imageUrl?: string | null; subtotal: number }[];
};

export default function OrderDetailPage() {
  const [, params] = useRoute("/orders/:id");
  const [, navigate] = useLocation();
  const { token } = useAuth();
  const id = parseInt(params?.id ?? "0");

  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: id > 0 && !!token, queryKey: getGetOrderQueryKey(id) } });
  const o = order as Order | undefined;

  if (isLoading) return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );

  if (!o) return (
    <div className="text-center py-20">
      <p className="font-semibold">Order not found</p>
      <Button onClick={() => navigate("/orders")} className="mt-4 bg-primary text-white rounded-xl">My Orders</Button>
    </div>
  );

  const cfg = STATUS_CONFIG[o.status] ?? { label: o.status, color: "bg-muted text-muted-foreground" };
  const currentStepIdx = STEPS.indexOf(o.status);
  const isCancelled = o.status === "cancelled";

  return (
    <div className="max-w-xl mx-auto p-4">
      <button onClick={() => navigate("/orders")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </button>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-xl font-bold">Order #{o.id}</h1>
          <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <p className="font-semibold text-sm mb-4">Order Progress</p>
          <div className="relative">
            <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-muted" />
            <div className="absolute left-3 top-3 w-0.5 bg-success transition-all" style={{ height: `${Math.max(0, currentStepIdx / (STEPS.length - 1)) * 100}%` }} />
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i <= currentStepIdx;
                return (
                  <div key={step} className="flex items-center gap-3 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 flex-shrink-0 transition-all ${done ? "bg-success text-white" : "bg-muted border-2 border-muted-foreground/30"}`}>
                      {done ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
                    </div>
                    <span className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{STEP_LABELS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-card rounded-2xl border border-border mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm">{o.items.length} item{o.items.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="divide-y divide-border">
          {o.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10"><span className="text-sm font-serif text-primary">{item.productName[0]}</span></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                <p className="text-xs text-muted-foreground">{item.unit} · ₦{item.price.toLocaleString()} × {item.quantity}</p>
              </div>
              <p className="font-semibold text-sm text-primary">₦{item.subtotal.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <p className="font-semibold text-sm mb-3">Payment Summary</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₦{o.subtotal.toLocaleString()}</span></div>
          {o.discount > 0 && <div className="flex justify-between text-success"><span>Discount {o.promoCode ? `(${o.promoCode})` : ""}</span><span>-₦{o.discount.toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-border mt-1"><span>Total</span><span className="text-primary">₦{o.total.toLocaleString()}</span></div>
        </div>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-0.5">
          <p><span className="font-medium text-foreground">Payment:</span> {o.paymentMethod?.replace(/_/g, " ")}</p>
          <p><span className="font-medium text-foreground">Delivery:</span> {o.deliveryType === "pickup" ? "Store Pickup" : o.deliveryAddress ?? "Home Delivery"}</p>
        </div>
      </div>
    </div>
  );
}
