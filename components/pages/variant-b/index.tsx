"use client";

/* My Points Butler — Variant B: Wallet-matched Deal Alerts.
   Same visual DNA as Variant A (reuses its base styles, world map and data),
   turned around the wallet: tell us what you hold, we match deals to your
   balance and ping you when one drops into range. */

import { useRef, useState } from "react";
import {
  DESTINATIONS,
  findDestinationByQuery,
  makeCustomDestination,
  summarize,
  fmt,
  type Destination,
} from "../variant-a/data";
import { WorldMap } from "../variant-a/world-map";
import { AuthModal, useAuth } from "../auth";
import { PBFeedbackModal } from "../feedback-modal";
import { PBFooter } from "../footer";
import { PBNavMark } from "../nav-mark";
import { PBShareButton } from "../share-button";
import {
  EVENTS,
  track,
  trackCardAdded,
  trackCardRemoved,
  trackCta,
  trackGate,
  trackMapPin,
  trackSubscribe,
} from "@/lib/analytics";
import {
  PB_PROGRAMS,
  pbPools,
  pbMatch,
  pbPoolForTab,
  pbWalletSummary,
  type Pools,
  type WalletEntry,
  type WalletType,
  type MatchKey,
  type WalletSummary,
} from "./wallet";
import "../variant-a/variant-a.css";
import "./variant-b.css";
import ValueChat from "../value-chat";

const TONE_VAR = {
  save: "var(--save)",
  now: "var(--now)",
  neutral: "var(--brand)",
} as const;

const DOT_COLOR = "#C2AE9F";

/* Wallet starts empty — the user builds it by tapping the programs they hold. */
const WALLET_TYPES = Object.keys(PB_PROGRAMS) as WalletType[];

