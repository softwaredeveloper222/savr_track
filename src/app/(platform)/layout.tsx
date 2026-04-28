"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldCheck,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Crown,
} from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const navItems = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/users", label: "All Users", icon: Users },
  { href: "/platform/companies", label: "Companies", icon: Building2 },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        const userData = data.user ?? data;

        // Only superadmins can access this layout — others go to /dashboard
        if (userData.role !== "superadmin") {
          router.replace("/dashboard");
          return;
        }

        setUser(userData);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // proceed
    }
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f1c]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-700 border-t-amber-500" />
          <p className="text-xs text-slate-400">Loading platform...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#0a0f1c] transition-transform duration-300 ease-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20">
              <Crown className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight">
                Surevia
              </h1>
              <p className="text-[10px] text-amber-500/70 font-medium uppercase tracking-wider">
                Platform Admin
              </p>
            </div>
          </div>
          <button
            className="text-slate-500 hover:text-white lg:hidden transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status badge */}
        <div className="mx-4 mb-4 px-3 py-2.5 rounded-lg bg-amber-600/10 border border-amber-600/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Super Admin
            </p>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Cross-company management
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/platform" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-amber-600/15 text-amber-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }
                `}
              >
                <Icon size={17} className={isActive ? "text-amber-400" : ""} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-amber-500/60" />}
              </a>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-white/5 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-[11px] font-bold text-white shadow-sm">
              {getInitials(`${user.firstName} ${user.lastName}`)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-amber-500/70">Superadmin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 lg:hidden shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 p-1"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <Crown className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Platform Admin</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f8fafb]">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
