"use client";

/* My Points Butler — Variant A (the polished, default direction).
   App shell, hero with dotted world-map picker, verdict "savings meter",
   and a tabbed Flights / Hotels comparison table. */

import { useEffect, useState } from "react";
import {
  DESTINATIONS,
  findDestinationByQuery,
  makeCustomDestination,
  summarize,
  verdictFor,
  fmt,
  type Destination,
  type Offer,
  type Summary,
  type Tone,
} from "./data";
import { WorldMap } from "./world-map";
import { AuthModal, useAuth } from "../auth";
import { PBFeedbackModal } from "../feedback-modal";
import { PBFooter } from "../footer";
import {
  EVENTS,
  track,
  trackGate,
  trackMapPin,
  trackPointsEnteredDebounced,
} from "@/lib/analytics";
import "./variant-a.css";
import ValueChat from "../value-chat";

const TONE_VAR: Record<Tone, string> = {
  save: "var(--save)",
  now: "var(--now)",
  neutral: "var(--brand)",
};

// Locked-in default tweaks (the design's chosen direction).
const DOT_COLOR = "#C2AE9F";
const FRAMING = 1; // 0 gentle · 1 balanced · 2 bold

const ButlerMark = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path
      d="M12 3c-3.3 0-6 2.6-6 5.8 0 1.8.9 3.2 2 4.2v2h8v-2c1.1-1 2-2.4 2-4.2C18 5.6 15.3 3 12 3Z"
      fill="currentColor"
    />
    <rect x="7" y="16.5" width="10" height="2.4" rx="1.2" fill="currentColor" />
    <circle cx="12" cy="20.4" r="1.4" fill="currentColor" />
  </svg>
);

