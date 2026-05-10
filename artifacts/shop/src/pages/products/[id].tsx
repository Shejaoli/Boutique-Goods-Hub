import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Star, ShoppingCart, ArrowLeft, Plus, Minus } from "lucide-react";
import { useGetProduct, useListProductReviews, useGetFeaturedProducts, getListProductReviewsQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";

type Product = {
  id: number; name: string; description?: string | null;
  price: number; originalPrice?: number | null; unit: string;
  imageUrl?: string | null; status?: string; rating?: number;
  reviewCount?: number; stockQuantity?: number; categoryId?: number | null;
  discountPercent?: number | null; isFeatured?: boolean;
};

function ProductDetailImage({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const colors: [string, string][] = [
    ["#e8f5e9", "#1a5c34"],
    ["#fff3e0", "#c87f0a"],
    ["#e3f2fd", "#1565c0"],
    ["#f3e5f5", "#6a1b9a"],
  ];
  const [bg, text] = colors[name.charCodeAt(0) % colors.length];
  if (imageUrl) return <img src={imageUrl} alt={name} className="w-full h-full object-cover" />;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bg }}>
      <span className="text-8xl font-serif font-bold" style={{ color: text }}>{name[0]?.toUpperCase()}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const [, params] = useRoute("/products/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addItem } = useGuestCart();
  const id = parseInt(params?.id ?? "0");
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: id > 0, queryKey: getGetProductQueryKey(id) } });
  const { data: reviews } = useListProductReviews(id, { query: { enabled: id > 0, queryKey: getListProductReviewsQueryKey(id) } });
  const { data: featured } = useGetFeaturedProducts();

  const p = product as Product | undefined;
  const reviewList = (reviews as { id: number; customerName: string; rating: number; comment?: string | null; createdAt: string }[] | undefined) ?? [];
  const relatedProducts = ((featured as { popular?: Product[] } | undefined)?.popular ?? []).filter(rp => rp.id !== id).slice(0, 4);

  const handleCart = () => {
    if (!p) return;
    for (let i = 0; i < qty; i++) {
      addItem({ productId: p.id, name: p.name, price: p.price, unit: p.unit, imageUrl: p.imageUrl });
    }
    toast({ title: `${p.name} (x${qty}) added to cart` });
  };

  if (isLoading) return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  );

  if (!p) return (
    <div className="text-center py-20">
      <p className="text-foreground font-semibold">Product not found</p>
      <Button onClick={() => navigate("/products")} className="mt-4 rounded-xl">Back to Products</Button>
    </div>
  );

  const outOfStock = p.status === "out_of_stock";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <ProductDetailImage imageUrl={p.imageUrl} name={p.name} />
        <button onClick={() => navigate("/products")} className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        {p.discountPercent && (
          <span className="absolute top-4 right-4 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">-{p.discountPercent}%</span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Info */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{p.unit}</p>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-0.5">{p.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-primary">₦{p.price.toLocaleString()}</span>
            {p.originalPrice && p.originalPrice > p.price && (
              <span className="text-muted-foreground line-through">₦{p.originalPrice.toLocaleString()}</span>
            )}
          </div>
          {(p.rating ?? 0) > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex">
                {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(p.rating ?? 0) ? "fill-accent text-accent" : "text-muted-foreground"}`} />)}
              </div>
              <span className="text-sm text-muted-foreground">{p.rating?.toFixed(1)} · {p.reviewCount} review{(p.reviewCount ?? 0) !== 1 ? "s" : ""}</span>
            </div>
          )}
          <div className="mt-1.5">
            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              outOfStock ? "bg-destructive/10 text-destructive" : p.status === "low_stock" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
            }`}>
              {outOfStock ? "Out of stock" : p.status === "low_stock" ? "Low stock" : "In stock"}
            </span>
          </div>
        </div>

        {p.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">{p.description}</p>
        )}

        {/* Qty + Add to Cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-card hover:bg-card/80 transition-all">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-semibold text-sm">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-card hover:bg-card/80 transition-all">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button
            onClick={handleCart}
            disabled={outOfStock}
            className="flex-1 h-11 bg-primary text-white rounded-xl font-semibold text-base gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-bold text-lg">Reviews ({reviewList.length})</h2>
          </div>

          {reviewList.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No reviews yet for this product.</p>
          ) : (
            <div className="space-y-3">
              {reviewList.map(r => (
                <div key={r.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{r.customerName}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />)}
                    </div>
                  </div>
                  {r.comment && <p className="text-muted-foreground text-sm">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-serif font-bold text-lg mb-3">You might also like</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map(rp => <ProductCard key={rp.id} product={rp} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
