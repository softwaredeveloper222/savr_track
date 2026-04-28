"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Eye,
  Server,
} from "lucide-react";

interface Preferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderDays: number[];
  escalationDays: number;
}

const REMINDER_OPTIONS = [
  { value: 30, label: "30 days before" },
  { value: 14, label: "14 days before" },
  { value: 7, label: "7 days before" },
  { value: 3, label: "3 days before" },
  { value: 1, label: "1 day before" },
  { value: 0, label: "Day of expiration" },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>({
    emailEnabled: true,
    smsEnabled: false,
    reminderDays: [30, 14, 7, 3, 1, 0],
    escalationDays: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<{ phone?: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [prefsRes, meRes] = await Promise.all([
          fetch("/api/notifications/preferences"),
          fetch("/api/auth/me"),
        ]);
        if (prefsRes.ok) {
          const data = await prefsRes.json();
          setPrefs({
            emailEnabled: data.emailEnabled,
            smsEnabled: data.smsEnabled,
            reminderDays: data.reminderDays,
            escalationDays: data.escalationDays,
          });
        }
        if (meRes.ok) {
          const data = await meRes.json();
          setUser(data.user ?? data);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  function toggleReminderDay(day: number) {
    setPrefs((prev) => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter((d) => d !== day)
        : [...prev.reminderDays, day].sort((a, b) => b - a),
    }));
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 shimmer rounded-lg w-48" />
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 shimmer rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your notification preferences
        </p>
      </div>

      {/* Notification Channels */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-semibold text-slate-900">Notification Channels</h2>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-500">Receive reminders via email</p>
              </div>
            </div>
            <button
              onClick={() => setPrefs((p) => ({ ...p, emailEnabled: !p.emailEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.emailEnabled ? "bg-teal-600" : "bg-slate-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                prefs.emailEnabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">SMS Notifications</p>
                <p className="text-xs text-slate-500">
                  {user?.phone
                    ? `Send to ${user.phone}`
                    : "Add a phone number to your profile first"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPrefs((p) => ({ ...p, smsEnabled: !p.smsEnabled }))}
              disabled={!user?.phone}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.smsEnabled ? "bg-teal-600" : "bg-slate-200"
              } ${!user?.phone ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                prefs.smsEnabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Schedule */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-semibold text-slate-900">Reminder Schedule</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Choose when you want to be reminded about upcoming deadlines.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REMINDER_OPTIONS.map((opt) => {
            const active = prefs.reminderDays.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleReminderDay(opt.value)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  active
                    ? "bg-teal-50 border-teal-200 text-teal-700"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  active ? "border-teal-600 bg-teal-600" : "border-slate-300"
                }`}>
                  {active && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Escalation */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-semibold text-slate-900">Escalation</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          When a deadline becomes overdue, how many days before escalating to the admin/manager?
        </p>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={14}
            value={prefs.escalationDays}
            onChange={(e) => setPrefs((p) => ({ ...p, escalationDays: parseInt(e.target.value) }))}
            className="flex-1 accent-teal-600"
          />
          <span className="text-sm font-bold text-slate-900 w-16 text-center bg-slate-50 rounded-lg py-1.5">
            {prefs.escalationDays} day{prefs.escalationDays !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-semibold text-slate-900">Privacy & Security</h2>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">AES-256 Encryption</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Every document you upload is encrypted using military-grade AES-256-GCM encryption before it is stored. Files are unreadable without your company's unique encryption key.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Eye className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Strict Company Isolation</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Your data is completely isolated. No one outside your company can view, access, or download your documents and compliance records. There is no external data sharing of any kind.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Server className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Complete Audit Trail</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Every document view, download, upload, and change is logged with timestamps and user attribution. You always know who accessed what and when.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
          <p className="text-sm text-teal-800 leading-relaxed">
            Documents and data remain private and are only accessible to authorized users within your company. If needed, data may be reviewed internally only to verify accuracy and prevent false alerts. Your information is never sold, shared, or made accessible to third parties.
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 animate-fade-in" style={{ animationDelay: "250ms" }}>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
