// src/lib/paddle.ts
"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

function getPaddle() {
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment:
        (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") || "sandbox",
      checkout: { settings: { displayMode: "overlay", variant: "one-page" } },
      eventCallback: (e) => console.log("Paddle event:", e),
    });
  }
  return paddlePromise;
}

type CartItem = { priceId: string; quantity?: number };

type CustomerDetailsBase = {
  address?: {
    countryCode?: string;
    postalCode?: string;
    region?: string;
    city?: string;
    firstLine?: string;
    secondLine?: string;
  };
};
type CustomerByEmail = { email: string } & CustomerDetailsBase;
type CustomerById = { id: string } & CustomerDetailsBase;
export type CustomerParam = CustomerByEmail | CustomerById;

type OpenOpts = {
  plan?: "pro" | "premium";
  appUserId?: string;
  appEmail?: string;
};

export async function openCheckout(
  items: CartItem[],
  customer?: CustomerParam,
  opts?: OpenOpts
): Promise<void> {
  const paddle = await getPaddle();
  if (!paddle) return;

  const base = {
    settings: {
      displayMode: "overlay" as const,
      variant: "one-page" as const,
      successUrl: `${window.location.origin}/generator`,
    },
    // becomes `custom_data` on webhooks
    customData: {
      app_user_id: opts?.appUserId,
      app_email: opts?.appEmail,
      intended_plan: opts?.plan,
    },
  };

  console.log("[CHECKOUT] opening with", {
    items,
    customer,
    customData: base.customData,
  });

  if (customer) {
    await paddle.Checkout.open({ ...base, items, customer });
  } else {
    await paddle.Checkout.open({ ...base, items });
  }
}
