export const META_PIXEL_ID = "892791357191175";

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/**
 * Fire a Meta Pixel standard or custom event. If the pixel script hasn't
 * executed yet (it loads `afterInteractive`, which can race with React effects
 * and event handlers), retry briefly so the event isn't silently dropped.
 */
export function trackMetaPixel(
  event: string,
  params?: Record<string, unknown>,
  attempt = 0,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    window.fbq("track", event, params);
    return;
  }
  // Pixel not ready — retry for up to ~5s (50 × 100ms) before giving up.
  if (attempt < 50) {
    window.setTimeout(() => trackMetaPixel(event, params, attempt + 1), 100);
  }
}
