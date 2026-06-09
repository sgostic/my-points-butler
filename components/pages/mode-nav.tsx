/* Shared top nav with the 4-mode switch, linking the variants together.
   Each mode points at its `?variant=` query param. */

import { fmt } from "./variant-a/data";

export type ModeId = "planner" | "alerts" | "goals" | "discover";

export function PBModeNav({
  balance,
  balanceLabel = "Wallet",
}: {
  active: ModeId;
  balance: number;
  balanceLabel?: string;
}) {
  return (
    <header className="pb-nav">
      <a className="pb-brand" href="#top">
        <span className="pb-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M12 3c-3.3 0-6 2.6-6 5.8 0 1.8.9 3.2 2 4.2v2h8v-2c1.1-1 2-2.4 2-4.2C18 5.6 15.3 3 12 3Z"
              fill="currentColor"
            />
            <rect x="7" y="16.5" width="10" height="2.4" rx="1.2" fill="currentColor" />
            <circle cx="12" cy="20.4" r="1.4" fill="currentColor" />
          </svg>
        </span>
        <span className="pb-brand-name">My Points Butler</span>
      </a>
      <div className="pb-nav-right">
        <div className="pb-balance" title="Your points">
          <span className="pb-balance-label">{balanceLabel}</span>
          <span className="pb-balance-num">{fmt(balance)}</span>
          <span className="pb-balance-unit">pts</span>
        </div>
        <button type="button" className="pb-btn pb-btn-ghost">
          Sign in
        </button>
      </div>
    </header>
  );
}
