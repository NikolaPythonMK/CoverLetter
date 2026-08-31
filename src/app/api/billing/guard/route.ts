// src/app/api/billing/guard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPlan, isActiveSubscriptionStatus, Plan } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const plan = (new URL(req.url).searchParams.get("plan") || "free") as Plan;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const currentPlan = (user?.plan as Plan) ?? "free";
  const sub = user?.subscriptions?.[0];

  if (hasPlan(currentPlan, plan) && isActiveSubscriptionStatus(sub?.status)) {
    return NextResponse.json({ ok: false, reason: "already-on-plan" });
  }

  return NextResponse.json({ ok: true });
}
