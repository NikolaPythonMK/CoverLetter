// src/lib/subscription.ts
import { prisma } from "@/lib/prisma";

export type PlanSlug = "pro" | "premium";

/** Premium counts for Pro. Assumes plan strings are stored lowercase. */
export async function hasActivePlan(userId: string, requested: PlanSlug): Promise<boolean> {
  const acceptable: PlanSlug[] = requested === "pro" ? ["pro", "premium"] : ["premium"];
  const now = new Date();

  // Check subscriptions table first (tweak fields as needed)
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      plan: { in: acceptable },
      // remove if you don't track these:
      status: { in: ["active", "trialing"] as any },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  if (sub) return true;

  // Fallback to user's plan column
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const p = user?.plan?.toLowerCase();
  return requested === "pro" ? p === "pro" || p === "premium" : p === "premium";
}
