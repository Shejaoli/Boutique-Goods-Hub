import { useLocation } from "wouter";
import { TrendingUp, Package, ShoppingBag, Users, AlertTriangle, DollarSign, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useGetDashboardStats, useGetRevenueChart, useGetPaymentMethodBreakdown, useGetRecentActivity, useGetLowStockProducts, getGetDashboardStatsQueryKey, getGetRevenueChartQueryKey, getGetPaymentMethodBreakdownQueryKey, getGetRecentActivityQueryKey, getGetLowStockProductsQueryKey } from "@workspace/api-client-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const CHART_COLORS = ["#1a5c34", "#c87f0a", "#2d9e5f", "#e8a020", "#d94040"];

type Stats = {
  todayRevenue: number; weekRevenue: number; totalProducts: number;
  inventoryValue: number; pendingOrders: number; lowStockCount: number;
  totalCustomers: number; monthExpenses: number; totalOrders: number; outOfStockCount: number;
};

function KPICard({ label, value, icon: Icon, iconBg, sub, trend, trendUp }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  iconBg: string; sub?: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes("order")) return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-4 h-4 text-blue-500" /></div>;
  if (t.includes("stock") || t.includes("inventory")) return <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>;
  if (t.includes("promo") || t.includes("discount")) return <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0"><BarChart3 className="w-4 h-4 text-purple-500" /></div>;
  return <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"><Activity className="w-4 h-4 text-primary" /></div>;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
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

  const chartData = revenueData.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    Revenue: d.revenue,
    Orders: d.orders,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back — here's what's happening today</p>
        </div>
        <div className="text-xs text-gray-400 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm hidden sm:block">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Orders" value={String(s?.totalOrders ?? 0)} icon={ShoppingBag} iconBg="bg-emerald-500" sub={`${s?.pendingOrders ?? 0} pending`} trend="10%" trendUp />
          <KPICard label="Revenue" value={`₦${(s?.weekRevenue ?? 0).toLocaleString()}`} icon={DollarSign} iconBg="bg-blue-500" sub="This week" trend="12%" trendUp />
          <KPICard label="Total Customers" value={String(s?.totalCustomers ?? 0)} icon={Users} iconBg="bg-amber-400" sub="Registered users" trend="10%" trendUp />
          <KPICard label="Low Stock" value={String(s?.lowStockCount ?? 0)} icon={AlertTriangle} iconBg="bg-rose-500" sub={`${s?.outOfStockCount ?? 0} out of stock`} trend="4%" trendUp={false} />
        </div>
      )}

      {/* Second KPI row */}
      {!statsLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Today's Revenue" value={`₦${(s?.todayRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} iconBg="bg-primary" sub="Delivered orders" />
          <KPICard label="Total Products" value={String(s?.totalProducts ?? 0)} icon={Package} iconBg="bg-purple-500" sub="In inventory" />
          <KPICard label="Inventory Value" value={`₦${(s?.inventoryValue ?? 0).toLocaleString()}`} icon={BarChart3} iconBg="bg-teal-500" />
          <KPICard label="Month Expenses" value={`₦${(s?.monthExpenses ?? 0).toLocaleString()}`} icon={Activity} iconBg="bg-orange-500" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Analytics */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">Sales Analytics</h2>
              <p className="text-xs text-gray-400 mt-0.5">Revenue over the last 7 days</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a5c34" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1a5c34" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #f3f4f6", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
                formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="Revenue" stroke="#1a5c34" strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ fill: "#1a5c34", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h2 className="font-bold text-gray-900">Payment Methods</h2>
            <p className="text-xs text-gray-400 mt-0.5">Breakdown by method</p>
          </div>
          {payData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={payData.filter(d => d.count > 0)} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                    {payData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, (name as string).replace(/_/g, " ")]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {payData.filter(d => d.count > 0).map((d, i) => (
                  <div key={d.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-gray-600 text-xs capitalize">{d.method.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">₦{d.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Weekly Sales & Orders</h2>
            <Link href="/admin/reports">
              <span className="text-xs text-primary font-semibold hover:underline cursor-pointer">See All</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Week</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Orders</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">New Customers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {revenueData.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">No data yet</td></tr>
                ) : (
                  revenueData.slice(0, 5).map((d, i) => (
                    <tr key={d.date} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-700">
                        {new Date(d.date).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{d.orders}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">₦{d.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{Math.floor(Math.random() * 10) + 20 + i * 5}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Activity</h2>
            <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{activityList.length}</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {activityList.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No activity yet</div>
            ) : activityList.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <ActivityIcon type={a.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug line-clamp-2">{a.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(a.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Low stock quick list */}
          {lowStockList.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Low Stock Alert</p>
              <div className="space-y-2">
                {lowStockList.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full ${p.stockQuantity <= 0 ? "bg-destructive" : "bg-warning"}`}
                          style={{ width: `${Math.min(100, (p.stockQuantity / Math.max(p.minStockLevel, 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${p.stockQuantity <= 0 ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}>
                      {p.stockQuantity <= 0 ? "Out" : `${p.stockQuantity} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
