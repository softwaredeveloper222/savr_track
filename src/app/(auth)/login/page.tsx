"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password. Please try again.");
        return;
      }

      // Superadmins go to the platform area
      if (data.user?.role === "superadmin") {
        router.push("/platform");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-4">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-8 lg:hidden animate-fade-in">
        <div className="w-10 h-10 rounded-xl compliance-gradient flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Surevia</h1>
          <p className="text-xs text-slate-500">Compliance Management</p>
        </div>
      </div>

      <div className="mb-8 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Sign in to access your compliance dashboard
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 stagger-children">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="input-base"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="input-base"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center gap-2 mt-4 px-1 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <Lock className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Secured with encrypted sessions. Your credentials and data are fully protected.
          </p>
        </div>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
        >
          Create one here
        </Link>
      </p>
    </div>
  );
}
