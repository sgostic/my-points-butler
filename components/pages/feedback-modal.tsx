"use client";

/* Shared "this is only a prototype" feedback modal.
   Opens when a user clicks an end-game CTA whose real action isn't implemented
   (e.g. "Book with X pts"). Collects quick feedback and — for now — console.logs it.
   Self-contained styling (pb-fb- prefix) so it works in any variant regardless of
   which variant stylesheet is loaded. */

import { useEffect, useState } from "react";
import "./feedback-modal.css";

type Scale = "yes" | "maybe" | "no";

const SCALE: { v: Scale; label: string }[] = [
  { v: "yes", label: "Yes" },
  { v: "maybe", label: "Maybe" },
  { v: "no", label: "No" },
];

export function PBFeedbackModal({
  /* Short label describing the action the user just attempted, e.g. "Book Tokyo". */
  context,
  onClose,
}: {
  context?: string;
  onClose: () => void;
}) {
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [helps, setHelps] = useState<Scale | null>(null);
  const [wouldPay, setWouldPay] = useState<Scale | null>(null);
  const [price, setPrice] = useState("");
  const [done, setDone] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    // No backend yet — log the feedback so we can collect it during testing.
    console.log("[My Points Butler] prototype feedback", {
      context: context ?? null,
      liked,
      disliked,
      helps,
      wouldPay,
      monthlyPrice: price || null,
      at: new Date().toISOString(),
    });
    setDone(true);
  };

  return (
    <div className="pb-fb-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pb-fb-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pb-fb-x" aria-label="Close" onClick={onClose}>
          ✕
        </button>

        {done ? (
          <div className="pb-fb-done">
            <div className="pb-fb-check" aria-hidden="true">
              ✓
            </div>
            <h3 className="pb-fb-title">Thank you!</h3>
            <p className="pb-fb-copy">
              Your feedback helps shape My Points Butler. Remember — nothing was booked, this is
              just a prototype.
            </p>
            <button type="button" className="pb-fb-submit" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="pb-fb-disclaimer" role="note">
              ⚠️ <strong>Heads up:</strong> This is an early <strong>test product</strong>, not a
              real service. No trip will be booked and no points will be used
              {context ? ` for "${context}"` : ""}. We&apos;d love your thoughts.
            </div>

            <h3 className="pb-fb-title">Quick feedback</h3>

            <label className="pb-fb-field">
              <span className="pb-fb-label">What did you like?</span>
              <textarea
                className="pb-fb-textarea"
                rows={2}
                value={liked}
                placeholder="The part that worked for you…"
                onChange={(e) => setLiked(e.target.value)}
              />
            </label>

            <label className="pb-fb-field">
              <span className="pb-fb-label">What didn&apos;t you like?</span>
              <textarea
                className="pb-fb-textarea"
                rows={2}
                value={disliked}
                placeholder="Anything confusing or missing…"
                onChange={(e) => setDisliked(e.target.value)}
              />
            </label>

            <div className="pb-fb-field">
              <span className="pb-fb-label">Would this help you decide when to use your points?</span>
              <div className="pb-fb-scale">
                {SCALE.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className={"pb-fb-opt" + (helps === o.v ? " is-on" : "")}
                    aria-pressed={helps === o.v}
                    onClick={() => setHelps(o.v)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pb-fb-field">
              <span className="pb-fb-label">Would you pay for this service?</span>
              <div className="pb-fb-scale">
                {SCALE.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className={"pb-fb-opt" + (wouldPay === o.v ? " is-on" : "")}
                    aria-pressed={wouldPay === o.v}
                    onClick={() => setWouldPay(o.v)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {wouldPay !== "no" && (
              <label className="pb-fb-field">
                <span className="pb-fb-label">If yes, what feels fair per month?</span>
                <input
                  className="pb-fb-input"
                  inputMode="decimal"
                  value={price}
                  placeholder="e.g. $5 / month"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
            )}

            <div className="pb-fb-foot">
              <button type="button" className="pb-fb-submit" onClick={submit}>
                Send feedback
              </button>
              <button type="button" className="pb-fb-skip" onClick={onClose}>
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
