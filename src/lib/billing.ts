// src/lib/billing.ts
export type Plan = "free" | "pro" | "premium";

// Rank helper for plan comparisons
const RANK: Record<Plan, number> = { free: 0, pro: 1, premium: 2 };

// Compare two plans: do we already have the same or higher?
export function hasPlan(current: Plan | undefined, target: Plan): boolean {
  if (!current) return false;
  return RANK[current] >= RANK[target];
}

// Read price IDs from env (supports NEXT_PUBLIC_* and server-only fallbacks)
function envPriceIds() {
  const PRO = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || process.env.PADDLE_PRICE_PRO || "";
  const PREMIUM =
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PREMIUM || process.env.PADDLE_PRICE_PREMIUM || "";
  return { PRO, PREMIUM };
}

// Map Paddle price.id → internal plan
export function planFromPriceId(priceId?: string): Plan {
  const { PRO, PREMIUM } = envPriceIds();
  if (!priceId) return "free";
  if (priceId === PRO) return "pro";
  if (priceId === PREMIUM) return "premium";
  return "free";
}

export function getEnvPriceIdSnapshot() {
  return envPriceIds();
}

export function isActiveSubscriptionStatus(status?: string | null) {
  return status === "active" || status === "trialing";
}
