import { ShieldCheck, Lock, Eye, Server } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] compliance-gradient relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Decorative shapes — animated */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 animate-float" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3 animate-float" style={{ animationDelay: "3s" }} />

        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Surevia</span>
          </div>
          <p className="text-teal-200/80 text-sm">
            Compliance Management Platform
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-3xl font-bold leading-tight">
              Stay compliant.<br />
              Stay ahead.
            </h2>
            <p className="mt-4 text-teal-100/80 text-sm leading-relaxed max-w-sm">
              Track every license, certification, and insurance deadline in one place.
              Built specifically for contractors who can&apos;t afford to miss a compliance date.
            </p>
          </div>

          <div className="stagger-children">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm text-white font-medium">AES-256 Encrypted Storage</span>
                <p className="text-xs text-teal-200/60">Every document is encrypted at rest</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm text-white font-medium">Company-Only Access</span>
                <p className="text-xs text-teal-200/60">Your data is never shared externally</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm text-white font-medium">Full Audit Trail</span>
                <p className="text-xs text-teal-200/60">Every access and change is logged</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-fade-in" style={{ animationDelay: "700ms" }}>
          <p className="text-xs text-teal-200/50">
            Trusted by contractors nationwide
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 auth-bg">
        <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
