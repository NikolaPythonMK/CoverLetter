"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Pricing from "@/components/pricing";
import { useCallback, useState } from "react";

export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
              <span>✨ New</span>
              <span className="text-white/60">Smarter role-matching & ATS feedback</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Write cover letters that{" "}
              <span className="bg-gradient-to-r from-fuchsia-400 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
                get interviews.
              </span>
            </h1>

            <p className="text-lg text-white/80">
              Paste the job post and your resume. Our AI turns them into a
              tailored, ATS-ready cover letter in seconds—clear, personal, and
              on-point for the role.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/generator">
                {/* GitHub-like big green button */}
                <Button
                  size="lg"
                  className="rounded-full !bg-[#2c974b] px-8 py-5 text-base font-semibold text-white shadow-md ring-1 ring-black/10 hover:!bg-[#2c974b] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-[1px]"
                >
                  Generate my cover letter
                </Button>
              </Link>
              <Link href="#pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/20 bg-white/10 px-8 py-5 text-base text-white hover:bg-white/20"
                >
                  See pricing
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span>Free plan: 3 letters/month</span>
              <span className="hidden h-4 w-px bg-white/20 sm:inline-block" />
              <span>No credit card required</span>
              <span className="hidden h-4 w-px bg-white/20 sm:inline-block" />
              <span>Export to PDF & Library</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-sm text-white/70 sm:grid-cols-3">
              <div>✅ ATS-optimized</div>
              <div>✅ Role-specific</div>
              <div>✅ Tone control</div>
              <div>✅ One-click edits</div>
              <div>✅ PDF export</div>
              <div>✅ Save & reuse</div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden md:block">
            <div className="absolute -inset-8 -z-10 rounded-3xl opacity-40 blur-3xl [background:radial-gradient(circle_at_center,rgba(99,102,241,0.45),transparent_60%)]" />
            <Image
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1400&auto=format&fit=crop"
              alt="Preview of a polished cover letter"
              width={800}
              height={600}
              className="rounded-2xl border border-white/10 shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ===== TRUST / BADGES ===== */}
      <section className="container mx-auto px-4 pb-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 text-xs text-white/60 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">GDPR-friendly</div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">ATS-aware structure</div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">Export as PDF</div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">No fluff, just results</div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-white">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <CardStep
            step="1"
            title="Drop in your inputs"
            text="Paste the job post and your resume (or summary). Choose tone and seniority to match your voice."
          />
          <CardStep
            step="2"
            title="AI drafts your letter"
            text="We align your skills with the role, highlight impact, and keep it ATS-friendly and concise."
          />
          <CardStep
            step="3"
            title="Tweak & export"
            text="Edit in place, add bullets, change tone, then export to PDF or save to your library."
          />
        </div>
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <ValueCard
            title="Tailored for every role"
            text="Each letter is mapped to the posting—keywords, responsibilities, and impact—so it reads relevant, not generic."
          />
          <ValueCard
            title="Human voice, professional tone"
            text="Pick confident, friendly, or formal. Keep your style while sounding polished and concise."
          />
          <ValueCard
            title="Built-in best practices"
            text="Clear structure, strong opening, achievement bullets, and a decisive close—no templates to wrestle with."
          />
        </div>
      </section>

      {/* ===== SOCIAL PROOF (Marquee) ===== */}
      {/* ===== SOCIAL PROOF (Marquee) ===== */}
      <section className="container mx-auto px-4 pb-16">
        <h3 className="mb-4 text-xl font-semibold text-white">Loved by job seekers worldwide</h3>
        <ReviewsMarquee
          items={[
            { quote: "I landed two interviews in a week. It sounded like me—just sharper and focused on impact.", name: "Ana",   emoji: "🚀", avatar: "https://ui-avatars.com/api/?name=Ana&background=7c3aed&color=fff" },
            { quote: "Fast and professional. The first paragraph hooked the recruiter immediately.",                name: "Marko", emoji: "🎯", avatar: "https://ui-avatars.com/api/?name=Marko&background=06b6d4&color=fff" },
            { quote: "Time saver. I can apply in minutes without losing quality.",                                  name: "Elena", emoji: "⏱️", avatar: "https://ui-avatars.com/api/?name=Elena&background=22c55e&color=fff" },
            { quote: "Tone sliders are clutch—I set it to 'confident' and it felt natural, not robotic.",           name: "Jovan", emoji: "🗣️", avatar: "https://ui-avatars.com/api/?name=Jovan&background=f59e0b&color=fff" },
            { quote: "It mapped my projects to the role and highlighted measurable results.",                        name: "Sara",  emoji: "📈", avatar: "https://ui-avatars.com/api/?name=Sara&background=ef4444&color=fff" },
            { quote: "No more writer’s block. Paste, refine, export to PDF—done.",                                  name: "Petar", emoji: "🧠", avatar: "https://ui-avatars.com/api/?name=Petar&background=3b82f6&color=fff" },
            { quote: "Got callbacks from teams that previously ghosted me—huge difference.",                        name: "Ivana", emoji: "📬", avatar: "https://ui-avatars.com/api/?name=Ivana&background=84cc16&color=fff" },
            { quote: "Clean structure, strong opening, decisive close. Exactly what I needed.",                     name: "Marta", emoji: "✨", avatar: "https://ui-avatars.com/api/?name=Marta&background=ec4899&color=fff" },
          ]}
          speed={35}
        />
      </section>


      {/* ===== INLINE PRICING (ANCHOR FOR CTA) ===== */}
      <Pricing />

      {/* ===== FINAL CTA ===== */}
      <section className="container mx-auto px-4 pb-24">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-500/10 via-sky-500/10 to-emerald-400/10 p-8 text-center text-white backdrop-blur-md">
          <h4 className="text-2xl font-semibold">Ready to stand out?</h4>
          <p className="mx-auto mt-2 max-w-2xl text-white/80">
            Create a tailored, ATS-ready cover letter in minutes. Keep your voice, highlight your impact, and apply with confidence.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/generator">
              <Button
                size="lg"
                  className="rounded-full !bg-[#2c974b] px-8 py-5 text-base font-semibold text-white shadow-md ring-1 ring-black/10 hover:!bg-[#2c974b] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-[1px]"
              >
                Generate my cover letter
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/20 bg-white/10 px-8 py-5 text-base text-white hover:bg-white/20"
              >
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* --- Small presentational components --- */

function CardStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 backdrop-blur-md">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white">
        {step}
      </div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-2">{text}</p>
    </div>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 backdrop-blur-md">
      <h4 className="text-lg font-medium text-white">{title}</h4>
      <p className="mt-2">{text}</p>
    </div>
  );
}

function QuoteCard({ quote, name }: { quote: string; name: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
      <p>“{quote}”</p>
      <span className="mt-2 block font-medium text-white">{name}</span>
    </div>
  );
}

/** ===== Reviews Marquee (auto-scrolling like GitHub) =====
 * - Duplicates the row to create a seamless infinite loop
 * - Pauses on hover / focus for readability
 */
/** ===== Reviews Marquee (auto-scrolling like GitHub) =====
 * - Duplicates the row to create a seamless infinite loop
 * - Pauses on hover (and keyboard focus) using a .group wrapper
 */

function ReviewsMarquee({
  items,
  speed = 5, // seconds per loop
}: {
  items: { quote: string; name: string; emoji?: string; avatar?: string }[];
  speed?: number;
}) {
  const [paused, setPaused] = useState(false);

  const handleEnter = useCallback(() => setPaused(true), []);
  const handleLeave = useCallback(() => setPaused(false), []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-2"
      tabIndex={0}
      aria-label="User reviews marquee. Hover or focus to pause."
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onTouchStart={handleEnter} // mobile: tap to pause
    >
      <div
        className="flex gap-4"
        style={{
          width: "max-content",
          willChange: "transform",
          animation: `marquee ${speed}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {items.map((r, i) => (
          <ReviewPill key={`a-${i}`} {...r} />
        ))}
        {/* duplicate for seamless loop */}
        {items.map((r, i) => (
          <ReviewPill key={`b-${i}`} {...r} />
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*='animation: marquee'] {
            animation: none !important;
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
}

function ReviewPill({
  quote,
  name,
  emoji = "⭐",
  avatar = "https://ui-avatars.com/api/?name=User&background=64748b&color=fff",
}: {
  quote: string;
  name: string;
  emoji?: string;
  avatar?: string;
}) {
  return (
    <div className="min-w-[280px] max-w-xs shrink-0 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 backdrop-blur-md sm:min-w-[320px]">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/15"
          aria-hidden="true"
        >
          {/* Use <img> to avoid Next/Image domain config friction inside a snippet */}
          <img src={avatar} alt={`${name} avatar`} className="h-full w-full object-cover" />
        </span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{name}</span>
          <span className="text-base" aria-hidden="true">
            {emoji}
          </span>
        </div>
      </div>
      <p className="leading-relaxed">“{quote}”</p>
    </div>
  );
}

