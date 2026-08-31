// src/app/api/billing/portal/route.ts
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
  if (!process.env.PADDLE_API_KEY) {
    return NextResponse.json({ error: "Paddle API key not configured." }, { status: 500 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ["active", "trialing", "past_due", "paused", "cancellation_scheduled"] } },
    orderBy: { createdAt: "desc" },
    select: { paddleSubscriptionId: true },
  });
  if (!sub?.paddleSubscriptionId) {
    return NextResponse.json({ error: "No subscription on file." }, { status: 400 });
  }

  // Fetch subscription to get the customer id (so you don't have to store it)
  const s = await fetch(`${PADDLE_API}/subscriptions/${encodeURIComponent(sub.paddleSubscriptionId)}`, {
    headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}` },
  });
  const sj = await s.json().catch(() => ({}));
  if (!s.ok) {
    console.error("Paddle get sub failed:", sj);
    return NextResponse.json({ error: "Failed to load subscription." }, { status: 500 });
  }
  const customerId = sj?.data?.customer_id ?? sj?.data?.customer?.id;
  if (!customerId) {
    return NextResponse.json({ error: "Missing customer id for portal." }, { status: 500 });
  }

  const p = await fetch(`${PADDLE_API}/customers/${encodeURIComponent(customerId)}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const pj = await p.json().catch(() => ({}));
  if (!p.ok || !pj?.data?.url) {
    console.error("Portal error:", pj);
    return NextResponse.json({ error: "Failed to create portal session." }, { status: 500 });
  }

  return NextResponse.json({ url: pj.data.url });
}
