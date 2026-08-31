"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { status } = useSession();

  // Hydration-safe flags
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAuthed = mounted && status === "authenticated";

  // Close menu on route click (client-side)
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-md">
      {/* Make the bar a positioning context for the absolute menu */}
      <div className="relative container mx-auto flex h-16 items-center justify-between px-4 text-white">
        {/* Brand */}
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent sm:text-xl"
          onClick={closeMenu}
        >
          CoverlyAI
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          <Link href="/blog" className="text-sm text-white/70 hover:text-white">
            Blog
          </Link>
          <Link href="/generator" className="text-sm text-white/70 hover:text-white">
            Generate
          </Link>
          <Link href="/dashboard" className="text-sm text-white/70 hover:text-white">
            Dashboard
          </Link>

          {/* NEW: Profile (only when authed) */}
          {isAuthed && (
            <Link href="/profile" className="text-sm text-white/70 hover:text-white">
              Profile
            </Link>
          )}

          {/* ⬇️ Pricing points to '/' with #pricing */}
          <Link href={{ pathname: "/", hash: "pricing" }}>
            <Button
              variant="secondary"
              className="hidden border-white/20 bg-white/10 text-white hover:bg-white/20 lg:inline-flex"
            >
              Pricing
            </Button>
          </Link>

          {!mounted || status === "loading" ? (
            <div className="h-9 w-24 rounded-md bg-white/20 animate-pulse" />
          ) : isAuthed ? (
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow-md hover:from-indigo-600 hover:to-blue-700 transition"
            >
              Sign out
            </Button>
          ) : (
            <Link href="/login">
              <Button className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow-md hover:from-indigo-600 hover:to-blue-700 transition">
                Sign in
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-white/80 hover:text-white md:hidden"
          aria-label="Open menu"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <span className="sr-only">Menu</span>
          {/* Hamburger / Close icon */}
          <div className="relative h-5 w-6">
            <span
              className={`absolute inset-x-0 top-1 h-0.5 bg-current transition-transform duration-200 ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute inset-x-0 top-2.5 h-0.5 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute inset-x-0 top-4 h-0.5 bg-current transition-transform duration-200 ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </div>
        </button>

        {/* Mobile menu panel (absolute so it doesn't push content) */}
        <div
          id="mobile-menu"
          className={`md:hidden absolute left-0 right-0 top-full z-40 origin-top transform transition duration-200 ${
            open ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-95 opacity-0"
          }`}
          style={{ transformOrigin: "top", background: "rgba(90,0,180,0.25)" }}
        >
          {/* Only add blur/bg when open to avoid “blurry space” */}
          <div
            className="border-t border-white/10"
            style={{
              background:
                "radial-gradient(1200px 600px at 10% 10%, rgba(90,0,180,0.25), transparent 65%), radial-gradient(1000px 500px at 90% 20%, rgba(0,160,255,0.22), transparent 60%), radial-gradient(900px 600px at 40% 90%, rgba(0,255,200,0.18), transparent 60%), linear-gradient(180deg, #070917 0%, #0a0f2a 45%, #0b0e1f 100%)",
            }}
          >
            <nav className="flex flex-col gap-1 px-4 py-3 text-sm text-white/90">
              <Link href="/blog" className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={closeMenu}>
                Blog
              </Link>
              <Link href="/generator" className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={closeMenu}>
                Generate
              </Link>
              <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={closeMenu}>
                Dashboard
              </Link>

              {/* NEW: Profile (only when authed) */}
              {isAuthed && (
                <Link href="/profile" className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={closeMenu}>
                  Profile
                </Link>
              )}

              {/* ⬇️ Pricing to '/#pricing' on mobile too */}
              <Link
                href={{ pathname: "/", hash: "pricing" }}
                className="rounded-lg px-3 py-2 hover:bg-white/10"
                onClick={closeMenu}
              >
                Pricing
              </Link>

              {/* Auth actions */}
              <div className="mt-2 flex gap-2 px-1">
                {!mounted || status === "loading" ? (
                  <div className="h-9 w-24 rounded-md bg-white/20 animate-pulse" />
                ) : isAuthed ? (
                  <Button
                    onClick={() => {
                      closeMenu();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow-md hover:from-indigo-600 hover:to-blue-700 transition"
                  >
                    Sign out
                  </Button>
                ) : (
                  <Link href="/login" className="flex-1" onClick={closeMenu}>
                    <Button className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow-md hover:from-indigo-600 hover:to-blue-700 transition">
                      Sign in
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
