import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, ChevronLeft, Package, CreditCard, Truck, Star, Plus, ArrowRight, Tag, Zap } from "lucide-react";
import { useGetFeaturedProducts, useListCategories } from "@workspace/api-client-react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const BANNERS = [
  {
    title: "Get Best Fresh",
    titleHighlight: "Commodity Goods",
    subtitle: "We care for you — quality grains, oils & more, processed and farm-fresh, delivered to your door",
    cta: "Shop Now",
    href: "/products",
    bg: "from-[#0f3d23] via-primary to-[#1e7a42]",
    badge: "FRESH ARRIVALS",
  },
  {
    title: "Flash Deals",
    titleHighlight: "Save Up to 30%",
    subtitle: "Don't miss out — selected products on heavy discount this week only",
    cta: "View Deals",
    href: "/products?sort=popular",
    bg: "from-[#7a3f00] via-[#c87f0a] to-[#e8a020]",
    badge: "LIMITED TIME",
  },
  {
    title: "New In Stock",
    titleHighlight: "Just Landed",
    subtitle: "Fresh stock just arrived — be the first to grab the best selections",
    cta: "Explore",
    href: "/products?sort=newest",
    bg: "from-[#1a3060] via-[#1a4a80] to-[#2a6ab0]",
    badge: "NEW ARRIVALS",
  },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  "Grains": "🌾", "Oils": "🫙", "Spices": "🌶️", "Legumes": "🫘",
  "Condiments": "🧂", "Flour": "🌾", "Sugar": "🍬", "Salt": "🧂",
  "Canned": "🥫", "Dairy": "🥛", "Beverages": "🧃",
};

function HeroBanner() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const b = BANNERS[idx];

  return (
    <div className="relative overflow-hidden rounded-2xl mx-4 mt-4 min-h-[180px] md:min-h-[260px]">
      <div className={`absolute inset-0 bg-gradient-to-br ${b.bg}`} />

      {/* Decorative circles */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full" />
      <div className="absolute -right-4 bottom-0 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute right-1/4 top-1/4 w-16 h-16 bg-white/5 rounded-full" />

      <div className="relative z-10 p-5 md:p-8 h-full flex flex-col justify-between">
        <div>
          <span className="inline-block text-[10px] font-bold tracking-widest text-white/70 bg-white/15 px-2.5 py-1 rounded-full mb-3">
            {b.badge}
          </span>
          <h2 className="text-white font-serif text-2xl md:text-4xl font-bold leading-tight">
            {b.title} <span className="text-accent">{b.titleHighlight}</span>
          </h2>
          <p className="text-white/70 text-sm mt-2 max-w-sm md:max-w-md leading-relaxed hidden sm:block">{b.subtitle}</p>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Link href={b.href}>
            <span className="inline-flex items-center gap-2 bg-white text-primary text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-50 transition-all shadow-md">
              {b.cta} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <div className="flex gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => setIdx(i => (i - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hidden sm:flex"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => setIdx(i => (i + 1) % BANNERS.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hidden sm:flex"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

function FeatureStrip() {
  return (
    <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        {[
          { icon: Package, label: "15,000+", sub: "Quality Products", color: "text-primary bg-primary/10" },
          { icon: CreditCard, label: "Easy", sub: "Online Payment", color: "text-blue-600 bg-blue-50" },
          { icon: Truck, label: "Doorstep", sub: "Fast Delivery", color: "text-amber-600 bg-amber-50" },
        ].map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-3 py-3.5 text-center sm:text-left">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{label}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, href, icon: Icon }: { title: string; href: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="flex items-center gap-2">
        {Icon && <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>}
        <h2 className="font-serif text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <Link href={href}>
        <span className="flex items-center gap-0.5 text-primary text-xs font-semibold hover:underline cursor-pointer">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { data: featured, isLoading } = useGetFeaturedProducts();
  const { data: categories } = useListCategories();

  const cats = Array.isArray(categories) ? (categories as { id: number; name: string; productCount: number; icon?: string | null }[]) : [];
  const f = featured as {
    newIn: Parameters<typeof ProductCard>[0]["product"][];
    flashDeals: Parameters<typeof ProductCard>[0]["product"][];
    topSelling: Parameters<typeof ProductCard>[0]["product"][];
  } | undefined;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <HeroBanner />
      <FeatureStrip />

      {/* Flash Deals */}
      {(f?.flashDeals?.length ?? 0) > 0 && (
        <div className="mt-6">
          <SectionHeader title="Flash Deals" href="/products" icon={Zap} />
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
            {f?.flashDeals.slice(0, 8).map(p => (
              <div key={p.id} className="w-40 flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {cats.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Shop by Category" href="/products" />
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
            {/* All Categories chip */}
            <Link href="/products">
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                  <span className="text-2xl">🛒</span>
                </div>
                <span className="text-[11px] font-medium text-gray-600 text-center">All</span>
              </div>
            </Link>
            {cats.map(cat => (
              <Link key={cat.id} href={`/products?category=${cat.id}`}>
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:scale-105 transition-all">
                    <span className="text-2xl">{cat.icon ?? CATEGORY_EMOJIS[cat.name] ?? "📦"}</span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-600 text-center leading-tight max-w-[56px]">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New In */}
      <div className="mt-6">
        <SectionHeader title="New In" href="/products?sort=newest" />
        {isLoading ? (
          <div className="flex gap-3 px-4 overflow-x-auto">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-40 h-56 flex-shrink-0 rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
            {(f?.newIn ?? []).slice(0, 8).map(p => (
              <div key={p.id} className="w-40 flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promo banners */}
      <div className="mt-6 px-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-primary rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute right-4 top-4 w-12 h-12 bg-white/10 rounded-full" />
          <p className="text-white/70 text-xs uppercase tracking-wide font-semibold">New Product</p>
          <p className="text-white font-serif text-lg font-bold mt-1">Premium Basmati</p>
          <p className="text-white/70 text-xs mt-0.5">Now available — 5kg bags</p>
          <Link href="/products?sort=newest">
            <span className="inline-flex items-center gap-1 text-white text-xs font-semibold mt-3 hover:underline cursor-pointer">
              Shop More <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="bg-accent rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute right-4 top-4 w-12 h-12 bg-white/10 rounded-full" />
          <p className="text-white/70 text-xs uppercase tracking-wide font-semibold">Exclusive Offer</p>
          <p className="text-white font-serif text-lg font-bold mt-1">All Cooking Oils</p>
          <p className="text-white/70 text-xs mt-0.5">Up to 20% off this weekend</p>
          <Link href="/products">
            <span className="inline-flex items-center gap-1 text-white text-xs font-semibold mt-3 hover:underline cursor-pointer">
              Buy Now <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </div>

      {/* Top Selling */}
      <div className="mt-6">
        <SectionHeader title="Top Selling This Week" href="/products?sort=popular" icon={Star} />
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
            {(f?.topSelling ?? []).slice(0, 8).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Newsletter */}
      <div className="mt-8 mx-4 rounded-2xl overflow-hidden">
        <div className="bg-primary p-6 md:p-8 text-center relative">
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative">
            <Tag className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-white mb-1">Subscribe & Save 10%</h3>
            <p className="text-white/65 text-sm mb-4">Get weekly deals and new arrivals straight to your inbox.</p>
            <form className="flex gap-2 max-w-sm mx-auto" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 h-10 px-4 rounded-xl border-0 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="submit"
                className="h-10 px-5 bg-accent text-white text-sm font-bold rounded-xl hover:bg-accent/90 transition-all flex-shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
