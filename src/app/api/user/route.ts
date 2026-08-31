// src/app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, sub, oauthGoogle] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, plan: true, passwordHash: true },
    }),
    prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "trialing", "past_due", "paused", "cancellation_scheduled"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        plan: true,
        paddleSubscriptionId: true,
      },
    }),
    // specifically Google-managed
    prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: { provider: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const managedByGoogle = !!oauthGoogle;

  return NextResponse.json({
    name: user.name ?? "",
    email: user.email ?? "",
    plan: user.plan ?? sub?.plan ?? "free",
    subscriptionStatus: sub?.status ?? null,
    subscriptionRenewsAt: sub?.currentPeriodEnd?.toISOString() ?? null,
    hasSubscription: !!sub?.paddleSubscriptionId,

    // flags for UI behavior
    managedByGoogle,          // true -> lock email+password in UI
    emailEditable: !managedByGoogle,
    passwordEditable: !managedByGoogle,
  });
}

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z
    .object({
      current: z.string().min(6, { message: "Current password must be at least 6 characters." }).optional(),
      next: z.string().min(8, { message: "New password must be at least 8 characters." }).optional(),
    })
    .optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const [me, oauthGoogle] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true },
    }),
    prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: { provider: true },
    }),
  ]);
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const managedByGoogle = !!oauthGoogle;
  const { name, email, password } = parsed.data;

  const updates: Record<string, any> = {};
  if (typeof name === "string") updates.name = name;

  // Email: apply only if NOT Google-managed
  if (!managedByGoogle && typeof email === "string") {
    updates.email = email;
  }

  // 🔒 Non-Google: require current+next to change password, always.
  if (!managedByGoogle && password) {
    const { current, next } = password;

    if (!current || !next) {
      return NextResponse.json(
        { error: "Current and new password are required." },
        { status: 400 }
      );
    }
    if (!me.passwordHash) {
      // Shouldn't happen for non-Google users; guard anyway
      return NextResponse.json(
        { error: "No password is set for this account. Use the password reset flow." },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(current, me.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    // Disallow reusing the same password
    if (await bcrypt.compare(next, me.passwordHash)) {
      return NextResponse.json(
        { error: "New password must be different from the current password." },
        { status: 400 }
      );
    }

    updates.passwordHash = await bcrypt.hash(next, 10);
  }

  try {
    await prisma.user.update({ where: { id: me.id }, data: updates });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
