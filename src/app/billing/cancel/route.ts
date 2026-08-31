// src/app/api/billing/cancel/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PADDLE_API =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["active", "trialing", "past_due", "paused", "cancellation_scheduled"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, paddleSubscriptionId: true },
  });

  if (!sub?.paddleSubscriptionId) {
    // nothing to cancel; you're effectively free
    return NextResponse.json({ ok: true, note: "No active subscription." });
  }
  if (!process.env.PADDLE_API_KEY) {
    return NextResponse.json({ error: "Paddle API key not configured." }, { status: 500 });
  }

  const resp = await fetch(
    `${PADDLE_API}/subscriptions/${encodeURIComponent(sub.paddleSubscriptionId)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ effective_from: "next_billing_period" }),
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Paddle cancel failed:", err);
    return NextResponse.json({ error: "Failed to cancel subscription." }, { status: 500 });
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "cancellation_scheduled" },
  });

  return NextResponse.json({ ok: true });
}
