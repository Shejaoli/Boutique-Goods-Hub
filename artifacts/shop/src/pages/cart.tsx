import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, Tag, ShoppingCart } from "lucide-react";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CartPage() {
  const { items, count, subtotal, updateQty, removeItem, clearCart } = useGuestCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [promoInput, setPromoInput] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState("");

  const handlePromo = () => {
    if (!promoInput) return;
    toast({ title: "Invalid or expired promo code", variant: "destructive" });
  };

  const total = Math.max(0, subtotal - promoDiscount);

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2 text-gray-800">Your cart is empty</h2>
      <p className="text-gray-500 text-sm mb-4">Browse our fresh products and add items to your cart</p>
      <Button onClick={() => navigate("/products")} className="bg-primary text-white rounded-xl px-8">
        Browse Products
      </Button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl font-bold text-gray-900">
          My Cart <span className="text-gray-400 text-base font-normal">({count} items)</span>
        </h1>
        <button
          onClick={() => { clearCart(); toast({ title: "Cart cleared" }); }}
          className="text-xs text-destructive hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-3 mb-5">
        {items.map(item => (
          <div key={item.productId} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-xl font-serif text-primary">{item.name[0]}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 line-clamp-1">{item.name}</p>
              <p className="text-xs text-gray-400">{item.unit}</p>
              <p className="text-primary font-bold mt-0.5">RWF {item.price.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end justify-between flex-shrink-0">
              <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                <button
                  onClick={() => item.quantity > 1 ? updateQty(item.productId, item.quantity - 1) : removeItem(item.productId)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo code */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-accent" />
          <p className="font-semibold text-sm text-gray-800">Promo Code</p>
        </div>
        <div className="flex gap-2">
          <Input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 rounded-xl h-9 text-sm uppercase border-gray-200" />
          <Button onClick={handlePromo} variant="outline" className="rounded-xl h-9 text-sm px-4 border-gray-200">Apply</Button>
        </div>
        {promoDiscount > 0 && <p className="text-green-600 text-xs mt-1.5">Code "{promoCode}" — saving RWF {promoDiscount.toLocaleString()}</p>}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal ({count} items)</span>
            <span className="font-medium">RWF {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-RWF {promoDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
            <span>Total</span>
            <span className="text-primary">RWF {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Link href={`/checkout?discount=${promoDiscount}`}>
        <Button className="w-full h-12 bg-primary text-white rounded-xl text-base font-semibold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Proceed to Checkout · RWF {total.toLocaleString()}
        </Button>
      </Link>
    </div>
  );
}
