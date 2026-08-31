"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { openCheckout } from "@/lib/paddle";

type Plan = "free" | "pro" | "premium";

const tiers = [
  {
    name: "Free",
    price: "$0",
    caption: "3 cover letters / month",
    ctaPlan: "free",
    features: ["3 / month", "PDF export", "Save to library"],
  },
  {
    name: "Pro",
    price: "$9.99",
    caption: "50 / month",
    ctaPlan: "pro",
    features: [
      "50 / month",
      "Priority generation",
      "PDF export",
      "Save to library",
    ],
  },
  {
    name: "Premium",
    price: "$19.99",
    caption: "Unlimited",
    ctaPlan: "premium",
    features: [
      "Unlimited",
      "Fastest queue",
      "Priority support",
      "Everything in Pro",
    ],
  },
] as const;

const hasPlan = (current: Plan | undefined, target: Plan) =>
  !!current &&
  (current === target || (current === "premium" && target === "pro"));

// Use NEXT_PUBLIC_* so they’re readable on the client
const PRICE_IDS: Record<Exclude<Plan, "free">, string> = {
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO!,
  premium: process.env.NEXT_PUBLIC_PADDLE_PRICE_PREMIUM!,
};

const loginHref = (to: string): string =>
  `/login?callbackUrl=${encodeURIComponent(to)}`;

async function canPurchase(plan: Plan): Promise<boolean> {
  const res = await fetch(`/api/billing/guard?plan=${plan}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.ok;
}

export default function Pricing() {
  const { data: session, status } = useSession(); // ✅ hooks only at top-level
  const router = useRouter(); // ✅
  const searchParams = useSearchParams(); // ✅

  // Auto-open checkout if we came back from login with ?plan=...
  // inside Pricing component
  const openedRef = React.useRef(false);

  React.useEffect(() => {
    if (openedRef.current) return; // prevent double open on re-renders

    const qp = searchParams.get("plan") as Plan | null;
    if (!qp || qp === "free") return;
    if (status !== "authenticated") return;

    if (hasPlan(session?.user?.plan as Plan | undefined, qp)) return;

    const priceId = PRICE_IDS[qp as Exclude<Plan, "free">];
    if (!priceId) return;

    openedRef.current = true; // mark as opened before awaiting
    openCheckout(
      [{ priceId }],
      { email: session!.user!.email! },
      {
        plan: qp, // "pro" | "premium"
        appUserId: session!.user!.id!, // used by webhook as fallback
        appEmail: session!.user!.email!, // used by webhook as fallback
      }
    ).catch((err) => {
      openedRef.current = false; // allow retry if it failed
      console.error(err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams,
    status,
    session?.user?.email,
    session?.user?.plan,
    session?.user?.id,
  ]);

  // ✅ NO hooks inside this function anymore; use the ones captured above
  const handleChoose = async (plan: Plan) => {
    if (plan === "free") {
      router.push("/generator");
      return;
    }

    const priceId = PRICE_IDS[plan as Exclude<Plan, "free">];
    if (!priceId) {
      console.error("Missing Paddle price ID for", plan);
      return;
    }

    if (status !== "authenticated") {
      router.push(
        loginHref(`/pricing?plan=${plan}`) as unknown as import("next").Route
      );
    }

    // Already on same/higher active plan? (server-checked)
    const allowed = await canPurchase(plan);
    if (!allowed) {
      router.push("/generator");
      return;
    }

    try {
      await openCheckout(
        [{ priceId }],
        { email: session!.user!.email! },
        {
          plan, // "pro" | "premium"
          appUserId: session!.user!.id,
          appEmail: session!.user!.email!,
        }
      );
    } catch (err) {
      console.error("Paddle checkout error:", err);
    }
  };

  return (
    <section id="pricing" className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white">
          Simple, transparent pricing
        </h2>
        <p className="text-white/70">
          Pick a plan that grows with your career.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className="flex flex-col border border-white/10 bg-white/5 text-white/80 backdrop-blur-md"
          >
            <CardHeader>
              <CardTitle className="text-xl text-white">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <div className="text-4xl font-bold text-white">{t.price}</div>
                <div className="text-white/70">{t.caption}</div>
              </div>
              <ul className="space-y-2 mb-6">
                {t.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button
                onClick={() => handleChoose(t.ctaPlan)}
                className="mt-auto w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow-md hover:from-indigo-600 hover:to-blue-700 transition"
                disabled={
                  status === "loading" ||
                  (status === "authenticated" &&
                    hasPlan(
                      session?.user?.plan as Plan | undefined,
                      t.ctaPlan as Plan
                    ))
                }
                title={
                  status === "authenticated" &&
                  hasPlan(
                    session?.user?.plan as Plan | undefined,
                    t.ctaPlan as Plan
                  )
                    ? "You're already on this plan"
                    : undefined
                }
              >
                {status === "authenticated" &&
                hasPlan(
                  session?.user?.plan as Plan | undefined,
                  t.ctaPlan as Plan
                )
                  ? "Current Plan"
                  : `Choose ${t.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
