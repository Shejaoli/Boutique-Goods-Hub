import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Truck,
  Receipt, UserCog, Tag, BarChart3, Menu, LogOut, Bell,
  Search, Settings, HelpCircle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";

interface Props { children: ReactNode }

const mainNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Inventory", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
];

const otherNavItems = [
  { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/staff", label: "Staff", icon: UserCog },
  { href: "/admin/promo", label: "Promo Codes", icon: Tag },
  { href: "#", label: "Settings", icon: Settings },
  { href: "#", label: "Help / Support", icon: HelpCircle },
];

export default function AdminLayout({ children }: Props) {
  const [location, navigate] = useLocation();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifications } = useListNotifications({ query: { enabled: !!user, queryKey: getListNotificationsQueryKey() } });
  const unread = Array.isArray(notifications) ? (notifications as { isRead: boolean }[]).filter(n => !n.isRead).length : 0;

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login");
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : (href !== "#" && location.startsWith(href));

  const NavItem = ({ href, label, icon: Icon, exact }: { href: string; label: string; icon: React.ComponentType<{className?: string}>; exact?: boolean }) => {
    const active = isActive(href, exact);
    return (
      <Link href={href} onClick={() => setSidebarOpen(false)}>
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
          active
            ? "bg-primary text-white shadow-sm shadow-primary/30"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        }`}>
          <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
          <span className={`text-sm font-medium ${active ? "text-white" : ""}`}>{label}</span>
          {active && <ChevronRight className="w-3.5 h-3.5 text-white/70 ml-auto" />}
        </div>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <p className="font-serif font-bold text-gray-900 text-lg leading-tight">GreenBasket</p>
            <p className="text-gray-400 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2">Main</p>
        {mainNavItems.map(item => <NavItem key={item.href} {...item} />)}

        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-4 pb-2">Operations</p>
        {otherNavItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Need Help card */}
      <div className="p-3">
        <div className="bg-primary/8 rounded-2xl p-3 mb-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
          <p className="text-sm font-semibold text-gray-800 mb-0.5">Need Help?</p>
          <p className="text-xs text-gray-500 mb-2">Contact support team</p>
          <button className="h-7 px-3 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all">
            Get Support
          </button>
        </div>
        {/* User + Logout */}
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
          <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-sm font-bold">{user?.name?.[0] ?? "A"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 text-xs font-semibold truncate">{user?.name ?? "Admin"}</p>
            <p className="text-gray-400 text-[10px] capitalize">{user?.role ?? "staff"}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-3 shadow-sm">
          <Button size="icon" variant="ghost" className="md:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, products, customers..."
                className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="relative text-gray-500 hover:text-gray-800 hover:bg-gray-50">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-white" />
              )}
            </Button>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100">
              <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                <span className="text-primary text-sm font-bold">{user?.name?.[0] ?? "A"}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name ?? "Admin"}</p>
                <p className="text-[10px] text-gray-400 capitalize">{user?.role ?? "staff"}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
