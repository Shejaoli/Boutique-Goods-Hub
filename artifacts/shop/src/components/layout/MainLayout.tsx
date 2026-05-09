import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Grid3X3, ShoppingCart, Heart, User } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import Header from "./Header";

interface Props { children: ReactNode }

export default function MainLayout({ children }: Props) {
  const [location] = useLocation();
  const { token } = useAuth();
  const { data: cart } = useGetCart({ query: { enabled: !!token, queryKey: getGetCartQueryKey() } });
  const cartCount = cart?.items?.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) ?? 0;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/products", icon: Grid3X3, label: "Shop" },
    { href: "/cart", icon: ShoppingCart, label: "Cart", badge: cartCount },
    { href: "/wishlist", icon: Heart, label: "Saved" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header cartCount={cartCount} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <button className={`flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                  <span className="relative">
                    <Icon className="w-5 h-5" />
                    {badge != null && badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium">{label}</span>
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
