import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Grid3X3, ShoppingCart } from "lucide-react";
import { useGuestCart } from "@/hooks/use-guest-cart";
import Header from "./Header";

interface Props { children: ReactNode }

export default function MainLayout({ children }: Props) {
  const [location] = useLocation();
  const { count: cartCount } = useGuestCart();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/products", icon: Grid3X3, label: "Shop" },
    { href: "/cart", icon: ShoppingCart, label: "Cart", badge: cartCount },
  ];

  return (
    <div className="min-h-screen bg-[#f5f2ed] flex flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
        <div className="flex items-center justify-around py-1.5 max-w-md mx-auto">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <button className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl relative transition-colors ${active ? "text-primary" : "text-gray-400"}`}>
                  <span className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.5 : 2} />
                    {badge != null && badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5 ring-1 ring-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] font-medium transition-colors ${active ? "text-primary font-semibold" : "text-gray-400"}`}>
                    {label}
                  </span>
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
