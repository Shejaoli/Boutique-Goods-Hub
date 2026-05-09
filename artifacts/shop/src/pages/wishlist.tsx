import { useLocation } from "wouter";
import { Heart } from "lucide-react";
import { useGetWishlist, useRemoveFromWishlist, useAddToCart, getGetWishlistQueryKey, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type WishlistItem = {
  id: number;
  productId: number;
  product: {
    id: number; name: string; price: number; unit: string;
    imageUrl?: string | null; status?: string;
  } | null;
};

export default function WishlistPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data, isLoading } = useGetWishlist({ query: { enabled: !!token, queryKey: getGetWishlistQueryKey() } });
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  const items = (data as WishlistItem[] | undefined) ?? [];

  if (!token) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2">Your wishlist</h2>
      <p className="text-muted-foreground text-sm mb-4">Sign in to save products you love</p>
      <Button onClick={() => navigate("/auth/login")} className="bg-primary text-white rounded-xl">Sign in</Button>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-xl mx-auto p-4">
      <Skeleton className="h-7 w-40 mb-4" />
      <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
    </div>
  );

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="font-serif text-xl font-bold mb-2">Your wishlist is empty</h2>
      <p className="text-muted-foreground text-sm mb-4">Save products you love to buy them later</p>
      <Button onClick={() => navigate("/products")} className="bg-primary text-white rounded-xl">Browse Products</Button>
    </div>
  );

  const handleRemove = (productId: number) => {
    removeFromWishlist.mutate({ productId } as Parameters<typeof removeFromWishlist.mutate>[0], {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }),
    });
  };

  const handleMoveToCart = (productId: number, name: string) => {
    addToCart.mutate({ data: { productId, quantity: 1 } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
        handleRemove(productId);
        toast({ title: `${name} moved to cart` });
      },
      onError: () => toast({ title: "Failed to add to cart", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="font-serif text-2xl font-bold mb-4">Wishlist <span className="text-muted-foreground text-base font-normal">({items.length})</span></h1>
      <div className="space-y-3">
        {items.map(item => {
          const p = item.product;
          if (!p) return null;
          return (
            <div key={item.id} className="bg-card rounded-2xl p-3 border border-border flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-xl font-serif text-primary">{p.name[0]}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.unit}</p>
                <p className="text-primary font-bold mt-0.5">₦{p.price.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <button onClick={() => handleRemove(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Heart className="w-4 h-4 fill-current text-destructive" />
                </button>
                <Button size="sm" onClick={() => handleMoveToCart(item.productId, p.name)} className="bg-primary text-white rounded-lg text-xs h-7 px-3">
                  Add to Cart
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
