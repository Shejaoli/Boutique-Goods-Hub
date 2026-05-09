import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const adminLogin = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminLogin.mutate({ data: form }, {
      onSuccess: (data: { token: string; user: Parameters<typeof login>[1] }) => {
        login(data.token, data.user);
        navigate("/admin");
      },
      onError: () => toast({ title: "Invalid credentials or not an admin account", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top green curved section */}
      <div className="bg-primary relative flex-shrink-0" style={{ paddingBottom: "80px" }}>
        <div className="text-center pt-14 pb-4 px-4">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-serif font-bold text-2xl">G</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white">GreenBasket</h1>
          <p className="text-white/70 text-sm mt-1">Admin Portal</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-background" style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />
      </div>

      {/* Login card */}
      <div className="flex-1 bg-background flex items-start justify-center px-4 pt-0">
        <div className="w-full max-w-sm -mt-2">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
            <h2 className="font-serif text-xl font-bold text-foreground mb-5 text-center">Sign in to your account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center bg-primary/10 rounded-l-xl border border-primary/20">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full h-11 pl-12 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center bg-primary/10 rounded-l-xl border border-primary/20">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className="w-full h-11 pl-12 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={adminLogin.isPending}
                className="w-full h-11 bg-primary text-white font-semibold rounded-full text-base transition-all hover:bg-primary/90 active:scale-98 disabled:opacity-60 mt-2"
              >
                {adminLogin.isPending ? "Signing in..." : "Login"}
              </button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Forgot password? Contact your administrator.
            </p>
          </div>

          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground text-center font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-center text-foreground">admin@greenbasket.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
