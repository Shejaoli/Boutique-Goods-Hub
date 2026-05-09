import { useState } from "react";
import { useLocation } from "wouter";
import { Check, ChevronRight, MapPin, CreditCard, Package, ShoppingBag } from "lucide-react";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = ["Delivery", "Address", "Payment", "Review"];
const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: Package },
  { value: "bank_transfer", label: "Bank Transfer", desc: "Transfer to our account", icon: CreditCard },
  { value: "mobile_money", label: "Mobile Money", desc: "Pay with your mobile wallet", icon: CreditCard },
];

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { items, subtotal, clearCart } = useGuestCart();
  const searchParams = new URLSearchParams(window.location.search);
  const initialDiscount = parseFloat(searchParams.get("discount") ?? "0");

  const [step, setStep] = useState(0);
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [address, setAddress] = useState({ name: "", phone: "", street: "", city: "", state: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [orderRef] = useState(`GB-${Date.now().toString(36).toUpperCase()}`);
  const [placed, setPlaced] = useState(false);

  const discount = initialDiscount;
  const total = Math.max(0, subtotal - discount);

  const handlePlaceOrder = () => {
    clearCart();
    setPlaced(true);
    setStep(4);
  };

  if (items.length === 0 && !placed) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2 text-gray-800">Nothing to checkout</h2>
      <p className="text-gray-500 text-sm mb-4">Add some products to your cart first</p>
      <Button onClick={() => navigate("/products")} className="bg-primary text-white rounded-xl px-8">Browse Products</Button>
    </div>
  );

  if (step === 4) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center max-w-sm mx-auto">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-sm">
        <Check className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
      <p className="text-gray-500 text-sm mb-1">Your order reference is</p>
      <p className="font-bold text-primary text-lg mb-1">#{orderRef}</p>
      <p className="text-gray-400 text-xs mb-6">We'll contact you on <strong>{address.phone}</strong> to confirm delivery.</p>
      <div className="w-full space-y-2">
        <Button onClick={() => navigate("/")} className="w-full bg-primary text-white rounded-xl h-11">Continue Shopping</Button>
        <Button onClick={() => navigate("/products")} variant="outline" className="w-full rounded-xl h-11">Browse More Products</Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="font-serif text-2xl font-bold mb-5 text-gray-900">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-400"
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 transition-all ${i < step ? "bg-green-400" : "bg-gray-100"}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Delivery type */}
      {step === 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-800">How would you like to receive your order?</h2>
          <div className="space-y-3">
            {[
              { value: "delivery", label: "Home Delivery", desc: "Get it delivered to your address" },
              { value: "pickup", label: "Store Pickup", desc: "Pick up from our store — free!" },
            ].map(opt => (
              <button key={opt.value} onClick={() => setDeliveryType(opt.value)} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${deliveryType === opt.value ? "border-primary bg-primary/5" : "border-gray-100"}`}>
                <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(1)} className="w-full mt-5 bg-primary text-white rounded-xl h-11 flex items-center justify-center gap-2">
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 1: Contact + Address */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <MapPin className="w-4 h-4 text-primary" />
            {deliveryType === "delivery" ? "Delivery Details" : "Your Contact Info"}
          </h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Full Name</Label>
              <Input value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} placeholder="Adaeze Okonkwo" className="mt-1 rounded-xl border-gray-200" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Phone Number</Label>
              <Input value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="+234 800 000 0000" className="mt-1 rounded-xl border-gray-200" />
            </div>
            {deliveryType === "delivery" && (
              <>
                <div>
                  <Label className="text-xs text-gray-600">Street Address</Label>
                  <Input value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="123 Market Street" className="mt-1 rounded-xl border-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">City</Label>
                    <Input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Lagos" className="mt-1 rounded-xl border-gray-200" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">State</Label>
                    <Input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="Lagos State" className="mt-1 rounded-xl border-gray-200" />
                  </div>
                </div>
              </>
            )}
            {deliveryType === "pickup" && (
              <div className="bg-primary/5 rounded-xl p-3 text-sm text-gray-600 border border-primary/15">
                Come to our store with your order reference to pick up your items. We'll have it ready within 2 hours.
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-5">
            <Button onClick={() => setStep(0)} variant="outline" className="flex-1 rounded-xl h-11 border-gray-200">Back</Button>
            <Button onClick={() => { if (!address.name || !address.phone) { toast({ title: "Please enter your name and phone", variant: "destructive" }); return; } setStep(2); }} className="flex-1 bg-primary text-white rounded-xl h-11">Continue</Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <CreditCard className="w-4 h-4 text-primary" />Payment Method
          </h2>
          <div className="space-y-3">
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.value} onClick={() => setPaymentMethod(pm.value)} className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${paymentMethod === pm.value ? "border-primary bg-primary/5" : "border-gray-100"}`}>
                <pm.icon className={`w-5 h-5 flex-shrink-0 ${paymentMethod === pm.value ? "text-primary" : "text-gray-400"}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{pm.label}</p>
                  <p className="text-xs text-gray-400">{pm.desc}</p>
                </div>
                {paymentMethod === pm.value && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1 rounded-xl h-11 border-gray-200">Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1 bg-primary text-white rounded-xl h-11">Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-800">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.name} x{item.quantity}</span>
                <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm mb-4">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-green-600 font-medium">Free</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₦{discount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
              <span>Total</span><span className="text-primary">₦{total.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 mb-4 space-y-1 border border-gray-100">
            <p><span className="font-semibold text-gray-700">Name:</span> {address.name}</p>
            <p><span className="font-semibold text-gray-700">Phone:</span> {address.phone}</p>
            <p><span className="font-semibold text-gray-700">Delivery:</span> {deliveryType === "delivery" ? `${address.street}, ${address.city}, ${address.state}` : "Store Pickup"}</p>
            <p><span className="font-semibold text-gray-700">Payment:</span> {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline" className="flex-1 rounded-xl h-11 border-gray-200">Back</Button>
            <Button onClick={handlePlaceOrder} className="flex-1 bg-primary text-white rounded-xl h-11 font-semibold">
              Place Order · ₦{total.toLocaleString()}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
