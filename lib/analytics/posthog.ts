import posthog from "posthog-js";

let initialized = false;

export function initPosthog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host || initialized || typeof window === "undefined") return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    person_profiles: "never"
  });

  initialized = true;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  initPosthog();
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}
