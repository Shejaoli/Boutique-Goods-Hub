import { useState } from "react";
import { Link } from "wouter";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useAddToCart, useAddToWishlist, useRemoveFromWishlist, getGetCartQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  unit: string;
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  status?: string;
  discountPercent?: number | null;
  categoryName?: string | null;
}

interface Props {
  product: Product;
  wishlisted?: boolean;
}

function ProductImage({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className="w-full h-full object-cover" />;
  const initial = name[0]?.toUpperCase() ?? "P";
  const colors = ["#1a5c34","#2d9e5f","#c87f0a","#e8a020","#1a4060","#6b3a7d"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors[idx]}22, ${colors[idx]}44)` }}>
      <span className="text-4xl font-serif font-bold" style={{ color: colors[idx] }}>{initial}</span>
    </div>
  );
}

export function ProductImage2({ imageUrl, name, className }: { imageUrl?: string | null; name: string; className?: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className={`w-full h-full object-cover ${className ?? ""}`} />;
  const initial = name[0]?.toUpperCase() ?? "P";
  const colors = ["#1a5c34","#2d9e5f","#c87f0a","#e8a020","#1a4060","#6b3a7d"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-full h-full flex items-center justify-center ${className ?? ""}`} style={{ background: `linear-gradient(135deg, ${colors[idx]}22, ${colors[idx]}44)` }}>
      <span className="text-5xl font-serif font-bold" style={{ color: colors[idx] }}>{initial}</span>
    </div>
  );
}

export default function ProductCard({ product, wishlisted: initialWishlisted = false }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [adding, setAdding] = useState(false);

  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) { toast({ title: "Please sign in to add to cart" }); return; }
    setAdding(true);
    addToCart.mutate({ data: { productId: product.id, quantity: 1 } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: `${product.name} added to cart` });
      },
      onError: () => toast({ title: "Failed to add to cart", variant: "destructive" }),
      onSettled: () => setAdding(false),
    });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) { toast({ title: "Please sign in first" }); return; }
    if (wishlisted) {
      setWishlisted(false);
      removeFromWishlist.mutate({ productId: product.id }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }),
        onError: () => setWishlisted(true),
      });
    } else {
      setWishlisted(true);
      addToWishlist.mutate({ data: { productId: product.id } }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }),
        onError: () => setWishlisted(false),
      });
    }
  };

  const outOfStock = product.status === "out_of_stock";

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-250 hover:-translate-y-1 cursor-pointer border border-border/50 group">
        <div className="relative aspect-square bg-muted overflow-hidden">
          <ProductImage imageUrl={product.imageUrl} name={product.name} />
          {product.discountPercent && (
            <span className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{product.discountPercent}%
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${
              wishlisted ? "bg-destructive text-white" : "bg-white/90 text-muted-foreground hover:text-destructive"
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">{product.unit}</p>
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-1">{product.name}</h3>
          {(product.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span className="text-[11px] text-muted-foreground">{product.rating?.toFixed(1)} ({product.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="font-bold text-primary text-base">₦{product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-muted-foreground line-through text-xs ml-1">₦{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <button
              onClick={handleCart}
              disabled={outOfStock || adding}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                outOfStock ? "bg-muted text-muted-foreground" : "bg-primary text-white hover:bg-primary/90 active:scale-95"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
