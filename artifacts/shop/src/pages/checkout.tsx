import { useState } from "react";
import { useLocation } from "wouter";
import { Check, ChevronRight, MapPin, CreditCard, Package } from "lucide-react";
import { useGetCart, useCreateOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = ["Delivery", "Address", "Payment", "Review"];
const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery", icon: Package },
  { value: "bank_transfer", label: "Bank Transfer", icon: CreditCard },
  { value: "mobile_money", label: "Mobile Money", icon: CreditCard },
];

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const initialPromo = searchParams.get("promo") ?? "";
  const initialDiscount = parseFloat(searchParams.get("discount") ?? "0");

  const [step, setStep] = useState(0);
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [address, setAddress] = useState({ street: "", city: "", state: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [promoCode] = useState(initialPromo);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { data } = useGetCart({ query: { enabled: !!token, queryKey: getGetCartQueryKey() } });
  const createOrder = useCreateOrder();

  const cart = data as { items: { productName: string; quantity: number; price: number; subtotal: number }[]; subtotal: number } | undefined;
  const discount = initialDiscount;
  const subtotal = cart?.subtotal ?? 0;
  const total = Math.max(0, subtotal - discount);

  const handlePlaceOrder = () => {
    createOrder.mutate({
      data: {
        paymentMethod,
        deliveryType,
        deliveryAddress: deliveryType === "delivery" ? `${address.street}, ${address.city}, ${address.state}` : null,
        promoCode: promoCode || null,
      },
    } as Parameters<typeof createOrder.mutate>[0], {
      onSuccess: (order: { id: number }) => {
        setOrderId(order.id);
        setStep(4);
        qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: () => toast({ title: "Failed to place order", variant: "destructive" }),
    });
  };

  if (step === 4 && orderId) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center max-w-sm mx-auto">
      <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-5">
        <Check className="w-10 h-10 text-success" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Order Placed!</h2>
      <p className="text-muted-foreground text-sm mb-1">Your order <span className="font-semibold text-foreground">#{orderId}</span> has been placed successfully.</p>
      <p className="text-muted-foreground text-sm mb-6">We'll notify you when it's confirmed.</p>
      <div className="w-full space-y-2">
        <Button onClick={() => navigate(`/orders/${orderId}`)} className="w-full bg-primary text-white rounded-xl h-11">Track Order</Button>
        <Button onClick={() => navigate("/")} variant="outline" className="w-full rounded-xl h-11">Continue Shopping</Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="font-serif text-2xl font-bold mb-5">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 transition-all ${i < step ? "bg-success" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="font-semibold mb-4">Delivery or Pickup?</h2>
          <div className="space-y-3">
            {[{ value: "delivery", label: "Home Delivery", desc: "Get it delivered to your address" }, { value: "pickup", label: "Store Pickup", desc: "Pick up from our store" }].map(opt => (
              <button key={opt.value} onClick={() => setDeliveryType(opt.value)} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${deliveryType === opt.value ? "border-primary bg-primary/5" : "border-border"}`}>
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(1)} className="w-full mt-5 bg-primary text-white rounded-xl h-11">Continue <ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}

      {step === 1 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{deliveryType === "delivery" ? "Delivery Address" : "Your Contact"}</h2>
          <div className="space-y-3">
            {deliveryType === "delivery" && (
              <>
                <div><Label className="text-xs">Street Address</Label><Input value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="123 Main Street" className="mt-1 rounded-xl" /></div>
                <div><Label className="text-xs">City</Label><Input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Lagos" className="mt-1 rounded-xl" /></div>
                <div><Label className="text-xs">State</Label><Input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="Lagos State" className="mt-1 rounded-xl" /></div>
              </>
            )}
            {deliveryType === "pickup" && <p className="text-sm text-muted-foreground bg-muted rounded-xl p-3">Please come to our store with your order ID to pick up your items.</p>}
          </div>
          <div className="flex gap-2 mt-5">
            <Button onClick={() => setStep(0)} variant="outline" className="flex-1 rounded-xl h-11">Back</Button>
            <Button onClick={() => setStep(2)} className="flex-1 bg-primary text-white rounded-xl h-11">Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />Payment Method</h2>
          <div className="space-y-3">
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.value} onClick={() => setPaymentMethod(pm.value)} className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${paymentMethod === pm.value ? "border-primary bg-primary/5" : "border-border"}`}>
                <pm.icon className={`w-5 h-5 ${paymentMethod === pm.value ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-medium text-sm">{pm.label}</span>
                {paymentMethod === pm.value && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1 rounded-xl h-11">Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1 bg-primary text-white rounded-xl h-11">Continue</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {cart?.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.productName} x{item.quantity}</span>
                <span>₦{item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1.5 text-sm mb-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-₦{discount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">₦{total.toLocaleString()}</span></div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground mb-4 space-y-0.5">
            <p><span className="font-medium text-foreground">Delivery:</span> {deliveryType === "delivery" ? `${address.street}, ${address.city}` : "Store Pickup"}</p>
            <p><span className="font-medium text-foreground">Payment:</span> {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}</p>
            {promoCode && <p><span className="font-medium text-foreground">Promo:</span> {promoCode}</p>}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline" className="flex-1 rounded-xl h-11">Back</Button>
            <Button onClick={handlePlaceOrder} disabled={createOrder.isPending} className="flex-1 bg-primary text-white rounded-xl h-11">
              {createOrder.isPending ? "Placing..." : "Place Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
