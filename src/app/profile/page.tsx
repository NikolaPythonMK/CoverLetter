// src/app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Notice = { type: "success" | "error"; text: string } | null;


type Profile = {
  name: string;
  email: string;
  plan: string;
  subscriptionStatus?: string | null;
  subscriptionRenewsAt?: string | null;
  hasSubscription?: boolean;

    managedByGoogle?: boolean;     // lock email + password when true
  emailEditable?: boolean;       // optional granular flag
  passwordEditable?: boolean;    // optional granular flag
  hasPassword?: boolean;         // whether a credentials password exists
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
      {children}
    </span>
  );
}

function InlineToast({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  const tone =
    notice.type === "success"
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-50"
      : "border-red-500/30 bg-red-500/15 text-red-50";

  return (
    // Top-center container (clears your h-16 navbar with top-20; tweak if needed)
    <div className="pointer-events-none fixed left-1/2 top-20 z-[100] -translate-x-1/2">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto mx-auto w-[min(95vw,36rem)] rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${tone}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-current/80" />
          <p className="flex-1">{notice.text}</p>
          <button
            onClick={onClose}
            className="ml-2 -mr-1 rounded-md px-2 text-white/70 hover:text-white/95"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  const passwordsMismatch =
  pwNext.trim().length > 0 &&
  pwConfirm.trim().length > 0 &&
  pwNext !== pwConfirm;



  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user", { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Failed");
        setData(j);
        setName(j.name ?? "");
        setEmail(j.email ?? "");
      } catch {
        alert("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
  if (!notice) return;
  const id = setTimeout(() => setNotice(null), 3500);
  return () => clearTimeout(id);
}, [notice]);

  async function refresh() {
    const r = await fetch("/api/user", { cache: "no-store" });
    setData(await r.json());
  }

  const renewText = useMemo(() => {
    if (!data?.subscriptionRenewsAt) return null;
    return new Date(data.subscriptionRenewsAt).toLocaleDateString();
  }, [data]);

  // Actions
const saveProfile = async () => {
  setSaving(true);
  try {
    const payload: any = { name };
    if (!data?.managedByGoogle) {
      payload.email = email;
    }
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "Failed to save profile");
    await refresh();
    setNotice?.({ type: "success", text: "Profile updated." });
  } catch (e: any) {
    setNotice?.({ type: "error", text: e.message || "Failed to save profile." });
  } finally {
    setSaving(false);
  }
};

