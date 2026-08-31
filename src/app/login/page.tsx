"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/* ---- Fullscreen loading overlay ---- */
function PageOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-md"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-5 rounded-2xl border border-white/15 bg-white/10 px-10 py-8 text-white shadow-2xl">
        <Loader2 className="h-14 w-14 animate-spin" />
        <span className="text-xl font-semibold tracking-wide">
          {label ?? "Working…"}
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/generator"; // default to /generator

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    try {
      setLoading(true);
      if (mode === "register") {
        const r = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await r.json();
        if (!r.ok) {
          setErr(data?.error || "Failed to register");
          return;
        }
        // Switch to login; keep user on page
        setMode("login");
      } else {
        // Credentials sign-in; will redirect if successful
        await signIn("credentials", {
          email,
          password,
          redirect: true,
          callbackUrl,
        });
        // If redirect fails, we'll fall through and clear loading below
      }
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      // For OAuth we don't reach here because we trigger a navigation immediately.
      setLoading(false);
    }
  };

  const oauth = (provider: "google" | "apple") => {
    setErr(null);
    setLoading(true);
    // NextAuth redirects by default; no need to await
    void signIn(provider, { callbackUrl });
  };

  const overlayLabel =
    mode === "login" ? "Signing you in…" : "Creating your account…";

  return (
    <>
      {/* Overlay tied to loading */}
      <PageOverlay show={loading} label={overlayLabel} />

      <div
        className="relative mx-auto flex w-full max-w-[440px] flex-col items-center px-4 py-10 sm:py-16"
        aria-busy={loading}
      >
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {mode === "login" ? "Sign in to continue" : "It takes less than a minute"}
            </p>
          </div>

          {/* OAuth */}
          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
              onClick={() => oauth("google")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
              onClick={() => oauth("apple")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AppleIcon className="mr-2 h-4 w-4" />
              )}
              Continue with Apple
            </Button>
          </div>

          {/* Inline separator */}
          <div className="my-6 flex items-center">
            <div className="h-px flex-1 bg-white/15" />
            <span className="mx-3 text-xs uppercase tracking-wide text-white/60">or</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          {/* Email form */}
          <form className="grid gap-4" onSubmit={submit} noValidate>
            {mode === "register" && (
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-white">
                  Full name
                </label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="bg-white/20 text-white placeholder:text-white/70 border-white/20 focus:ring-2 focus:ring-fuchsia-400/60"
                  disabled={loading}
                />
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-white">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-white/20 text-white placeholder:text-white/70 border-white/20 focus:ring-2 focus:ring-fuchsia-400/60"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium text-white">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  className="bg-white/20 text-white placeholder:text-white/70 border-white/20 focus:ring-2 focus:ring-fuchsia-400/60 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center p-2 text-white/70 hover:text-white disabled:opacity-60"
                  onClick={() => setShowPw((s) => !s)}
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {err && (
              <p className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300" aria-live="polite">
                {err}
              </p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow-md hover:from-indigo-600 hover:to-blue-700 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-white/70">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  className="font-medium text-sky-300 underline-offset-4 hover:underline disabled:opacity-60"
                  onClick={() => setMode("register")}
                  disabled={loading}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="font-medium text-sky-300 underline-offset-4 hover:underline disabled:opacity-60"
                  onClick={() => setMode("login")}
                  disabled={loading}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/60">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </>
  );
}

/* ---- Minimal SVG icons (no external deps) ---- */
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21.35 11.1H12v2.9h5.32c-.23 1.49-1.79 4.36-5.32 4.36-3.21 0-5.82-2.66-5.82-5.95S8.79 6.45 12 6.45c1.83 0 3.07.78 3.77 1.46l2.57-2.48C16.86 3.6 14.66 2.7 12 2.7 6.98 2.7 2.9 6.78 2.9 11.8S6.98 20.9 12 20.9c6.24 0 8.35-4.38 8.35-7.3 0-.49-.05-.82-.1-1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M16.365 13.475c.03 3.206 2.809 4.273 2.842 4.287-.024.077-.444 1.521-1.472 3.017-0.887 1.3-1.807 2.593-3.255 2.617-1.426.025-1.885-.845-3.516-.845-1.631 0-2.134.819-3.476.87-1.399.05-2.464-1.407-3.356-2.702-1.829-2.67-3.224-7.54-1.349-10.832.932-1.61 2.597-2.63 4.426-2.655 1.382-.026 2.688.915 3.516.915.828 0 2.421-1.126 4.084-.961.696.029 2.651.282 3.913 2.12-.102.065-2.33 1.359-2.27 4.168zM13.85 3.75c.743-.9 1.247-2.157 1.108-3.4-1.073.043-2.381.737-3.155 1.636-.695.805-1.302 2.09-1.14 3.328 1.204.093 2.444-.607 3.187-1.564z"
        fill="currentColor"
      />
    </svg>
  );
}
