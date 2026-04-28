"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Calendar,
  Users,
  Activity,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  ClipboardCheck,
  Settings,
} from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company?: {
    id: string;
    name: string;
    businessType?: string;
    onboardingCompleted?: boolean;
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/review", label: "Review Queue", icon: ClipboardCheck },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/team", label: "Team", icon: Users },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardLayout({
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

        // Superadmins go to the platform area, not the dashboard
        if (userData.role === "superadmin") {
          router.replace("/platform");
          return;
        }

        setUser(userData);

        if (
          userData.company?.businessType &&
          !userData.company?.onboardingCompleted &&
          !window.location.pathname.includes("/onboarding")
        ) {
          router.replace("/onboarding");
          return;
        }
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
      // proceed to redirect regardless
    }
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600" />
          <p className="text-xs text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
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
          fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#0f1a2e] transition-transform duration-300 ease-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
              <ShieldCheck className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight">
                Surevia
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Compliance
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

        {/* Company name */}
        {user.company && (
          <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs font-medium text-slate-400 truncate">
              {user.company.name}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
                      ? "bg-teal-600/15 text-teal-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }
                `}
              >
                <Icon size={17} className={isActive ? "text-teal-400" : ""} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-teal-500/60" />}
              </a>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-white/5 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-[11px] font-bold text-white shadow-sm">
              {getInitials(`${user.firstName} ${user.lastName}`)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">{user.role}</p>
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
            <div className="w-7 h-7 rounded-lg compliance-gradient flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Surevia</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f8fafb]">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
