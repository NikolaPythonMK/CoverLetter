// src/app/api/paddle/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto, { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  planFromPriceId,
  isActiveSubscriptionStatus,
  Plan,
  getEnvPriceIdSnapshot,
} from "@/lib/billing";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook endpoint alive" });
}

// ---- signature helpers (supports 'ts=...;h1=...') ----
function parsePaddleSigHeader(header: string | null) {
  if (!header) return null;
  const parts = Object.fromEntries(
    header.split(/[;,]\s*/g).map((kv) => {
      const [k, v] = kv.trim().split("=");
      return [k, v];
    })
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return null;
  return { ts, h1 };
}
function hexHmacSHA256(key: string, data: string): Uint8Array {
  const hex = crypto.createHmac("sha256", key).update(data).digest("hex");
  return new Uint8Array(Buffer.from(hex, "hex"));
}
function verifyPaddleSignature(raw: string, header: string | null, secret: string): boolean {
  const parsed = parsePaddleSigHeader(header);
  if (!parsed) return false;
  const provided = new Uint8Array(Buffer.from(parsed.h1, "hex"));
  const candA = hexHmacSHA256(secret, `${parsed.ts}:${raw}`);
  const candB = hexHmacSHA256(secret, `${parsed.ts}.${raw}`);
  if (provided.length === candA.length && timingSafeEqual(provided, candA)) return true;
  if (provided.length === candB.length && timingSafeEqual(provided, candB)) return true;
  return false;
}

// ---- helpers ----
function extractPriceId(items: any[]): string | undefined {
  return Array.isArray(items) && items[0]
    ? items[0].price?.id || items[0].price_id
    : undefined;
}
const parseDate = (s?: string) => (s ? new Date(s) : undefined);

async function upsertSubAndUser(args: {
  email?: string;
  plan: Plan;
  status: string;
  currentPeriodEnd?: Date;
  paddleSubscriptionId?: string;
  fallbackUserId?: string;
}) {
  const { email, plan, status, currentPeriodEnd, paddleSubscriptionId, fallbackUserId } = args;

  let user =
    (email && (await prisma.user.findFirst({ where: { email } }))) ||
    (fallbackUserId && (await prisma.user.findUnique({ where: { id: fallbackUserId } })));

  if (!user) {
    console.warn("[PADDLE] No matching user. email:", email, "fallbackUserId:", fallbackUserId);
    return;
  }

  if (plan === "free") {
    console.warn("[PADDLE] Unknown or unmapped price → plan free. Skipping sub update.");
    return;
  }

  if (paddleSubscriptionId) {
    const existing = await prisma.subscription.findFirst({
      where: { paddleSubscriptionId, userId: user.id },
    });
    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { status, plan, currentPeriodEnd },
      });
    } else {
      await prisma.subscription.create({
        data: { userId: user.id, status, plan, currentPeriodEnd, paddleSubscriptionId },
      });
    }
  } else {
    await prisma.subscription.create({
      data: { userId: user.id, status, plan, currentPeriodEnd },
    });
  }

  if (isActiveSubscriptionStatus(status)) {
    await prisma.user.update({ where: { id: user.id }, data: { plan } });
  } else if (["canceled", "paused", "expired"].includes(status)) {
    if (!currentPeriodEnd || currentPeriodEnd < new Date()) {
      await prisma.user.update({ where: { id: user.id }, data: { plan: "free" } });
    }
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const raw = await req.text();
  const sig = req.headers.get("paddle-signature");

  // DEV logging
  console.log("[PADDLE] incoming headers:", Object.fromEntries(req.headers));
  console.log("[PADDLE] raw body:", raw.slice(0, 1200));

  if (!secret || !verifyPaddleSignature(raw, sig, secret)) {
    console.error("[PADDLE] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let evt: any;
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType: string | undefined = evt?.event_type || evt?.eventType;
  const data = evt?.data ?? evt?.event_data ?? {};

  // Persist raw for observability
  await prisma.webhookEvent.create({
    data: { provider: "paddle", eventType: eventType || "unknown", payload: raw },
  });

  try {
    switch (eventType) {
      // Charges (first or renewal)
      case "transaction.paid":
      case "transaction.completed": {
        console.log("[PADDLE]", eventType);

        const priceId = extractPriceId(data?.items);
        console.log("[PADDLE] priceId seen:", priceId);
        console.log("[PADDLE] env price ids:", getEnvPriceIdSnapshot());

        const plan: Plan = planFromPriceId(priceId);
        const status = "active";

        const emailFromPayload =
          data?.customer?.email || data?.customer_email || data?.custom_data?.app_email;

        const subscriptionId: string | undefined =
          data?.subscription_id || data?.subscription?.id || data?.custom_data?.subscription_id;

        await upsertSubAndUser({
          email: emailFromPayload,
          plan,
          status,
          currentPeriodEnd: undefined, // subscription.* updates this later
          paddleSubscriptionId: subscriptionId,
          fallbackUserId: data?.custom_data?.app_user_id,
        });
        break;
      }

      // Subscription lifecycle
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
      case "subscription.paused":
      case "subscription.canceled": {
        console.log("[PADDLE] subscription event:", eventType);

        const sub = data?.subscription || data;

        const items: any[] = sub?.items || data?.items || [];
        const priceId = extractPriceId(items);
        console.log("[PADDLE] priceId seen:", priceId);
        console.log("[PADDLE] env price ids:", getEnvPriceIdSnapshot());

        const plan: Plan = planFromPriceId(priceId);

        const emailFromPayload =
          sub?.customer?.email ||
          data?.customer_email ||
          sub?.custom_data?.app_email ||
          data?.custom_data?.app_email;

        const currentPeriodEnd =
          parseDate(sub?.current_billing_period?.ends_at) ||
          parseDate(sub?.billing_period?.ends_at) ||
          parseDate(sub?.next_billed_at);

        const status: string =
          sub?.status || data?.status || (eventType === "subscription.activated" ? "active" : "active");

        const paddleSubscriptionId: string | undefined = sub?.id || data?.id;

        await upsertSubAndUser({
          email: emailFromPayload,
          plan,
          status,
          currentPeriodEnd,
          paddleSubscriptionId,
          fallbackUserId: sub?.custom_data?.app_user_id || data?.custom_data?.app_user_id,
        });
        break;
      }

      default:
        console.log("[PADDLE] Unhandled event:", eventType);
        break;
    }
  } catch (err) {
    console.error("[PADDLE] Webhook handler error:", err);
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
