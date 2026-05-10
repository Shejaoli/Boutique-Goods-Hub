import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, MapPin, Clock } from "lucide-react";
import { useGuestCart } from "@/hooks/use-guest-cart";

export default function Header() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const { count: cartCount } = useGuestCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top info bar */}
      <div className="bg-primary hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-white/80 text-xs">
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />Kigali, Rwanda</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />Delivery: Mon–Sat, 8am–6pm</span>
          </div>
          <div className="flex items-center gap-4 text-white/80 text-xs">
            <a href="https://wa.me/250780405259" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">📞 +250 780 405 259</a>
            <span>✉️ hello@greenbasket.rw</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-serif font-bold text-base">G</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-serif text-xl font-bold text-primary leading-tight">GreenBasket</p>
                <p className="text-[10px] text-gray-400 -mt-0.5 leading-none">Fresh & Quality</p>
              </div>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
              <div className="relative flex">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search for products..."
                  className="flex-1 h-10 pl-4 pr-4 border border-gray-200 border-r-0 rounded-l-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-primary/40 bg-gray-50"
                />
                <button type="submit" className="h-10 px-4 bg-primary text-white text-sm font-semibold rounded-r-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 flex-shrink-0">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>

            {/* Cart icon */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Link href="/cart">
                <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-primary hover:bg-primary/8 transition-all relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5 ring-2 ring-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="bg-primary hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { label: "All Categories", href: "/products" },
              { label: "🌾 Grains", href: "/products?category=grains" },
              { label: "🫙 Oils", href: "/products?category=oils" },
              { label: "🧂 Condiments", href: "/products?category=condiments" },
              { label: "🌶️ Spices", href: "/products?category=spices" },
              { label: "🫘 Legumes", href: "/products?category=legumes" },
              { label: "⚡ Flash Deals", href: "/products?sort=popular" },
              { label: "🆕 New Arrivals", href: "/products?sort=newest" },
            ].map(({ label, href }) => (
              <Link key={href} href={href}>
                <span className="flex-shrink-0 text-white/85 hover:text-white hover:bg-white/15 text-xs font-medium px-3 py-2.5 rounded-sm transition-all whitespace-nowrap cursor-pointer">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
