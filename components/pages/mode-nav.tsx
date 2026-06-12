/* Shared top nav with the 4-mode switch, linking the variants together.
   Each mode points at its `?variant=` query param. */

import { PBNavMark } from "./nav-mark";
import { PBShareButton } from "./share-button";
import { fmt } from "./variant-a/data";

export type ModeId = "planner" | "alerts" | "goals" | "discover";

export function PBModeNav({
  active,
  balance,
  balanceLabel = "Wallet",
  userEmail = "",
  isSubmitting = false,
  onSignIn,
  onSignOut,
}: {
  active: ModeId;
  balance: number;
  balanceLabel?: string;
  userEmail?: string;
  isSubmitting?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
}) {
  return (
    <header className="pb-nav">
      <a className="pb-brand" href="#top">
        <span className="pb-brand-mark" aria-hidden="true">
          <PBNavMark size={20} />
        </span>
        <span className="pb-brand-name">My Points Butler</span>
      </a>
      <div className="pb-nav-right">
        {userEmail ? <span className="pb-nav-user">{userEmail}</span> : null}
        <PBShareButton
          variant={active === "planner" ? "a" : active === "alerts" ? "b" : active === "goals" ? "c" : "d"}
        />
        <div className="pb-balance" title="Your points">
          <span className="pb-balance-label">{balanceLabel}</span>
          <span className="pb-balance-num">{fmt(balance)}</span>
          <span className="pb-balance-unit">pts</span>
        </div>
        <button
          type="button"
          className="pb-btn pb-btn-ghost"
          disabled={isSubmitting}
          onClick={userEmail ? onSignOut : onSignIn}
        >
          {userEmail ? "Sign out" : "Sign in"}
        </button>
      </div>
    </header>
  );
}
