"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { BUSINESS_TYPES } from "@/lib/business-types";
import Select from "@/components/Select";

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          businessType: businessType || undefined,
          firstName,
          lastName,
          email,
          password,
          phone: phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      if (businessType) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = BUSINESS_TYPES.find((bt) => bt.value === businessType);

  return (
    <div className="w-full max-w-[440px] mx-4">
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
          Create your account
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Set up your company and start tracking compliance
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 stagger-children">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1.5">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Construction LLC"
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-slate-700 mb-1.5">
            Business Type
          </label>
          <Select
            value={businessType}
            onChange={(v) => setBusinessType(v)}
            placeholder="Select your trade"
            searchable
            options={BUSINESS_TYPES.map((bt) => ({
              value: bt.value,
              label: bt.label,
              description: bt.description,
            }))}
          />
          {selectedType && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {selectedType.complianceItems.length} compliance items will be suggested during setup
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              className="input-base"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
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
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="input-base"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center gap-2 mt-4 px-1 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <Lock className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your data is protected with AES-256 encryption and is only accessible to authorized users within your company. We never share your information externally.
          </p>
        </div>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8 animate-fade-in" style={{ animationDelay: "600ms" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
        >
          Sign in here
        </Link>
      </p>
    </div>
  );
}
