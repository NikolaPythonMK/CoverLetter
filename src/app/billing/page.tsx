import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PRO = process.env.NEXT_PUBLIC_PADDLE_LINK_PRO!;
const PREMIUM = process.env.NEXT_PUBLIC_PADDLE_LINK_PREMIUM!;
const RETURN_URL =
  process.env.NEXT_PUBLIC_PADDLE_RETURN_URL ||
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/dashboard";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email || "";

  const link = (u: string) => {
    const url = new URL(u);
    if (email) url.searchParams.set("customer_email", email);
    url.searchParams.set("return_url", RETURN_URL);
    return url.toString();
  };

  return (
    <div className="container-narrow py-12">
      <h1 className="text-2xl font-bold mb-4">Upgrade your plan</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <a href={link(PRO)} className="rounded-2xl border p-6 hover:bg-accent">
          <div className="text-xl font-semibold mb-2">Pro — $9.99/mo</div>
          <div className="text-muted-foreground mb-4">50 letters / month</div>
          <div>Continue to secure Paddle checkout →</div>
        </a>
        <a href={link(PREMIUM)} className="rounded-2xl border p-6 hover:bg-accent">
          <div className="text-xl font-semibold mb-2">Premium — $19.99/mo</div>
          <div className="text-muted-foreground mb-4">Unlimited letters</div>
          <div>Continue to secure Paddle checkout →</div>
        </a>
      </div>
      <p className="text-sm text-muted-foreground mt-4">Paddle handles VAT automatically.</p>
    </div>
  );
}
