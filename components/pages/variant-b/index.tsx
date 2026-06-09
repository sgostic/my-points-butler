"use client";

/* My Points Butler — Variant B: Wallet-matched Deal Alerts.
   Same visual DNA as Variant A (reuses its base styles, world map and data),
   turned around the wallet: tell us what you hold, we match deals to your
   balance and ping you when one drops into range. */

import { useState } from "react";
import { DESTINATIONS, summarize, fmt, type Destination } from "../variant-a/data";
import { WorldMap } from "../variant-a/world-map";
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

const TONE_VAR = {
  save: "var(--save)",
  now: "var(--now)",
  neutral: "var(--brand)",
} as const;

const DOT_COLOR = "#C2AE9F";

const DEFAULT_WALLET: WalletEntry[] = [
  { id: 1, type: "card", program: "Amex Membership Rewards", points: 120000 },
  { id: 2, type: "airline", program: "United MileagePlus", points: 48000 },
  { id: 3, type: "hotel", program: "World of Hyatt", points: 38000 },
];

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

/* ---------- Nav with planner ↔ alerts mode switch ---------- */
function PBNavModes({ balance }: { balance: number }) {
  return (
    <header className="pb-nav">
      <a className="pb-brand" href="#top">
        <span className="pb-brand-mark" aria-hidden="true">
          <ButlerMark size={20} />
        </span>
        <span className="pb-brand-name">My Points Butler</span>
      </a>
      <div className="pb-modeswitch" role="tablist" aria-label="Mode">
        <a className="pb-mode" href="?variant=a" role="tab">
          Use-now planner
        </a>
        <span className="pb-mode is-on" role="tab" aria-selected="true">
          Deal alerts
        </span>
      </div>
      <div className="pb-nav-right">
        <div className="pb-balance" title="Your combined wallet">
          <span className="pb-balance-label">Wallet</span>
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

/* ---------- Wallet builder ---------- */
function PBWalletBuilder({
  wallet,
  onAdd,
  onRemove,
}: {
  wallet: WalletEntry[];
  onAdd: (entry: WalletEntry) => void;
  onRemove: (id: number) => void;
}) {
  const [type, setType] = useState<WalletType>("card");
  const [program, setProgram] = useState(PB_PROGRAMS.card.list[0]);
  const [amount, setAmount] = useState("");
  const pools = pbPools(wallet);

  const pickType = (t: WalletType) => {
    setType(t);
    setProgram(PB_PROGRAMS[t].list[0]);
  };
  const add = () => {
    const pts = parseInt(String(amount).replace(/[^0-9]/g, ""), 10);
    if (!pts || pts <= 0) return;
    onAdd({ id: Date.now(), type, program, points: pts });
    setAmount("");
  };

  return (
    <div className="pb-wallet">
      <div className="pb-wallet-head">
        <div>
          <div className="pb-wallet-title">Your points wallet</div>
          <div className="pb-wallet-sub">Add what you actually have — we&apos;ll match deals to it.</div>
        </div>
        <div className="pb-wallet-total">
          <span className="pb-wallet-total-num">{fmt(pools.total)}</span>
          <span className="pb-wallet-total-unit">total pts</span>
        </div>
      </div>

      <div className="pb-wallet-form">
        <div className="pb-seg" role="tablist" aria-label="Program type">
          {(Object.keys(PB_PROGRAMS) as WalletType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              className={"pb-seg-btn" + (type === t ? " is-on" : "")}
              onClick={() => pickType(t)}
            >
              <span aria-hidden="true">{PB_PROGRAMS[t].icon}</span> {PB_PROGRAMS[t].label}
            </button>
          ))}
        </div>
        <div className="pb-wallet-row">
          <label className="pb-field pb-field-grow">
            <span className="pb-field-label">{PB_PROGRAMS[type].label} program</span>
            <select className="pb-select" value={program} onChange={(e) => setProgram(e.target.value)}>
              {PB_PROGRAMS[type].list.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="pb-field">
            <span className="pb-field-label">Points balance</span>
            <input
              className="pb-input"
              inputMode="numeric"
              placeholder="e.g. 120,000"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
            />
          </label>
          <button type="button" className="pb-add-btn" onClick={add}>
            + Add
          </button>
        </div>
      </div>

      {wallet.length > 0 && (
        <div className="pb-chips">
          {wallet.map((w) => (
            <span key={w.id} className={"pb-wchip type-" + w.type}>
              <span className="pb-wchip-ico" aria-hidden="true">
                {PB_PROGRAMS[w.type].icon}
              </span>
              <span className="pb-wchip-name">{w.program}</span>
              <span className="pb-wchip-pts">{fmt(w.points)}</span>
              <button
                type="button"
                className="pb-wchip-x"
                aria-label={"Remove " + w.program}
                onClick={() => onRemove(w.id)}
              >
                ×
              </button>
            </span>
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
    </div>
  );
}

/* ---------- Hero ---------- */
function PBHeroAlerts({
  selectedId,
  onSelect,
  wallet,
  onAdd,
  onRemove,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  wallet: WalletEntry[];
  onAdd: (entry: WalletEntry) => void;
  onRemove: (id: number) => void;
}) {
  const sel = DESTINATIONS.find((d) => d.id === selectedId);
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
            Get alerted the moment a deal <em>fits your wallet.</em>
          </h1>
          <p className="pb-hero-lede">
            Tell us what you actually hold and where you want to go. We&apos;ll watch every award and ping
            you the second one drops into your real points balance.
          </p>
        </div>
        <div className="pb-hero-grid">
          <PBWalletBuilder wallet={wallet} onAdd={onAdd} onRemove={onRemove} />
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
            <WorldMap destinations={pinned} selectedId={selectedId} onSelect={onSelect} dotColor={DOT_COLOR} />
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

function PBAlertCTA({ dest, pools, ws }: { dest: Destination; pools: Pools; ws: WalletSummary }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const watching = ws.wait.length + ws.short.length;
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  return (
    <div className="pb-al">
      {!sent ? (
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
                if (e.key === "Enter" && valid) setSent(true);
              }}
            />
            <button type="button" className="pb-al-btn" disabled={!valid} onClick={() => setSent(true)}>
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
    </div>
  );
}

function PBMatchCard({ dest, pools, ws }: { dest: Destination; pools: Pools; ws: WalletSummary }) {
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
        <PBAlertCTA dest={dest} pools={pools} ws={ws} />
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

function PBMatchTable({ dest, pools }: { dest: Destination; pools: Pools }) {
  const [tab, setTab] = useState<"flights" | "hotels">("flights");
  const rows = tab === "flights" ? dest.flights : dest.hotels;
  const pool = pbPoolForTab(pools, tab);
  return (
    <div className="pb-table-wrap">
      <div className="pb-tabs">
        <button
          type="button"
          className={"pb-tab" + (tab === "flights" ? " is-on" : "")}
          onClick={() => setTab("flights")}
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
          onClick={() => setTab("hotels")}
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
          <PBMatchRow key={i} offer={o} pool={pool} />
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

function PBFooter() {
  return (
    <footer className="pb-footer">
      <div className="pb-footer-inner">
        <div className="pb-footer-brand">
          <span className="pb-brand-mark sm" aria-hidden="true">
            <ButlerMark size={16} />
          </span>
          My Points Butler
        </div>
        <p className="pb-footer-note">
          mypointsbutler.com · Balances and forecasts are estimates. We never store card credentials — just
          the point totals you enter.
        </p>
      </div>
    </footer>
  );
}

export default function VariantB() {
  const [selectedId, setSelectedId] = useState("maldives");
  const [wallet, setWallet] = useState<WalletEntry[]>(DEFAULT_WALLET);
  const dest = DESTINATIONS.find((d) => d.id === selectedId) ?? DESTINATIONS[0];
  const pools = pbPools(wallet);
  const ws = pbWalletSummary(dest, pools);

  const onSelect = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      const el = document.getElementById("match");
      if (el) window.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    }
  };
  const onAdd = (entry: WalletEntry) => setWallet((w) => [...w, entry]);
  const onRemove = (id: number) => setWallet((w) => w.filter((x) => x.id !== id));

  return (
    <div id="top" className="pb-app">
      <PBNavModes balance={pools.total} />
      <PBHeroAlerts
        selectedId={selectedId}
        onSelect={onSelect}
        wallet={wallet}
        onAdd={onAdd}
        onRemove={onRemove}
      />
      <section className="pb-compare" id="match">
        <div className="pb-compare-head">
          <span className="pb-eyebrow dark">Wallet-matched deals</span>
          <h2 className="pb-h2">What your points actually unlock in {dest.city}.</h2>
          <p className="pb-compare-lede">{dest.blurb}</p>
        </div>
        <PBMatchCard dest={dest} pools={pools} ws={ws} />
        <PBMatchTable dest={dest} pools={pools} />
      </section>
      <PBHowAlerts />
      <PBFooter />
    </div>
  );
}
