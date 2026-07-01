"use client";

import { trackShare } from "@/lib/analytics";

const HOMEPAGE_VARIANT = "c" as const;

function buildShareUrl() {
  const url = new URL("/", window.location.origin);
  url.searchParams.set("utm_source", "homepage_share");
  return url.toString();
}

export function PBShareButton() {
  const onShare = async () => {
    const shareUrl = buildShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Points Butler",
          url: shareUrl,
        });
        trackShare("native", HOMEPAGE_VARIANT);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      trackShare("clipboard", HOMEPAGE_VARIANT);
    } catch {
      trackShare("unsupported", HOMEPAGE_VARIANT);
    }
  };

  return (
    <button type="button" className="pb-btn pb-btn-ghost pb-share-btn" onClick={onShare}>
      Share
    </button>
  );
}