/* ---------- Nav with planner ↔ alerts mode switch ---------- */
function PBNavModes({
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
          <PBNavMark size={20} />
        </span>
        <span className="pb-brand-name">My Points Butler</span>
      </a>
      <div className="pb-nav-right">
        {userEmail ? <span className="pb-nav-user">{userEmail}</span> : null}
        <PBShareButton variant="b" />
        <div className="pb-balance" title="Your combined wallet">
          <span className="pb-balance-label">Wallet</span>
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

/* ---------- Wallet builder ----------
   Tap-to-add: every program is shown as a pill grouped by category, so it's
   obvious you can pick several. Tapping one drops it into your balances list
   with an inline points field; tapping again removes it. No preselected
   defaults — the wallet starts empty and the user builds it. */
function PBWalletBuilder({
  wallet,
  onAdd,
  onRemove,
  onUpdate,
}: {
  wallet: WalletEntry[];
  onAdd: (entry: WalletEntry) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, points: number) => void;
}) {
  const pools = pbPools(wallet);
  // Monotonic id source (avoids impure Date.now in render) + the id awaiting
  // focus once its balance field mounts.
  const nextId = useRef(1);
  const pendingFocus = useRef<number | null>(null);
  // Track each program's first real balance once, so analytics fires on a
  // meaningful "card added" (positive points) rather than on the empty tap.
  const tracked = useRef(new Set<string>());

  const entryFor = (program: string) => wallet.find((w) => w.program === program);

  const toggle = (type: WalletType, program: string) => {
    const existing = entryFor(program);
    if (existing) {
      trackCardRemoved(existing.id, program, type);
      tracked.current.delete(program);
      onRemove(existing.id);
    } else {
      const id = nextId.current++;
      pendingFocus.current = id;
      onAdd({ id, type, program, points: 0 });
    }
  };

  const setBalance = (entry: WalletEntry, raw: string) => {
    const pts = parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
    onUpdate(entry.id, pts);
    if (pts > 0 && !tracked.current.has(entry.program)) {
      tracked.current.add(entry.program);
      trackCardAdded(entry.type, entry.program, pts);
    }
  };

  return (
    <div className="pb-wallet">
      <div className="pb-wallet-head">
        <div>
          <div className="pb-wallet-title">Your points wallet</div>
          <div className="pb-wallet-sub">Tap every card, airline &amp; hotel you have.</div>
        </div>
        <div className="pb-wallet-total">
          <span className="pb-wallet-total-num">{fmt(pools.total)}</span>
          <span className="pb-wallet-total-unit">total pts</span>
        </div>
      </div>

      <div className="pb-picker">
        {WALLET_TYPES.map((t) => (
          <div className="pb-picker-group" key={t}>
            <span className="pb-picker-label">{PB_PROGRAMS[t].label}s</span>
            <div className="pb-picker-pills">
              {PB_PROGRAMS[t].list.map((p) => {
                const on = Boolean(entryFor(p));
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    className={"pb-prog type-" + t + (on ? " is-on" : "")}
                    onClick={() => toggle(t, p)}
                  >
                    <span className="pb-prog-ic" aria-hidden="true">
                      {PB_PROGRAMS[t].icon}
                    </span>
                    <span className="pb-prog-name">{p}</span>
                    <span className="pb-prog-mark" aria-hidden="true">
                      {on ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {wallet.length === 0 ? (
        <div className="pb-wallet-empty">
          <span className="pb-wallet-empty-ic" aria-hidden="true">
            👆
          </span>
          <span>
            Tap the programs you hold — add as many as you like. We&apos;ll match deals to your balance.
          </span>
        </div>
      ) : (
        <div className="pb-balances">
          <div className="pb-balances-head">
            Your balances <span>{wallet.length} added</span>
          </div>
          {wallet.map((w) => (
            <div className={"pb-bal type-" + w.type} key={w.id}>
              <span className="pb-bal-ic" aria-hidden="true">
                {PB_PROGRAMS[w.type].icon}
              </span>
              <span className="pb-bal-name">{w.program}</span>
              <span className="pb-bal-field">
                <input
                  ref={(el) => {
                    if (el && pendingFocus.current === w.id) {
                      el.focus();
                      pendingFocus.current = null;
                    }
                  }}
                  className="pb-bal-input"
                  inputMode="numeric"
                  aria-label={w.program + " points balance"}
                  placeholder="0"
                  value={w.points > 0 ? w.points.toLocaleString("en-US") : ""}
                  onChange={(e) => setBalance(w, e.target.value)}
                />
                <span className="pb-bal-unit">pts</span>
              </span>
              <button
                type="button"
                className="pb-bal-x"
                aria-label={"Remove " + w.program}
                onClick={() => {
                  trackCardRemoved(w.id, w.program, w.type);
                  tracked.current.delete(w.program);
                  onRemove(w.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pb-pool-row">
        <div className="pb-pool">
          <span className="pb-pool-ic">✈</span> Flights pool <strong>{fmt(pools.flight)}</strong>
        </div>
        <div className="pb-pool">
          <span className="pb-pool-ic">🏨</span> Hotels pool <strong>{fmt(pools.stay)}</strong>
        </div>
        <div className="pb-pool-note">Card points transfer to either</div>
      </div>

      <a className="pb-hero-cta pb-wallet-cta" href="#match">
        Build My Points Travel Plan →
      </a>
    </div>
  );
}

/* ---------- Hero ---------- */
function PBHeroAlerts({
  selectedId,
  selectedDestination,
  onSelect,
  onCustomDestination,
  wallet,
  onAdd,
  onRemove,
  onUpdate,
}: {
  selectedId: string;
  selectedDestination: Destination;
  onSelect: (id: string) => void;
  onCustomDestination: (place: string) => void;
  wallet: WalletEntry[];
  onAdd: (entry: WalletEntry) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, points: number) => void;
}) {
  const sel = selectedDestination;
  const pinned = DESTINATIONS.map((d) => ({ ...d, pinColor: TONE_VAR[summarize(d).tone] }));
  return (
    <section className="pb-hero pb-hero-alerts" id="explore">
      <div className="pb-hero-bg">
        <div className="pb-hero-photo" />
        <div className="pb-hero-scrim" />
      </div>
      <div className="pb-hero-inner-alerts">
        <div className="pb-hero-copy center">
          <span className="pb-eyebrow">Wallet-matched deal alerts</span>
          <h1 className="pb-hero-title">
            Get alerts when a deal matches your actual points balance. ⭐
          </h1>
          <p className="pb-hero-lede">
            See whether transferring points could unlock better travel value.
          </p>
        </div>
        <div className="pb-hero-grid">
          <PBWalletBuilder wallet={wallet} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} />
          <div className="pb-map-card pb-map-card-sm">
            <div className="pb-map-card-head">
              <div>
                <div className="pb-map-card-title">Where to?</div>
                <div className="pb-map-card-sub">Tap a destination</div>
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
                <i className="dot save" /> Fits now
              </span>
              <span className="pb-leg">
                <i className="dot now" /> Stretch
              </span>
              <span className="pb-map-hint">{DESTINATIONS.length} destinations</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Match summary + alert CTA ---------- */
function PBMatchBadge({ k, small }: { k: MatchKey; small?: boolean }) {
  const map = {
    now: { c: "save", ic: "✓", t: "Bookable now" },
    wait: { c: "wait", ic: "⏳", t: "Unlocks if you wait" },
    short: { c: "short", ic: "—", t: "Keep saving" },
  } as const;
  const m = map[k];
  return (
    <span className={"pb-mbadge is-" + m.c + (small ? " sm" : "")}>
      <span className="pb-mbadge-ic" aria-hidden="true">
        {m.ic}
      </span>
      {m.t}
    </span>
  );
}

function PBMatchSummary({ dest, ws }: { dest: Destination; ws: WalletSummary }) {
  const tone = ws.now.length > 0 ? "save" : ws.wait.length > 0 ? "wait" : "short";
  const headline =
    ws.now.length > 0
      ? `${ws.now.length} of ${ws.total} ${dest.city} deals fit your wallet today.`
      : ws.wait.length > 0
      ? `Nothing fits yet — but ${ws.wait.length} unlock if you wait.`
      : `Keep saving for ${dest.city}.`;

  return (
    <div className="pb-vc-left pb-ms" data-tone={tone}>
      <div className="pb-vc-eyebrow">Wallet match · {dest.city}</div>
      <h3 className="pb-ms-headline">{headline}</h3>

      <div className="pb-ms-counts">
        <div className="pb-ms-count is-save">
          <span className="pb-ms-n">{ws.now.length}</span>
          <span className="pb-ms-l">
            bookable
            <br />
            now
          </span>
        </div>
        <div className="pb-ms-count is-wait">
          <span className="pb-ms-n">{ws.wait.length}</span>
          <span className="pb-ms-l">
            unlock if
            <br />
            you wait
          </span>
        </div>
        <div className="pb-ms-count is-short">
          <span className="pb-ms-n">{ws.short.length}</span>
          <span className="pb-ms-l">
            keep
            <br />
            saving
          </span>
        </div>
      </div>

      {ws.topUnlock && (
        <div className="pb-unlock">
          <span className="pb-unlock-ic" aria-hidden="true">
            🔓
          </span>
          <div>
            <strong>{ws.topUnlock.o.name}</strong> drops to {fmt(ws.topUnlock.o.later)} pts in{" "}
            {ws.topUnlock.o.when} — inside your {fmt(ws.topUnlock.pool)} pt{" "}
            {ws.topUnlock.kind === "hotel" ? "hotels" : "flights"} pool.
          </div>
        </div>
      )}
    </div>
  );
}

function PBAlertCTA({
  dest,
  pools,
  ws,
  isSignedIn,
}: {
  dest: Destination;
  pools: Pools;
  ws: WalletSummary;
  isSignedIn: boolean;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const watching = ws.wait.length + ws.short.length;
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  // The alert isn't really wired to a backend — confirm the (mock) success and
  // prompt the tester for feedback.
  const setAlert = () => {
    trackCta("set_alert", "b", dest.id);
    track(EVENTS.ALERT_CREATED, { destId: dest.id, email, watching });
    if (valid) trackSubscribe(email, "alert_cta", "b");
    setSent(true);
    setFeedback(true);
  };

  return (
    <div className="pb-al">
      {!isSignedIn ? (
        <>
          <div className="pb-al-badge">🔒 Account alert</div>
          <h3 className="pb-al-title">Sign up to watch {dest.city} against your wallet.</h3>
          <p className="pb-al-copy">
            We&apos;ll keep this match list tied to your balances and notify you when one of{" "}
            <strong>{watching}</strong> watched award{watching === 1 ? "" : "s"} drops into range.
          </p>
          <button
            type="button"
            className="pb-al-btn pb-al-btn-full"
            onClick={() => setFeedback(true)}
          >
            Alert me when it&apos;s bookable
          </button>
          <div className="pb-al-meta">
            <span className="pb-al-trigger">
              Unlocks: <strong>saved wallet, alerts, and watched trips</strong>
            </span>
          </div>
        </>
      ) : !sent ? (
        <>
          <div className="pb-al-badge">🔔 Deal alert</div>
          <h3 className="pb-al-title">Ping me when a {dest.city} deal fits my wallet.</h3>
          <p className="pb-al-copy">
            We watch every award daily and email you the moment one lands inside your{" "}
            <strong>{fmt(pools.total)}</strong> pt wallet.
          </p>
          <div className="pb-al-form">
            <input
              className="pb-input pb-al-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) setAlert();
              }}
            />
            <button type="button" className="pb-al-btn" disabled={!valid} onClick={setAlert}>
              Alert me
            </button>
          </div>
          <div className="pb-al-meta">
            <span className="pb-al-trigger">
              Alert when: <strong>a deal drops within my balance</strong>
            </span>
            <span className="pb-al-watch">
              Watching {watching} award{watching === 1 ? "" : "s"} for you
            </span>
          </div>
        </>
      ) : (
        <div className="pb-al-done">
          <div className="pb-al-check" aria-hidden="true">
            ✓
          </div>
          <h3 className="pb-al-title">You&apos;re set.</h3>
          <p className="pb-al-copy">
            We&apos;ll email <strong>{email}</strong> the moment a {dest.city} deal drops into your{" "}
            {fmt(pools.total)} pt wallet. Watching {watching} award{watching === 1 ? "" : "s"}.
          </p>
          <button type="button" className="pb-al-edit" onClick={() => setSent(false)}>
            Edit alert
          </button>
        </div>
      )}
      {feedback && (
        <PBFeedbackModal
          context={`${dest.city} deal alert signup`}
          onClose={() => setFeedback(false)}
        />
      )}
    </div>
  );
}

function PBMatchCard({
  dest,
  pools,
  ws,
  isSignedIn,
}: {
  dest: Destination;
  pools: Pools;
  ws: WalletSummary;
  isSignedIn: boolean;
}) {
  return (
    <div
      className={
        "pb-verdict-card pb-match-card tone-" +
        (ws.now.length ? "save" : ws.wait.length ? "neutral" : "now")
      }
      style={{ "--accent": dest.accent } as React.CSSProperties}
    >
      <PBMatchSummary dest={dest} ws={ws} />
      <div className="pb-vc-right pb-al-wrap">
        <PBAlertCTA dest={dest} pools={pools} ws={ws} isSignedIn={isSignedIn} />
      </div>
    </div>
  );
}

/* ---------- Wallet-match table ---------- */
function PBCoverage({
  pool,
  now,
  later,
  m,
}: {
  pool: number;
  now: number;
  later: number;
  m: ReturnType<typeof pbMatch>;
}) {
  const fillPct = Math.min(100, (pool / now) * 100);
  const tickPct = Math.min(100, (later / now) * 100);
  const cap =
    m.key === "now" ? "Fully covered" : m.key === "wait" ? "Covered if you wait" : "Short " + fmt(now - pool);
  return (
    <div className="pb-cov">
      <div className="pb-cov-track">
        <div className={"pb-cov-fill is-" + m.key} style={{ width: fillPct + "%" }} />
        <div className="pb-cov-tick" style={{ left: tickPct + "%" }} title={"Drops to " + fmt(later)} />
      </div>
      <div className={"pb-cov-cap is-" + m.key}>{cap}</div>
    </div>
  );
}

function PBMatchRow({ offer, pool }: { offer: Destination["flights"][number]; pool: number }) {
  const m = pbMatch(pool, offer.now, offer.later);
  return (
    <div className={"pb-row pb-mrow match-" + m.key}>
      <div className="pb-cell pb-cell-name" data-label="Option">
        <div className="pb-row-name">{offer.name}</div>
        <div className="pb-row-sub">{offer.sub}</div>
      </div>
      <div className="pb-cell pb-cell-num" data-label="Cost now">
        <span className="pb-num">{fmt(offer.now)}</span>
        <span className="pb-num-unit">pts</span>
      </div>
      <div className="pb-cell pb-cell-num" data-label="Best later">
        <span className="pb-num">{fmt(offer.later)}</span>
        <span className="pb-num-unit">pts</span>
        <span className="pb-when">{offer.when}</span>
      </div>
      <div className="pb-cell pb-cell-cov" data-label="Your wallet">
        <PBCoverage pool={pool} now={offer.now} later={offer.later} m={m} />
      </div>
      <div className="pb-cell pb-cell-verdict" data-label="Status">
        <PBMatchBadge k={m.key} />
      </div>
    </div>
  );
}

function PBLockedMatchRow({
  offer,
  pool,
  onSignUp,
}: {
  offer: Destination["flights"][number];
  pool: number;
  onSignUp: () => void;
}) {
  return (
    <div className="pb-row-lock">
      <div className="pb-row-lock-preview" aria-hidden="true">
        <PBMatchRow offer={offer} pool={pool} />
      </div>
      <div className="pb-row-lock-cta">
        <span>Unlock all wallet matches for this tab</span>
        <button
          type="button"
          onClick={() => {
            trackGate("locked_match_row", "b");
            onSignUp();
          }}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

function PBMatchTable({
  dest,
  pools,
  isSignedIn,
  onSignUp,
}: {
  dest: Destination;
  pools: Pools;
  isSignedIn: boolean;
  onSignUp: () => void;
}) {
  const [tab, setTab] = useState<"flights" | "hotels">("flights");
  const rows = tab === "flights" ? dest.flights : dest.hotels;
  const pool = pbPoolForTab(pools, tab);
  const switchTab = (next: "flights" | "hotels") => {
    setTab(next);
    track(EVENTS.RESULT_TAB_SWITCHED, { variant: "b", tab: next, destId: dest.id });
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
          Matched against your <strong>{fmt(pool)}</strong> pt {tab === "hotels" ? "hotels" : "flights"} pool
        </div>
      </div>
      <div className="pb-table">
        <div className="pb-row pb-row-head">
          <div className="pb-cell pb-cell-name">Option</div>
          <div className="pb-cell pb-cell-num">Cost now</div>
          <div className="pb-cell pb-cell-num">Best later</div>
          <div className="pb-cell pb-cell-cov">Your wallet covers</div>
          <div className="pb-cell pb-cell-verdict">Status</div>
        </div>
        {rows.map((o, i) => (
          isSignedIn || i === 0 ? (
            <PBMatchRow key={i} offer={o} pool={pool} />
          ) : (
            <PBLockedMatchRow key={i} offer={o} pool={pool} onSignUp={onSignUp} />
          )
        ))}
      </div>
    </div>
  );
}

function PBHowAlerts() {
  const steps = [
    { n: "1", t: "Load your wallet", d: "Add each card, airline and hotel balance — card points count toward both flights and hotels." },
    { n: "2", t: "Pick a destination", d: "We match every flight and hotel award against what you can actually spend." },
    { n: "3", t: "Get the alert", d: "When a deal drops into your range — now or after a forecast dip — we ping you instantly." },
  ];
  return (
    <section className="pb-how" id="how">
      <div className="pb-how-head">
        <span className="pb-eyebrow dark">How alerts work</span>
        <h2 className="pb-h2">Stop guessing. Get pinged when it&apos;s actually bookable.</h2>
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

export default function VariantB() {
  const auth = useAuth();
  const [selectedId, setSelectedId] = useState("maldives");
  const [customDestination, setCustomDestination] = useState<Destination | null>(null);
  const [wallet, setWallet] = useState<WalletEntry[]>([]);
  const selectedDestination = DESTINATIONS.find((d) => d.id === selectedId) ?? customDestination;
  const dest = selectedDestination ?? DESTINATIONS[0];
  const pools = pbPools(wallet);
  const ws = pbWalletSummary(dest, pools);
  const isSignedIn = Boolean(auth.userEmail);
  const openSignUp = () => auth.openAuthModal("sign-up");

  const onSelect = (id: string) => {
    setCustomDestination(null);
    setSelectedId(id);
    trackMapPin(id, "select", "b");
    if (typeof window !== "undefined") {
      const el = document.getElementById("match");
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
    trackMapPin(next.id, "select", "b");
  };
  const onAdd = (entry: WalletEntry) => setWallet((w) => [...w, entry]);
  const onRemove = (id: number) => setWallet((w) => w.filter((x) => x.id !== id));
  const onUpdate = (id: number, points: number) =>
    setWallet((w) => w.map((x) => (x.id === id ? { ...x, points } : x)));

  return (
    <div id="top" className="pb-app">
      <PBNavModes
        balance={pools.total}
        userEmail={auth.userEmail}
        isSubmitting={auth.isSubmitting}
        onSignIn={() => auth.openAuthModal("sign-up")}
        onSignOut={auth.handleSignOut}
      />
      <PBHeroAlerts
        selectedId={selectedId}
        selectedDestination={dest}
        onSelect={onSelect}
        onCustomDestination={onCustomDestination}
        wallet={wallet}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdate={onUpdate}
      />
      <section className="pb-compare" id="match">
        <div className="pb-compare-head">
          <span className="pb-eyebrow dark">Wallet-matched deals</span>
          <h2 className="pb-h2">What your points actually unlock in {dest.city}.</h2>
          <p className="pb-compare-lede">{dest.blurb}</p>
        </div>
        <PBMatchCard dest={dest} pools={pools} ws={ws} isSignedIn={isSignedIn} />
        <PBMatchTable dest={dest} pools={pools} isSignedIn={isSignedIn} onSignUp={openSignUp} />
      </section>
      <PBHowAlerts />
      <PBFooter />
      {auth.isAuthOpen ? <AuthModal {...auth} /> : null}
      <ValueChat />
    </div>
  );
}
