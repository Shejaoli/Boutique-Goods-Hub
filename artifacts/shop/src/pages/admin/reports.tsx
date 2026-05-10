import { useGetRevenueChart, useGetTopProducts, useGetPaymentMethodBreakdown, useGetDashboardStats, useListExpenses, getGetRevenueChartQueryKey, getGetTopProductsQueryKey, getGetPaymentMethodBreakdownQueryKey, getGetDashboardStatsQueryKey, getListExpensesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#1a5c34", "#c87f0a", "#2d9e5f", "#e8a020", "#d94040"];

type Stats = { weekRevenue: number; monthExpenses: number; totalOrders: number; totalProducts: number; totalCustomers: number };
type TopProduct = { productId: number; productName: string; imageUrl?: string | null; quantity: number; revenue: number };

export default function AdminReportsPage() {
  const { token } = useAuth();

  const { data: revenue, isLoading: revLoading } = useGetRevenueChart({ days: 7 }, { query: { enabled: !!token, queryKey: getGetRevenueChartQueryKey({ days: 7 }) } });
  const { data: topProducts } = useGetTopProducts({ query: { enabled: !!token, queryKey: getGetTopProductsQueryKey() } });
  const { data: payMethods } = useGetPaymentMethodBreakdown({ query: { enabled: !!token, queryKey: getGetPaymentMethodBreakdownQueryKey() } });
  const { data: stats } = useGetDashboardStats({ query: { enabled: !!token, queryKey: getGetDashboardStatsQueryKey() } });
  const { data: expenses } = useListExpenses({ month: new Date().toISOString().slice(0, 7) }, { query: { enabled: !!token, queryKey: getListExpensesQueryKey({ month: new Date().toISOString().slice(0, 7) }) } });

  const revenueData = (revenue as { date: string; revenue: number; orders: number }[] | undefined) ?? [];
  const topProds = (topProducts as TopProduct[] | undefined) ?? [];
  const payData = (payMethods as { method: string; count: number; total: number }[] | undefined) ?? [];
  const s = stats as Stats | undefined;
  const expList = (expenses as { amount: number }[] | undefined) ?? [];
  const totalExpenses = expList.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const profit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">Business performance overview</p>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "7-Day Revenue", value: `RWF ${totalRevenue.toLocaleString()}`, color: "text-success" },
          { label: "Month Expenses", value: `RWF ${totalExpenses.toLocaleString()}`, color: "text-destructive" },
          { label: "Net Profit", value: `RWF ${profit.toLocaleString()}`, color: profit >= 0 ? "text-success" : "text-destructive" },
          { label: "Total Orders", value: String(s?.totalOrders ?? 0), color: "text-primary" },
        ].map(k => (
          <div key={k.label} className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h2 className="font-semibold mb-4">7-Day Revenue Trend</h2>
        {revLoading ? <Skeleton className="h-52 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString("en-GB", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `RWF ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, n: string) => [`RWF ${v.toLocaleString()}`, n === "revenue" ? "Revenue" : "Orders"]} labelFormatter={d => new Date(d).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })} />
              <Bar dataKey="revenue" fill="#1a5c34" radius={[6, 6, 0, 0]} name="revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold">Top 5 Products by Revenue</h2>
          </div>
          <div className="divide-y divide-border">
            {topProds.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No sales data yet</p>
            ) : topProds.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3 px-4 py-3">
                <span className="text-muted-foreground text-sm font-bold w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10"><span className="text-xs font-serif text-primary">{p.productName[0]}</span></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.productName}</p>
                  <p className="text-xs text-muted-foreground">{p.quantity} units sold</p>
                </div>
                <span className="font-bold text-sm text-primary">RWF {p.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h2 className="font-semibold mb-4">Payment Method Breakdown</h2>
          {payData.filter(d => d.count > 0).length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No payment data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={payData.filter(d => d.count > 0)} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={70} labelLine={false}>
                    {payData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name.replace(/_/g, " ")]} />
                  <Legend formatter={v => v.replace(/_/g, " ")} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {payData.filter(d => d.count > 0).map(d => (
                  <div key={d.method} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{d.method.replace(/_/g, " ")}</span>
                    <span className="font-semibold">RWF {d.total.toLocaleString()} ({d.count} orders)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
