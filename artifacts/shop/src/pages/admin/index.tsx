import { useLocation } from "wouter";
import { TrendingUp, Package, ShoppingBag, Users, AlertTriangle, DollarSign, BarChart3, Activity } from "lucide-react";
import { useGetDashboardStats, useGetRevenueChart, useGetPaymentMethodBreakdown, useGetRecentActivity, useGetLowStockProducts, getGetDashboardStatsQueryKey, getGetRevenueChartQueryKey, getGetPaymentMethodBreakdownQueryKey, getGetRecentActivityQueryKey, getGetLowStockProductsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const COLORS = ["#1a5c34", "#c87f0a", "#2d9e5f", "#e8a020", "#d94040"];

type Stats = {
  todayRevenue: number; weekRevenue: number; totalProducts: number;
  inventoryValue: number; pendingOrders: number; lowStockCount: number;
  totalCustomers: number; monthExpenses: number; totalOrders: number; outOfStockCount: number;
};

function KPICard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; sub?: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { enabled: !!token, queryKey: getGetDashboardStatsQueryKey() } });
  const { data: revenue } = useGetRevenueChart({ days: 7 }, { query: { enabled: !!token, queryKey: getGetRevenueChartQueryKey({ days: 7 }) } });
  const { data: payMethods } = useGetPaymentMethodBreakdown({ query: { enabled: !!token, queryKey: getGetPaymentMethodBreakdownQueryKey() } });
  const { data: activity } = useGetRecentActivity({ query: { enabled: !!token, queryKey: getGetRecentActivityQueryKey() } });
  const { data: lowStock } = useGetLowStockProducts({ query: { enabled: !!token, queryKey: getGetLowStockProductsQueryKey() } });

  const s = stats as Stats | undefined;
  const revenueData = (revenue as { date: string; revenue: number; orders: number }[] | undefined) ?? [];
  const payData = (payMethods as { method: string; count: number; total: number }[] | undefined) ?? [];
  const activityList = (activity as { id: number; type: string; message: string; createdAt: string }[] | undefined) ?? [];
  const lowStockList = (lowStock as { id: number; name: string; stockQuantity: number; minStockLevel: number }[] | undefined) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back — here's what's happening</p>
      </div>

      {/* KPIs */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Today Revenue" value={`₦${(s?.todayRevenue ?? 0).toLocaleString()}`} icon={DollarSign} color="bg-primary" sub="Delivered orders" />
          <KPICard label="Week Revenue" value={`₦${(s?.weekRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="bg-success" sub="Last 7 days" />
          <KPICard label="Total Products" value={String(s?.totalProducts ?? 0)} icon={Package} color="bg-accent" sub={`${s?.lowStockCount ?? 0} low stock`} />
          <KPICard label="Inventory Value" value={`₦${(s?.inventoryValue ?? 0).toLocaleString()}`} icon={BarChart3} color="bg-[#1a4060]" />
          <KPICard label="Pending Orders" value={String(s?.pendingOrders ?? 0)} icon={ShoppingBag} color="bg-warning" sub="Needs attention" />
          <KPICard label="Low Stock" value={String(s?.lowStockCount ?? 0)} icon={AlertTriangle} color="bg-destructive" sub={`${s?.outOfStockCount ?? 0} out of stock`} />
          <KPICard label="Total Customers" value={String(s?.totalCustomers ?? 0)} icon={Users} color="bg-purple-600" />
          <KPICard label="Month Expenses" value={`₦${(s?.monthExpenses ?? 0).toLocaleString()}`} icon={Activity} color="bg-rose-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-4 border border-border">
          <h2 className="font-semibold mb-4">7-Day Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString("en-GB", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]} labelFormatter={d => new Date(d).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })} />
              <Bar dataKey="revenue" fill="#1a5c34" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment breakdown */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h2 className="font-semibold mb-4">Payment Methods</h2>
          {payData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={payData.filter(d => d.count > 0)} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={75} labelLine={false}>
                  {payData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name.replace(/_/g, " ")]} />
                <Legend formatter={v => v.replace(/_/g, " ")} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent activity */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Recent Activity</h2>
            <span className="text-xs text-muted-foreground">{activityList.length} entries</span>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {activityList.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4 text-center">No activity yet</p>
            ) : activityList.map(a => (
              <div key={a.id} className="px-4 py-2.5">
                <p className="text-sm text-foreground">{a.message}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Low Stock Alert</h2>
            <Link href="/admin/products">
              <span className="text-xs text-primary font-medium hover:underline cursor-pointer">View all</span>
            </Link>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {lowStockList.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4 text-center">All products well stocked</p>
            ) : lowStockList.map(p => (
              <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-24">
                      <div className="h-full bg-destructive rounded-full" style={{ width: `${Math.min(100, (p.stockQuantity / p.minStockLevel) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{p.stockQuantity} left</span>
                  </div>
                </div>
                <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${p.stockQuantity <= 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                  {p.stockQuantity <= 0 ? "Out" : "Low"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
