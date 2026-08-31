export type Plan = "free" | "pro" | "premium";

export const PLAN_LIMITS: Record<Plan, number | "unlimited"> = {
  free: 500,
  pro: 500,
  premium: "unlimited"
};

export function planFromText(input?: string | null): Plan {
  if (!input) return "free";
  const low = input.toLowerCase();
  if (low.includes("premium")) return "premium";
  if (low.includes("pro")) return "pro";
  return "free";
}
