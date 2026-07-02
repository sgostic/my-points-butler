"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trackMetaPixel } from "@/lib/meta-pixel";
import "./thankyou.css";

export function PBThankYou() {
  const router = useRouter();

  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackMetaPixel("completedMailSubmission");
  }, []);

  return (
    <main className="pb-ty-root">
      <div className="pb-ty-card">
        <span className="pb-ty-icon" aria-hidden="true">
          <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#d1f0e0" />
            <path
              d="M12 20.5l5.5 5.5 11-12"
              stroke="#3a9e6b"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h1 className="pb-ty-title">You&rsquo;re all set!</h1>
        <p className="pb-ty-sub">
          We&rsquo;ve matched your points and priorities to real trips you can
          book right now.
        </p>

        <button
          type="button"
          className="pb-ty-cta"
          onClick={() => router.replace("/")}
        >
          View My Recommendations &rarr;
        </button>
      </div>
    </main>
  );
}
