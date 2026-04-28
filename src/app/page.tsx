"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const userData = data.user ?? data;
          if (userData.role === "superadmin") {
            router.replace("/platform");
          } else {
            router.replace("/dashboard");
          }
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen auth-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl compliance-gradient flex items-center justify-center shadow-lg">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Surevia
        </h1>
        <p className="text-sm text-slate-500">
          Compliance Management Platform
        </p>
        <div className="mt-6">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600" />
        </div>
      </div>
    </div>
  );
}
