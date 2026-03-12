"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Clock, Calendar, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Login() {
  const [data, setData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSessionWithRole = useCallback(async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const session = await getSession();
      if (session?.user?.role) return session;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return getSession();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      username: data.username.trim(),
      password: data.password,
    });

    if (res?.error) {
      console.log("SignIn Error", res.error);
      toast.error(t.somethingWentWrong);
      setLoading(false);
    } else {
      const session = await getSessionWithRole();
      const role = session?.user?.role;

      if (role?.toLowerCase() === "admin") {
        router.push(`/admin/?adminId=${session?.user?.id}`);
      } else if (role?.toLowerCase() === "dev" || role?.toLowerCase() === "employee") {
        router.push(`/developer/${session?.user?.id}`);
      } else {
        toast.error(t.noValidRole);
        setLoading(false);
      }
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1a3a5c] to-[#244B77]">
        {/* Animated geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#3d6a9f]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#244B77]/30 rounded-full blur-3xl" />
        </div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Floating icons decoration */}
        <div className="absolute top-20 left-20 text-white/5">
          <Clock className="w-24 h-24" />
        </div>
        <div className="absolute bottom-20 right-20 text-white/5">
          <Calendar className="w-32 h-32" />
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold text-white tracking-tight transition-all duration-500 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            DELA<span className="text-cyan-400">tech</span>
          </h1>
          <p className={`mt-2 text-lg text-slate-300 font-light tracking-wide transition-all duration-500 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {t.timeBookingSystem}
          </p>
        </div>

        {/* Login Card */}
        <div className={`backdrop-blur-xl bg-white/[0.08] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20 transition-all duration-500 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">{t.welcomeBack}</h2>
            <p className="text-slate-400 mt-1">{t.signInToContinue}</p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                {t.username}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={data.username}
                onChange={handleChange}
                placeholder="johndoe"
                autoComplete="username"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                {t.password}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={data.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.signingIn}</span>
                </>
              ) : (
                t.signIn
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className={`text-center mt-8 text-sm text-slate-500 transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          © {new Date().getFullYear()} DELAtech. {t.allRightsReserved}
        </p>
      </div>
    </div>
  );
}
