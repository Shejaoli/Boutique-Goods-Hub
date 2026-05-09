import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff } from "lucide-react";

function AdminIllustration() {
  return (
    <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      {/* Decorative circles */}
      <circle cx="160" cy="140" r="90" fill="#e8f5ed" />
      <circle cx="160" cy="140" r="60" fill="#d4ede0" opacity="0.6" />

      {/* Floating dots */}
      <circle cx="60" cy="60" r="5" fill="#c87f0a" />
      <circle cx="270" cy="80" r="4" fill="#1a5c34" opacity="0.4" />
      <circle cx="55" cy="200" r="8" fill="#f0f4f3" stroke="#1a5c34" strokeWidth="2" />
      <circle cx="285" cy="195" r="5" fill="#c87f0a" opacity="0.5" />
      <circle cx="100" cy="240" r="3" fill="#1a5c34" opacity="0.3" />

      {/* Dashed orbit */}
      <ellipse cx="155" cy="138" rx="75" ry="55" stroke="#a0c4b0" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />

      {/* Monitor base */}
      <rect x="95" y="165" width="130" height="8" rx="4" fill="#2d3a30" />
      <rect x="140" y="173" width="40" height="14" rx="2" fill="#2d3a30" />

      {/* Monitor body */}
      <rect x="85" y="100" width="150" height="70" rx="8" fill="#1e2d24" />
      <rect x="90" y="105" width="140" height="60" rx="5" fill="#c8e6d3" />

      {/* Screen content: user icon */}
      <circle cx="160" cy="125" r="14" fill="#1a5c34" opacity="0.15" />
      <circle cx="160" cy="120" r="7" fill="#1a5c34" opacity="0.7" />
      <path d="M145 137 Q160 128 175 137" stroke="#1a5c34" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* Lock badge on monitor */}
      <circle cx="188" cy="140" r="14" fill="#f5f2ed" stroke="#e0e0e0" strokeWidth="1" />
      <rect x="183" y="139" width="10" height="8" rx="2" fill="#c87f0a" />
      <path d="M183 139 Q183 133 188 133 Q193 133 193 139" stroke="#c87f0a" strokeWidth="2" fill="none" />

      {/* Shield */}
      <path d="M220 85 L235 90 L235 108 Q235 118 220 123 Q205 118 205 108 L205 90 Z" fill="#1a5c34" opacity="0.9" />
      <path d="M213 104 L218 110 L228 98" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Small decorative lines on screen */}
      <rect x="100" y="148" width="25" height="3" rx="1.5" fill="#1a5c34" opacity="0.2" />
      <rect x="100" y="153" width="18" height="3" rx="1.5" fill="#1a5c34" opacity="0.15" />
    </svg>
  );
}

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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eef2f0 0%, #e8f0ec 100%)" }}>

      {/* Bottom-left corner decoration */}
      <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64"
        style={{ background: "linear-gradient(135deg, #1a5c34 0%, #2d9e5f 100%)", borderRadius: "0 80px 0 0" }} />

      {/* Bottom-right corner decoration */}
      <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64"
        style={{ background: "linear-gradient(225deg, #c87f0a 0%, #e8a020 100%)", borderRadius: "80px 0 0 0" }} />

      {/* Top-left small accent */}
      <div className="absolute top-0 left-0 w-32 h-24 opacity-20"
        style={{ background: "#1a5c34", borderRadius: "0 0 60px 0" }} />

      {/* Logo above card */}
      <div className="relative z-10 flex flex-col items-center mb-6">
        <div className="flex gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary shadow-md" />
          <div className="w-8 h-8 rounded-full bg-accent shadow-md" />
          <div className="w-8 h-8 rounded-full bg-emerald-400 shadow-md" />
          <div className="w-8 h-8 rounded-full bg-amber-300 shadow-md" />
        </div>
        <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase">GreenBasket Admin</p>
      </div>

      {/* Main card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex overflow-hidden" style={{ minHeight: 360 }}>

        {/* Left — Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 p-8 relative"
          style={{ background: "linear-gradient(160deg, #f8fcfa 0%, #eef7f2 100%)" }}>

          {/* Decorative floating circles */}
          <div className="absolute top-6 left-6 w-3 h-3 rounded-full bg-accent opacity-70" />
          <div className="absolute top-10 right-10 w-2 h-2 rounded-full bg-primary opacity-40" />
          <div className="absolute bottom-8 left-8 w-5 h-5 rounded-full border-2 border-primary opacity-30" />
          <div className="absolute bottom-12 right-8 w-3 h-3 rounded-full bg-amber-300 opacity-60" />

          <AdminIllustration />

          <p className="mt-4 text-sm font-semibold text-primary/70 tracking-wide text-center">
            Secure Admin Access
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">GreenBasket Management Portal</p>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-px bg-gray-100 self-stretch my-6" />

        {/* Right — Form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-10">

          {/* Accent underline + title */}
          <div className="mb-6">
            <div className="w-8 h-0.5 bg-primary rounded-full mb-3" />
            <h1 className="text-xl font-bold text-gray-800">Login as Admin User</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <input
                type="email"
                placeholder="johndoe@xyz.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full h-12 pl-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="w-full h-12 pl-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={adminLogin.isPending}
              className="w-full h-12 bg-primary text-white font-bold rounded-xl text-sm tracking-widest uppercase transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 shadow-md hover:shadow-lg mt-2"
            >
              {adminLogin.isPending ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center space-y-0.5">
            <p className="text-xs text-gray-400">Forget your password?</p>
            <button className="text-xs font-semibold text-primary hover:underline transition-all">
              Get help Signed in.
            </button>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5 text-center">
            <p className="text-[11px] text-gray-500">
              <span className="font-semibold text-primary">Demo:</span> admin@greenbasket.com / admin123
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-gray-400">
            Terms of use.{" "}
            <span className="cursor-pointer hover:text-primary transition-colors">Privacy policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
