import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, ChevronLeft, ArrowRight, Package, CreditCard, Truck } from "lucide-react";
import { useGetFeaturedProducts, useListCategories } from "@workspace/api-client-react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const BANNERS = [
  { title: "Fresh Commodities", subtitle: "Top quality grains, oils & more delivered to your door", cta: "Shop Now", href: "/products", bg: "from-primary to-primary/80", img: null },
  { title: "Flash Deals", subtitle: "Save up to 30% on selected items this week only", cta: "View Deals", href: "/products?sort=popular", bg: "from-accent to-amber-700", img: null },
  { title: "New Arrivals", subtitle: "Fresh stock just landed — be the first to grab them", cta: "Explore", href: "/products?sort=newest", bg: "from-[#1a4060] to-[#1a4060]/80", img: null },
];

const CATEGORY_ICONS: Record<string, string> = {
  "Grains": "🌾", "Oils": "🫙", "Spices": "🌶️", "Legumes": "🫘",
  "Condiments": "🧂", "Flour": "🌾", "Sugar": "🍬", "Salt": "🧂",
};

function Banner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);
  const b = BANNERS[idx];
  return (
    <div className="relative overflow-hidden rounded-2xl mx-4 mt-4 h-44">
      <div className={`absolute inset-0 bg-gradient-to-r ${b.bg}`} />
      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        <div>
          <h2 className="text-white font-serif text-xl font-bold">{b.title}</h2>
          <p className="text-white/80 text-sm mt-1 max-w-[220px]">{b.subtitle}</p>
        </div>
        <Link href={b.href}>
          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/30 transition-all">
            {b.cta} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
      <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/40 w-1.5"}`} />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <h2 className="font-serif text-lg font-bold text-foreground">{title}</h2>
      <Link href={href} className="flex items-center gap-0.5 text-primary text-sm font-semibold hover:underline">
        See all <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { data: featured, isLoading } = useGetFeaturedProducts();
  const { data: categories } = useListCategories();

  const cats = (categories as { id: number; name: string; productCount: number }[] | undefined) ?? [];
  const f = featured as {
    newIn: Parameters<typeof ProductCard>[0]["product"][];
    flashDeals: Parameters<typeof ProductCard>[0]["product"][];
    topSelling: Parameters<typeof ProductCard>[0]["product"][];
  } | undefined;

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <Banner />

      {/* Categories */}
      {cats.length > 0 && (
        <div className="mt-5">
          <SectionTitle title="Shop by Category" href="/products" />
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
            {cats.map(cat => (
              <Link key={cat.id} href={`/products?category=${cat.id}`}>
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-all">
                    <span className="text-2xl">{CATEGORY_ICONS[cat.name] ?? "📦"}</span>
                  </div>
                  <span className="text-[11px] font-medium text-foreground text-center leading-tight max-w-[56px]">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New In */}
      <div className="mt-6">
        <SectionTitle title="New In" href="/products?sort=newest" />
        {isLoading ? (
          <div className="flex gap-3 px-4 overflow-x-auto">
            {[1,2,3].map(i => <Skeleton key={i} className="w-36 h-52 flex-shrink-0 rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
            {(f?.newIn ?? []).slice(0, 8).map(p => (
              <div key={p.id} className="w-36 flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flash Deals */}
      {(f?.flashDeals?.length ?? 0) > 0 && (
        <div className="mt-6">
          <SectionTitle title="Flash Deals" href="/products" />
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
            {f?.flashDeals.slice(0, 6).map(p => (
              <div key={p.id} className="w-36 flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Selling */}
      <div className="mt-6">
        <SectionTitle title="Top Selling This Week" href="/products?sort=popular" />
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
            {(f?.topSelling ?? []).slice(0, 6).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Feature strip */}
      <div className="mt-8 mx-4 bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: Package, label: "Quality Products" },
            { icon: CreditCard, label: "Easy Payment" },
            { icon: Truck, label: "Fast Delivery" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-foreground leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="mt-4 mx-4 bg-accent/10 rounded-2xl p-4 border border-accent/20">
        <h3 className="font-serif font-bold text-foreground text-base">Get deals in your inbox</h3>
        <p className="text-muted-foreground text-xs mt-0.5 mb-3">Subscribe for weekly deals and new arrivals</p>
        <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder="your@email.com" className="flex-1 h-9 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="h-9 px-4 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex-shrink-0">
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}
