import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";

// Customer Pages (no login required)
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/products/[id]";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Wishlist from "@/pages/wishlist";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/orders/[id]";

// Admin Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/index";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminCustomers from "@/pages/admin/customers";
import AdminSuppliers from "@/pages/admin/suppliers";
import AdminExpenses from "@/pages/admin/expenses";
import AdminStaff from "@/pages/admin/staff";
import AdminPromo from "@/pages/admin/promo";
import AdminReports from "@/pages/admin/reports";

import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Admin auth only */}
      <Route path="/admin/login" component={AdminLogin} />

      {/* Admin panel */}
      <Route path="/admin" nest>
        <AdminLayout>
          <Switch>
            <Route path="/" component={AdminDashboard} />
            <Route path="/products" component={AdminProducts} />
            <Route path="/orders" component={AdminOrders} />
            <Route path="/customers" component={AdminCustomers} />
            <Route path="/suppliers" component={AdminSuppliers} />
            <Route path="/expenses" component={AdminExpenses} />
            <Route path="/staff" component={AdminStaff} />
            <Route path="/promo" component={AdminPromo} />
            <Route path="/reports" component={AdminReports} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      {/* Customer storefront — no login needed */}
      <Route path="/" nest>
        <MainLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/products" component={Products} />
            <Route path="/products/:id" component={ProductDetail} />
            <Route path="/cart" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/wishlist" component={Wishlist} />
            <Route path="/orders" component={Orders} />
            <Route path="/orders/:id" component={OrderDetail} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
