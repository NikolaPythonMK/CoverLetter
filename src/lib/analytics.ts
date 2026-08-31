"use client";
import posthog from "posthog-js";
import { useEffect } from "react";

export function usePostHog() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, { api_host: "https://app.posthog.com", capture_pageview: true });
  }, []);
}
