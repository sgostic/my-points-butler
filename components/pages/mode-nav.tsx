/* Shared top nav for the goals homepage. */

import { PBNavMark } from "./nav-mark";
import { PBShareButton } from "./share-button";
import { fmt } from "./variant-a/data";

export function PBModeNav({
  balance,
  balanceLabel = "Wallet",
  userEmail = "",
  isSubmitting = false,
  onSignIn,
  onSignOut,
}: {
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
        <PBShareButton />
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
          {userEmail ? "Sign out" : "Sign Up"}
        </button>
      </div>
    </header>
  );
}
