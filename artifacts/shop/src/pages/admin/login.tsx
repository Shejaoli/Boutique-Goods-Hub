import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen overflow-hidden relative">
      {/* Green top background */}
      <div className="absolute inset-0 bg-primary" />

      {/* White curved bottom section */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-[#f5f2ed]"
        style={{
          top: "42%",
          borderRadius: "50% 50% 0 0 / 7% 7% 0 0",
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start px-6 pt-14">
        {/* Logo area — sits in the green section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-xl">
            <span className="text-white font-serif font-bold text-2xl">G</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-wide">GreenBasket</h1>
          <p className="text-white/65 text-sm mt-1 tracking-wider uppercase">Admin Portal</p>
        </div>

        {/* Form — sits at the green/white transition and below */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* Email */}
          <div className="relative flex items-center">
            <div className="absolute left-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-white/80">
              <User className="w-5 h-5 text-white" />
            </div>
            <input
              type="email"
              placeholder="Username / Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full h-12 pl-14 pr-5 rounded-full bg-white shadow-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 border-0"
            />
          </div>

          {/* Password */}
          <div className="relative flex items-center">
            <div className="absolute left-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-white/80">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              className="w-full h-12 pl-14 pr-12 rounded-full bg-white shadow-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 border-0"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between px-1 pt-1">
            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${rememberMe ? "bg-primary border-primary" : "border-gray-400 bg-white"}`}>
                {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors select-none">Remember me</span>
            </label>
            <button type="button" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Forgot Password
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={adminLogin.isPending}
            className="w-full h-12 bg-primary text-white font-bold rounded-full text-base transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 shadow-lg mt-2"
          >
            {adminLogin.isPending ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/60 shadow-sm w-full max-w-sm">
          <p className="text-xs text-gray-500 text-center font-medium mb-1 uppercase tracking-wide">Demo Credentials</p>
          <p className="text-xs text-center text-gray-700 font-mono">admin@greenbasket.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
