import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, Tag } from "lucide-react";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useClearCart, useValidatePromoCode, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type CartItem = { id: number; productId: number; productName: string; price: number; unit: string; quantity: number; imageUrl?: string | null; subtotal: number };

export default function CartPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [promoInput, setPromoInput] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState("");

  const { data, isLoading } = useGetCart({ query: { enabled: !!token, queryKey: getGetCartQueryKey() } });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const validatePromo = useValidatePromoCode();

  const cart = data as { items: CartItem[]; subtotal: number; total: number } | undefined;
  const items = cart?.items ?? [];

  if (!token) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2">Your cart awaits</h2>
      <p className="text-muted-foreground text-sm mb-4">Sign in to view your cart</p>
      <Button onClick={() => navigate("/auth/login")} className="bg-primary text-white rounded-xl">Sign in</Button>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );

  const handleQty = (itemId: number, qty: number) => {
    updateItem.mutate({ itemId, data: { quantity: qty } } as Parameters<typeof updateItem.mutate>[0], {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ itemId } as Parameters<typeof removeItem.mutate>[0], {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    });
  };

  const handlePromo = () => {
    if (!promoInput) return;
    validatePromo.mutate({ data: { code: promoInput, cartTotal: cart?.subtotal ?? 0 } } as Parameters<typeof validatePromo.mutate>[0], {
      onSuccess: (res: { valid: boolean; discount: number; message?: string | null }) => {
        if (res.valid) {
          setPromoDiscount(res.discount);
          setPromoCode(promoInput);
          toast({ title: `Promo applied! You save ₦${res.discount.toLocaleString()}` });
        } else {
          toast({ title: res.message ?? "Invalid promo code", variant: "destructive" });
        }
      },
    });
  };

  const subtotal = cart?.subtotal ?? 0;
  const total = Math.max(0, subtotal - promoDiscount);

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground text-sm mb-4">Add some products to get started</p>
      <Button onClick={() => navigate("/products")} className="bg-primary text-white rounded-xl">Browse Products</Button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl font-bold">My Cart <span className="text-muted-foreground text-base font-normal">({items.length})</span></h1>
        <button onClick={() => clearCart.mutate(undefined as unknown as Parameters<typeof clearCart.mutate>[0], { onSuccess: () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() }) })} className="text-xs text-destructive hover:underline">Clear all</button>
      </div>

      <div className="space-y-3 mb-5">
        {items.map(item => (
          <div key={item.id} className="bg-card rounded-2xl p-3 border border-border flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-xl font-serif text-primary">{item.productName[0]}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-1">{item.productName}</p>
              <p className="text-xs text-muted-foreground">{item.unit}</p>
              <p className="text-primary font-bold mt-0.5">₦{item.price.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end justify-between flex-shrink-0">
              <button onClick={() => handleRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 bg-muted rounded-lg p-0.5">
                <button onClick={() => item.quantity > 1 ? handleQty(item.id, item.quantity - 1) : handleRemove(item.id)} className="w-6 h-6 flex items-center justify-center rounded bg-card">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => handleQty(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-card">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-accent" />
          <p className="font-semibold text-sm">Promo code</p>
        </div>
        <div className="flex gap-2">
          <Input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 rounded-xl h-9 text-sm uppercase" />
          <Button onClick={handlePromo} disabled={validatePromo.isPending} variant="outline" className="rounded-xl h-9 text-sm px-4">Apply</Button>
        </div>
        {promoDiscount > 0 && <p className="text-success text-xs mt-1.5">Code "{promoCode}" applied — saving ₦{promoDiscount.toLocaleString()}</p>}
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span>-₦{promoDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
            <span>Total</span>
            <span className="text-primary">₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Link href={`/checkout?promo=${promoCode}&discount=${promoDiscount}`}>
        <Button className="w-full h-12 bg-primary text-white rounded-xl text-base font-semibold">
          Proceed to Checkout · ₦{total.toLocaleString()}
        </Button>
      </Link>
    </div>
  );
}
