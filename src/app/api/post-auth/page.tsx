import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan } from "@/lib/limits";

function hasPlan(userPlan: string, target: string) {
  if (userPlan === target) return true;
  // Premium covers Pro
  if (userPlan === "premium" && target === "pro") return true;
  return false;
}

export default async function PostAuthPage({
  searchParams,
}: { searchParams: { plan?: "pro" | "premium" | "free" } }) {
  const requested = (searchParams.plan ?? "pro").toLowerCase() as "pro" | "premium" | "free";
  const session = await getServerSession(authOptions);

  // Not logged in? Go to login and come back here after.
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/post-auth?plan=${requested}`)}`);
  }

  // Always re-check plan from DB (source of truth)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const currentPlan = (user?.plan ?? "free") as "free" | "pro" | "premium";

  // If the user already has that module (or higher), send them to the app
  if (hasPlan(currentPlan, requested)) {
    redirect("/generator"); // or "/billing" if you prefer
  }

    if (requested === "free") {
    redirect("/generator");
  }
  const paylinks: Record<Exclude<Plan, "free">, string | undefined> = {
    pro: process.env.NEXT_PUBLIC_PADDLE_LINK_PRO,
    premium: process.env.NEXT_PUBLIC_PADDLE_LINK_PREMIUM,
  };

  const payUrl = paylinks[requested]; // ✅ no TS7053
  if (!payUrl) {
    // handle misconfiguration
    redirect("/billing?error=missing_paylink");
  }

  redirect(payUrl);
}