/* ---------- Top navigation ---------- */
function PBNav({
  balance,
  userEmail,
  isSubmitting,
  onSignIn,
  onSignOut,
}: {
  balance: number;
  userEmail: string;
  isSubmitting: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="pb-nav">
      <a className="pb-brand" href="#top">
        <span className="pb-brand-mark" aria-hidden="true">
          <ButlerMark size={20} />
        </span>
        <span className="pb-brand-name">My Points Butler</span>
      </a>
      <nav className="pb-nav-links">
        <a href="#explore">Explore</a>
        <a href="#compare">Compare</a>
        <a href="#how">How it works</a>
      </nav>
      <div className="pb-nav-right">
        {userEmail ? <span className="pb-nav-user">{userEmail}</span> : null}
        <div className="pb-balance" title="Your combined miles & points">
          <span className="pb-balance-label">Your balance</span>
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

/* ---------- Verdict / savings meter ---------- */
function PBVerdictBadge({ tone, label, big }: { tone: Tone; label: string; big?: boolean }) {
  return (
    <span className={"pb-verdict pb-verdict-" + tone + (big ? " is-big" : "")}>
      <span className="pb-verdict-icon" aria-hidden="true">
        {tone === "save" ? "↓" : tone === "now" ? "↑" : "≈"}
      </span>
      {label}
    </span>
  );
}

function PBCompareBars({ now, later }: { now: number; later: number }) {
  const max = Math.max(now, later);
  const nowPct = (now / max) * 100;
  const laterPct = (later / max) * 100;
  const cheaper = later < now;
  return (
    <div className="pb-bars">
      <div className="pb-bar-row">
        <div className="pb-bar-head">
          <span className="pb-bar-tag">Book now</span>
          <span className="pb-bar-val">{fmt(now)}</span>
        </div>
        <div className="pb-bar-track">
          <div className="pb-bar-fill pb-bar-now" style={{ width: nowPct + "%" }} />
        </div>
      </div>
      <div className="pb-bar-row">
        <div className="pb-bar-head">
          <span className="pb-bar-tag">If you wait</span>
          <span className="pb-bar-val">{fmt(later)}</span>
        </div>
        <div className="pb-bar-track">
          <div
            className={"pb-bar-fill " + (cheaper ? "pb-bar-later" : "pb-bar-rise")}
            style={{ width: laterPct + "%" }}
          />
        </div>
      </div>
    </div>
  );
}

function PBVerdict({
  dest,
  summary,
  framing,
  balance,
  isSignedIn,
  onSignUp,
}: {
  dest: Destination;
  summary: Summary;
  framing: number;
  balance: number;
  isSignedIn: boolean;
  onSignUp: () => void;
}) {
  const [feedback, setFeedback] = useState(false);
  const best = summary.best;
  const tone = summary.tone;
  const save = Math.abs(best.v.save);
  const pct = Math.round(Math.abs(best.v.pct) * 100);
  const netPct = Math.round(Math.abs(summary.netPct) * 100);

  useEffect(() => {
    track(EVENTS.VERDICT_VIEWED, { variant: "a", destId: dest.id, tone, netPct });
  }, [dest.id, tone, netPct]);

  const HEADLINES: Record<Tone, string[]> = {
    save: ["Waiting could pay off.", "Hold your points.", "Don't burn them yet."],
    now: ["Prices are edging up.", "Lock it in now.", "Book before it's gone."],
    neutral: ["Roughly a wash.", "It's a close call.", "Your call — barely moves."],
  };
  const headline = HEADLINES[tone][framing] || HEADLINES[tone][1];

  const sub =
    tone === "save" ? (
      <>
        The cheapest window for {dest.city} lands around <strong>{best.o.when}</strong> — about{" "}
        <strong>{netPct}% less</strong> than booking today.
      </>
    ) : tone === "now" ? (
      <>
        Award space to {dest.city} is getting pricier — roughly <strong>{netPct}% more</strong> across
        the board if you wait.
      </>
    ) : (
      <>
        Prices to {dest.city} are holding steady — only about <strong>{netPct}%</strong> movement
        either way.
      </>
    );

  const bigCap =
    tone === "now"
      ? "extra miles if you wait"
      : tone === "neutral"
      ? "miles you might save"
      : "miles you'd keep by waiting";
  const badgeLabel = tone === "now" ? "Book now" : tone === "neutral" ? "Roughly even" : "Wait & save";
  const arrow = tone === "now" ? "↑" : "↓";
  const ctaLabel = !isSignedIn
    ? "Sign up to save this verdict →"
    : tone === "now"
    ? `Book ${best.o.name} now →`
    : tone === "neutral"
    ? `Use my points on ${dest.city} →`
    : `Remind me to book ${dest.city} →`;

  return (
    <div className={"pb-verdict-card tone-" + tone} style={{ "--accent": dest.accent } as React.CSSProperties}>
      <div className="pb-vc-left">
        <div className="pb-vc-top">
          <span className="pb-vc-flag">{dest.flag}</span>
          <div className="pb-vc-topcol">
            <div className="pb-vc-eyebrow">Butler&apos;s verdict · {dest.city}</div>
            <h3 className="pb-vc-headline">{headline}</h3>
          </div>
        </div>
        <p className="pb-vc-sub">{sub}</p>
        <div className="pb-vc-stat">
          <div className="pb-vc-bignum">
            <span className="pb-vc-arrow">{arrow}</span>
            {fmt(save)}
          </div>
          <div className="pb-vc-bignum-cap">
            {bigCap}
            <span className="pb-vc-on">on {best.o.name}</span>
          </div>
        </div>
        <div className="pb-vc-foot">
          <PBVerdictBadge tone={tone} label={badgeLabel} big />
          <span className="pb-vc-conf">
            {best.o.conf} confidence · best window {dest.bestWindow}
          </span>
        </div>
      </div>
      <div className="pb-vc-right">
        <div className="pb-vc-right-title">{tone === "now" ? "Why book now" : "Best opportunity"}</div>
        <div className="pb-vc-offer">{best.o.name}</div>
        <PBCompareBars now={best.o.now} later={best.o.later} />
        <div className="pb-vc-afford">
          {best.o.now <= balance ? (
            <>
              ✓ You can book this now — <strong>{fmt(balance - best.o.now)} pts</strong> left over.
            </>
          ) : (
            <>
              You&apos;re <strong>{fmt(best.o.now - balance)} pts</strong> short to book this today.
            </>
          )}
        </div>
        {tone === "now" ? (
          <div className="pb-savings-ribbon now">
            Waiting until {best.o.when} costs <strong>{fmt(save)} more miles</strong>
          </div>
        ) : (
          <div className="pb-savings-ribbon">
            You save <strong>{fmt(save)} miles</strong> · {pct}% off by waiting
          </div>
        )}
        <button
          type="button"
          className={"pb-vc-cta" + (isSignedIn ? "" : " pb-gated-action")}
          onClick={() => {
            if (isSignedIn) {
              setFeedback(true);
            } else {
              trackGate("verdict", "a");
              onSignUp();
            }
          }}
        >
          {ctaLabel}
        </button>
      </div>
      {feedback && (
        <PBFeedbackModal context={`${best.o.name} · ${dest.city}`} onClose={() => setFeedback(false)} />
      )}
    </div>
  );
}

/* ---------- Comparison table ---------- */
function PBMiniMeter({ v }: { v: ReturnType<typeof verdictFor> }) {
  const pct = Math.max(0, Math.min(1, v.pct));
  const w = Math.round(pct * 100);
  if (v.tone === "now") {
    return (
      <div className="pb-mini">
        <div className="pb-mini-track">
          <div className="pb-mini-fill rise" style={{ width: Math.min(100, Math.abs(v.pct) * 100) + "%" }} />
        </div>
      </div>
    );
  }
  return (
    <div className="pb-mini">
      <div className="pb-mini-track">
        <div className={"pb-mini-fill " + v.tone} style={{ width: w + "%" }} />
      </div>
    </div>
  );
}

function PBAfford({ cost, balance }: { cost: number; balance: number }) {
  if (cost <= balance) {
    return <span className="pb-afford ok">✓ Within balance</span>;
  }
  return <span className="pb-afford short">Need {fmt(cost - balance)} more</span>;
}

function PBRow({ offer, balance }: { offer: Offer; balance: number }) {
  const v = verdictFor(offer.now, offer.later);
  const save = v.save;
  const pct = Math.round(v.pct * 100);
  const cheaper = save > 0;
  return (
    <div className={"pb-row tone-" + v.tone}>
      <div className="pb-cell pb-cell-name" data-label="Option">
        <div className="pb-row-name">{offer.name}</div>
        <div className="pb-row-sub">{offer.sub}</div>
        <PBAfford cost={offer.now} balance={balance} />
      </div>
      <div className="pb-cell pb-cell-num" data-label="Book now">
        <span className="pb-num">{fmt(offer.now)}</span>
        <span className="pb-num-unit">pts</span>
      </div>
      <div className="pb-cell pb-cell-num" data-label="Best future window">
        <span className="pb-num">{fmt(offer.later)}</span>
        <span className="pb-num-unit">pts</span>
        <span className="pb-when">{offer.when}</span>
      </div>
      <div className="pb-cell pb-cell-save" data-label="You save">
        <span className={"pb-save " + (cheaper ? "pos" : "neg")}>
          {cheaper ? "↓ " : "↑ "}
          {fmt(Math.abs(save))}
        </span>
        <span className="pb-save-pct">
          {cheaper ? "-" : "+"}
          {Math.abs(pct)}%
        </span>
        <PBMiniMeter v={v} />
      </div>
      <div className="pb-cell pb-cell-verdict" data-label="Verdict">
        <PBVerdictBadge tone={v.tone} label={v.label} />
      </div>
    </div>
  );
}

function PBLockedOfferRow({
  offer,
  balance,
  onSignUp,
}: {
  offer: Offer;
  balance: number;
  onSignUp: () => void;
}) {
  return (
    <div className="pb-row-lock">
      <div className="pb-row-lock-preview" aria-hidden="true">
        <PBRow offer={offer} balance={balance} />
      </div>
      <div className="pb-row-lock-cta">
        <span>Unlock this option and every forecast</span>
        <button
          type="button"
          onClick={() => {
            trackGate("locked_offer_row", "a");
            onSignUp();
          }}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

function PBTable({
  dest,
  balance,
  isSignedIn,
  onSignUp,
}: {
  dest: Destination;
  balance: number;
  isSignedIn: boolean;
  onSignUp: () => void;
}) {
  const [tab, setTab] = useState<"flights" | "hotels">("flights");
  const rows = tab === "flights" ? dest.flights : dest.hotels;
  const switchTab = (next: "flights" | "hotels") => {
    setTab(next);
    track(EVENTS.RESULT_TAB_SWITCHED, { variant: "a", tab: next, destId: dest.id });
  };
  return (
    <div className="pb-table-wrap">
      <div className="pb-tabs">
        <button
          type="button"
          className={"pb-tab" + (tab === "flights" ? " is-on" : "")}
          onClick={() => switchTab("flights")}
        >
          <span className="pb-tab-ico" aria-hidden="true">
            ✈
          </span>{" "}
          Flights
          <span className="pb-tab-count">{dest.flights.length}</span>
        </button>
        <button
          type="button"
          className={"pb-tab" + (tab === "hotels" ? " is-on" : "")}
          onClick={() => switchTab("hotels")}
        >
          <span className="pb-tab-ico" aria-hidden="true">
            ⌂
          </span>{" "}
          Hotels
          <span className="pb-tab-count">{dest.hotels.length}</span>
        </button>
        <div className="pb-tabs-note">
          Award costs to <strong>{dest.city}</strong> · now vs. predicted best window
        </div>
      </div>
      <div className="pb-table">
        <div className="pb-row pb-row-head">
          <div className="pb-cell pb-cell-name">Option</div>
          <div className="pb-cell pb-cell-num">Book now</div>
          <div className="pb-cell pb-cell-num">Best future window</div>
          <div className="pb-cell pb-cell-save">You save by waiting</div>
          <div className="pb-cell pb-cell-verdict">Verdict</div>
        </div>
        {rows.map((o, i) => (
          isSignedIn || i === 0 ? (
            <PBRow key={i} offer={o} balance={balance} />
          ) : (
            <PBLockedOfferRow key={i} offer={o} balance={balance} onSignUp={onSignUp} />
          )
        ))}
      </div>
    </div>
  );
}

/* ---------- Hero ---------- */
function PBBalanceInput({
  balance,
  onBalanceChange,
  onSubmit,
}: {
  balance: number;
  onBalanceChange: (n: number) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="pb-balance-input"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="pb-balance-input-label" htmlFor="pb-hero-balance">
        Your points balance
      </label>
      <div className="pb-balance-action">
        <span className="pb-balance-input-field">
          <input
            id="pb-hero-balance"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={Number.isFinite(balance) ? balance : 0}
            onChange={(e) => {
              const next = Math.max(0, Number(e.target.value) || 0);
              onBalanceChange(next);
              trackPointsEnteredDebounced("balance", next, "a");
            }}
            aria-label="Your points balance"
          />
          <span className="pb-balance-input-unit">pts</span>
        </span>
        <button className="pb-hero-cta" type="submit">
          Build My Points Travel Plan →
        </button>
      </div>
      <span className="pb-balance-input-hint">We&apos;ll show what you can book now vs. what to save for.</span>
    </form>
  );
}

function PBHero({
  selectedId,
  selectedDestination,
  onSelect,
  onCustomDestination,
  balance,
  onBalanceChange,
}: {
  selectedId: string;
  selectedDestination: Destination;
  onSelect: (id: string) => void;
  onCustomDestination: (place: string) => void;
  balance: number;
  onBalanceChange: (n: number) => void;
}) {
  const sel = selectedDestination;
  const pinned = DESTINATIONS.map((d) => ({ ...d, pinColor: TONE_VAR[summarize(d).tone] }));
  const scrollToCompare = () => {
    const el = document.getElementById("compare");
    if (el) window.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  };

  return (
    <section className="pb-hero" id="explore">
      <div className="pb-hero-bg">
        <div className="pb-hero-photo" />
        <div className="pb-hero-scrim" />
      </div>
      <div className="pb-hero-inner">
        <div className="pb-hero-copy">
          <span className="pb-eyebrow">Your personal miles concierge</span>
          <h1 className="pb-hero-title">
            Use points now or save them for a better trip?
            <br />
            There&apos;s a right answer.
          </h1>
          <p className="pb-hero-lede">
            Get guidance based on your current points, future trips, and travel goals.
          </p>
          <PBBalanceInput balance={balance} onBalanceChange={onBalanceChange} onSubmit={scrollToCompare} />
        </div>

        <div className="pb-map-card">
          <div className="pb-map-card-head">
            <div>
              <div className="pb-map-card-title">Where to?</div>
              <div className="pb-map-card-sub">Tap a destination to compare</div>
            </div>
            {sel && (
              <div className="pb-map-current" style={{ "--accent": sel.accent } as React.CSSProperties}>
                <span className="pb-map-current-flag">{sel.flag}</span>
                <span className="pb-map-current-city">{sel.city}</span>
              </div>
            )}
          </div>
          <WorldMap
            destinations={pinned}
            selectedId={selectedId}
            onSelect={onSelect}
            onCustomDestination={onCustomDestination}
            dotColor={DOT_COLOR}
          />
          <div className="pb-map-legend">
            <span className="pb-leg">
              <i className="dot save" /> Worth waiting
            </span>
            <span className="pb-leg">
              <i className="dot now" /> Book now
            </span>
            <span className="pb-map-hint">{DESTINATIONS.length} destinations · more soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PBHow() {
  const steps = [
    { n: "1", t: "Pick a destination", d: "Tap anywhere on the map — flights and hotels load instantly." },
    { n: "2", t: "See now vs. later", d: "We forecast each award's cheapest window over the next 12 months." },
    { n: "3", t: "Get the verdict", d: "Your butler tells you to book now or hold — and exactly how much you'd save." },
  ];
  return (
    <section className="pb-how" id="how">
      <div className="pb-how-head">
        <span className="pb-eyebrow dark">How it works</span>
        <h2 className="pb-h2">Spend points on the trip that&apos;s actually worth it.</h2>
      </div>
      <div className="pb-how-grid">
        {steps.map((s) => (
          <div className="pb-how-card" key={s.n}>
            <span className="pb-how-n">{s.n}</span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function VariantA() {
  const auth = useAuth();
  const [selectedId, setSelectedId] = useState("maldives");
  const [customDestination, setCustomDestination] = useState<Destination | null>(null);
  const [balance, setBalance] = useState(186400);
  const selectedDestination = DESTINATIONS.find((d) => d.id === selectedId) ?? customDestination;
  const dest = selectedDestination ?? DESTINATIONS[0];
  const summary = summarize(dest);
  const isSignedIn = Boolean(auth.userEmail);
  const openSignUp = () => auth.openAuthModal("sign-up");

  const onSelect = (id: string) => {
    setCustomDestination(null);
    setSelectedId(id);
    trackMapPin(id, "select", "a");
    if (typeof window !== "undefined") {
      const el = document.getElementById("compare");
      if (el) window.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    }
  };

  const onCustomDestination = (place: string) => {
    const existing = findDestinationByQuery(place);
    if (existing) {
      onSelect(existing.id);
      return;
    }
    const next = makeCustomDestination(place, dest);
    setCustomDestination(next);
    setSelectedId(next.id);
    trackMapPin(next.id, "select", "a");
  };

  return (
    <div id="top" className="pb-app">
      <PBNav
        balance={balance}
        userEmail={auth.userEmail}
        isSubmitting={auth.isSubmitting}
        onSignIn={() => auth.openAuthModal("sign-in")}
        onSignOut={auth.handleSignOut}
      />
      <PBHero
        selectedId={selectedId}
        selectedDestination={dest}
        onSelect={onSelect}
        onCustomDestination={onCustomDestination}
        balance={balance}
        onBalanceChange={setBalance}
      />
      <section className="pb-compare" id="compare">
        <div className="pb-compare-head">
          <span className="pb-eyebrow dark">Now vs. save</span>
          <h2 className="pb-h2">Should you use points for {dest.city} — or save them?</h2>
          <p className="pb-compare-lede">{dest.blurb}</p>
        </div>
        <PBVerdict
          dest={dest}
          summary={summary}
          framing={FRAMING}
          balance={balance}
          isSignedIn={isSignedIn}
          onSignUp={openSignUp}
        />
        <PBTable dest={dest} balance={balance} isSignedIn={isSignedIn} onSignUp={openSignUp} />
      </section>
      <PBHow />
      <PBFooter />
      {auth.isAuthOpen ? <AuthModal {...auth} /> : null}
      <ValueChat />
    </div>
  );
}
