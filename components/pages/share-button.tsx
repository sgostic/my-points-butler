"use client";

import { trackShare, type VariantKey } from "@/lib/analytics";

function buildShareUrl(variant: VariantKey) {
  const url = new URL(window.location.href);
  url.searchParams.set("variant", variant);
  url.searchParams.set("utm_source", "homepage_share");
  return url.toString();
}

export function PBShareButton({ variant }: { variant: VariantKey }) {
  const onShare = async () => {
    const shareUrl = buildShareUrl(variant);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Points Butler",
          url: shareUrl,
        });
        trackShare("native", variant);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      trackShare("clipboard", variant);
    } catch {
      trackShare("unsupported", variant);
    }
  };

  return (
    <button type="button" className="pb-btn pb-btn-ghost pb-share-btn" onClick={onShare}>
      Share
    </button>
  );
}
