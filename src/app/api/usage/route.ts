import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, planFromText } from "@/lib/limits";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = planFromText(user.plan);
  const limit = PLAN_LIMITS[plan];
  const used = await prisma.letter.count({ where: { userId: user.id, createdAt: { gte: startOfMonth() } } });
  return NextResponse.json({ plan, used, limit });
}