const changePassword = async () => {
  if (!pwCurrent) { setNotice?.({ type: "error", text: "Enter your current password." }); return; }
  if (!pwNext || !pwConfirm) { setNotice?.({ type: "error", text: "Enter and confirm your new password." }); return; }
  if (pwNext.trim() !== pwConfirm.trim()) {
    setNotice?.({ type: "error", text: "New password and confirmation do not match." });
    return;
  }

  setPwSaving(true);
  try {
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: { current: pwCurrent, next: pwNext } }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "Failed to change password");

    setPwCurrent(""); setPwNext(""); setPwConfirm("");
    setNotice?.({ type: "success", text: "Password changed." });
  } catch (e: any) {
    setNotice?.({ type: "error", text: e.message || "Failed to change password." });
  } finally {
    setPwSaving(false);
  }
};



  const cancelSubscription = async () => {
    if (!confirm("Cancel at the end of the current billing period?")) return;
    setCanceling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Failed");
      await refresh();
      alert("Cancellation scheduled.");
    } catch (e: any) {
      alert(e.message || "Failed to cancel subscription.");
    } finally {
      setCanceling(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const j = await res.json();
      if (!res.ok || !j?.url) throw new Error(j?.error ?? "Failed");
      window.location.href = j.url;
    } catch (e: any) {
      alert(e.message || "Failed to open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      alert('Type DELETE (uppercase) to confirm.');
      return;
    }
    if (!confirm("This permanently deletes your account. Continue?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Failed");
      await signOut({ callbackUrl: "/" });
    } catch (e: any) {
      alert(e.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  // Loading states
  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-white/70">
        <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin" />
        Loading profile…
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-white">
        <h1 className="mb-2 text-3xl font-semibold">Your Profile</h1>
        <p className="mb-6 text-white/70">Please log in to manage your account.</p>
        <a href="/login"><Button>Go to login</Button></a>
      </div>
    );
  }

  // UI styled to match your Generate page
  return (
    <div className="relative">
        {/* Toast */}
<InlineToast notice={notice} onClose={() => setNotice(null)} />

      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-[6%] h-[420px] w-[420px] rounded-full opacity-25 blur-3xl [background:radial-gradient(closest-side,rgba(99,102,241,0.25),transparent_65%)]" />
        <div className="absolute right-[5%] top-[18%] h-[380px] w-[380px] rounded-full opacity-20 blur-3xl [background:radial-gradient(closest-side,rgba(56,189,248,0.22),transparent_60%)]" />
      </div>

<section className="relative">
  {/* background accents (unchanged) */}
  <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute left-[8%] top-[6%] h-[420px] w-[420px] rounded-full opacity-25 blur-3xl [background:radial-gradient(closest-side,rgba(99,102,241,0.25),transparent_65%)]" />
    <div className="absolute right-[5%] top-[18%] h-[380px] w-[380px] rounded-full opacity-20 blur-3xl [background:radial-gradient(closest-side,rgba(56,189,248,0.22),transparent_60%)]" />
  </div>

  <div className="container mx-auto px-4 py-8">
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Account &amp; Billing</h1>
        <p className="mt-1 text-sm text-white/60">Manage your subscription, profile and security.</p>
      </div>

      {/* GRID LAYOUT: sticky sidebar + fluid main */}
      <div className="grid gap-6 lg:grid-cols-[340px,minmax(0,1fr)] xl:grid-cols-[380px,minmax(0,1fr)]">
        {/* SIDEBAR (Subscription + Danger) */}
        <aside className="self-start space-y-5 lg:sticky lg:top-24">
          {/* === Subscription card (unchanged content) === */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Subscription</h2>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {(data?.plan?.toUpperCase() ?? "FREE")}
              </span>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Status</span>
                <span className="uppercase">
                  {data?.subscriptionStatus ?? (data?.plan === "free" ? "—" : "active")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Renews</span>
                <span>{renewText ?? (data?.plan === "free" ? "—" : "N/A")}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={openBillingPortal}
                disabled={portalLoading || !data?.hasSubscription}
                variant="outline"
                className="rounded-full border-white/20 bg-white/10 text-white hover:opacity-90 disabled:opacity-60"
                title={!data?.hasSubscription ? "No active subscription" : "Open billing portal"}
              >
                {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Manage billing
              </Button>

              <Button
                type="button"
                onClick={cancelSubscription}
                disabled={canceling || data?.plan === "free"}
                className="rounded-full bg-red-500 px-5 text-white hover:opacity-90 disabled:opacity-60"
                title={data?.plan === "free" ? "You're on the free plan" : "Cancel at period end"}
              >
                {canceling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel subscription
              </Button>
            </div>
          </div>

          {/* === Danger Zone (unchanged content) === */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-white/85 backdrop-blur-md">
            <h2 className="mb-2 text-lg font-semibold text-white">Danger zone</h2>
            <p className="mb-3 text-sm text-white/70">
              This will permanently delete your account and all associated data.
            </p>
            <div className="space-y-3">
              <label className="text-xs text-white/70">
                Type <span className="font-mono text-white">DELETE</span> to confirm
              </label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="bg-white/5 text-white placeholder:text-white/40"
              />
              <Button
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
                className="rounded-full bg-red-600 px-5 text-white hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete my account
              </Button>
            </div>
          </div>
        </aside>

        {/* MAIN (Profile + Security) */}
        <main className="space-y-6">
          {/* === Profile (unchanged content) === */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <label className="text-sm font-medium text-white">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-2 bg-white/5 text-white placeholder:text-white/40"
            />

            <div className="mt-4">
              <label className="text-sm font-medium text-white">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 bg-white/5 text-white placeholder:text-white/40"
                disabled={!!data?.managedByGoogle}
              />
              {data?.managedByGoogle && (
  <p className="mt-2 text-xs text-white/60">
    Email is managed by Google and can’t be changed here.
  </p>
)}
            </div>

            <div className="mt-5">
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </div>

          {/* === Security (unchanged content) === */}
    {/* Security / Password */}
{/* Security / Password */}
{data?.managedByGoogle ? (
  // Google-managed: no password changes
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
    <h2 className="mb-1 text-lg font-semibold text-white">Security</h2>
    <p className="text-sm text-white/70">
      This account uses <span className="font-medium text-white">Google&nbsp;Sign-In</span>.
      Changing password is disabled.
    </p>
  </div>
) : (
  // Non-Google: require current + new + confirm
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
    <h2 className="mb-3 text-lg font-semibold text-white">Change password</h2>

    <label className="text-sm text-white">Current password</label>
    <Input
      type="password"
      autoComplete="current-password"
      value={pwCurrent}
      onChange={(e) => setPwCurrent(e.target.value)}
      className="mt-2 bg-white/5 text-white placeholder:text-white/40"
    />

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="text-sm text-white">New password</label>
        <Input
          type="password"
          autoComplete="new-password"
          value={pwNext}
          onChange={(e) => setPwNext(e.target.value)}
          className={`mt-2 bg-white/5 text-white placeholder:text-white/40 ${
            passwordsMismatch ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
          aria-invalid={passwordsMismatch || undefined}
          aria-describedby={passwordsMismatch ? "pw-mismatch" : undefined}
        />
      </div>
      <div>
        <label className="text-sm text-white">Confirm new password</label>
        <Input
          type="password"
          autoComplete="new-password"
          value={pwConfirm}
          onChange={(e) => setPwConfirm(e.target.value)}
          className={`mt-2 bg-white/5 text-white placeholder:text-white/40 ${
            passwordsMismatch ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
          aria-invalid={passwordsMismatch || undefined}
          aria-describedby={passwordsMismatch ? "pw-mismatch" : undefined}
        />
        {passwordsMismatch && (
          <p id="pw-mismatch" className="mt-2 text-xs text-red-400">
            Passwords don’t match.
          </p>
        )}
      </div>
    </div>

    <div className="mt-5">
      <Button
        onClick={changePassword}
        disabled={
          pwSaving ||
          !pwCurrent ||
          !pwNext ||
          !pwConfirm ||
          passwordsMismatch
        }
        variant="outline"
        className="rounded-full border-white/20 bg-white/10 text-white hover:opacity-90 disabled:opacity-60"
      >
        {pwSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Change password
      </Button>
    </div>
  </div>
)}



        </main>
      </div>
    </div>
  </div>
</section>

    </div>
  );
}
