import { useState } from "react";
import { Link } from "wouter";
import { Heart, Plus, Star } from "lucide-react";
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

function PlaceholderImage({ name }: { name: string }) {
  const colors = [
    ["#e8f5e9", "#1a5c34"],
    ["#fff3e0", "#c87f0a"],
    ["#e3f2fd", "#1565c0"],
    ["#f3e5f5", "#6a1b9a"],
    ["#e8f5e9", "#2d9e5f"],
  ];
  const [bg, text] = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: bg }}>
      <span className="text-5xl font-serif font-bold" style={{ color: text }}>{name[0]?.toUpperCase()}</span>
    </div>
  );
}

export function ProductImage2({ imageUrl, name, className }: { imageUrl?: string | null; name: string; className?: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className={`w-full h-full object-cover ${className ?? ""}`} />;
  return <PlaceholderImage name={name} />;
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
    e.stopPropagation();
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
    e.stopPropagation();
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
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-250 hover:-translate-y-1 cursor-pointer border border-gray-100 group">
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <PlaceholderImage name={product.name} />
          )}

          {/* Discount badge */}
          {product.discountPercent && (
            <span className="absolute top-2 left-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{product.discountPercent}%
            </span>
          )}

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Out of Stock</span>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${
              wishlisted
                ? "bg-rose-500 text-white"
                : "bg-white text-gray-400 hover:text-rose-400 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          {product.categoryName && (
            <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wide mb-0.5">{product.categoryName}</p>
          )}
          <h3 className="font-semibold text-sm text-gray-800 leading-snug line-clamp-2 mb-1">{product.name}</h3>

          <p className="text-xs text-gray-400 mb-2">{product.unit}</p>

          {(product.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className="w-3 h-3"
                  fill={s <= Math.round(product.rating ?? 0) ? "#c87f0a" : "none"}
                  stroke={s <= Math.round(product.rating ?? 0) ? "#c87f0a" : "#d1d5db"}
                />
              ))}
              <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="font-bold text-primary text-base">₦{product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-gray-400 line-through text-xs ml-1.5">₦{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <button
              onClick={handleCart}
              disabled={outOfStock || adding}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                outOfStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90 active:scale-90"
              } ${adding ? "opacity-70 scale-95" : ""}`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
