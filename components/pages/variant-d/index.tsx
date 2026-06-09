"use client";

/* My Points Butler — Variant D: Personalized trip discovery.
   "See trips you can book with your current points, based on places you like."
   Reuses Variant A's data and the shared alerts/base styles. */

import { useState } from "react";
import { DESTINATIONS, INTERESTS, tripCost, fmt, type Destination } from "../variant-a/data";
import { PBModeNav } from "../mode-nav";
import "../variant-a/variant-a.css";
import "../variant-b/variant-b.css";
import "./variant-d.css";

interface ScoredTrip {
  d: Destination;
  matched: string[];
  pct: number | null;
  cost: number;
  affordable: boolean;
  gap: number;
}

function PBTasteBar({
  interests,
  selected,
  onToggle,
  points,
  onPoints,
  fitsOnly,
  onFits,
  count,
}: {
  interests: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  points: number;
  onPoints: (n: number) => void;
  fitsOnly: boolean;
  onFits: (v: boolean) => void;
  count: number;
}) {
  return (
    <div className="pb-wallet pb-taste">
      <div className="pb-wallet-head">
        <div>
          <div className="pb-wallet-title">What are you into?</div>
          <div className="pb-wallet-sub">
            Pick a few vibes — we&apos;ll surface trips that fit you and your points.
          </div>
        </div>
      </div>
      <div className="pb-taste-chips">
        {interests.map((tag) => (
          <button
            key={tag}
            type="button"
            className={"pb-tchip" + (selected.includes(tag) ? " is-on" : "")}
            aria-pressed={selected.includes(tag)}
            onClick={() => onToggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="pb-taste-foot">
        <label className="pb-field">
          <span className="pb-field-label">Points to spend</span>
          <input
            className="pb-input pb-input-wide"
            inputMode="numeric"
            value={fmt(points)}
            onChange={(e) => onPoints(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
          />
        </label>
        <button
          type="button"
          className={"pb-fits" + (fitsOnly ? " is-on" : "")}
          aria-pressed={fitsOnly}
          onClick={() => onFits(!fitsOnly)}
        >
          <span className="pb-fits-dot" /> Only what fits my points
        </button>
        <span className="pb-taste-count">
          {count} trip{count === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function PBTripCard({ s, selected }: { s: ScoredTrip; selected: string[] }) {
  const { d, pct, cost, affordable, gap } = s;
  return (
    <article className="pb-trip" style={{ "--accent": d.accent } as React.CSSProperties}>
      <div className="pb-trip-top">
        <span className="pb-trip-flag">{d.flag}</span>
        {pct != null && (
          <span className="pb-trip-match">
            <span className="pb-trip-match-n">{pct}%</span> your vibe
          </span>
        )}
        <div className="pb-trip-loc">
          <span className="pb-trip-city">{d.city}</span>
          <span className="pb-trip-country">{d.country}</span>
        </div>
      </div>
      <div className="pb-trip-body">
        <p className="pb-trip-vibe">{d.vibe}</p>
        <div className="pb-trip-tags">
          {d.tags.map((tag) => (
            <span key={tag} className={"pb-ttag" + (selected.includes(tag) ? " is-match" : "")}>
              {tag}
            </span>
          ))}
        </div>
        <div className="pb-trip-foot">
          <div className="pb-trip-price">
            <span className="pb-trip-price-lbl">3-night getaway from</span>
            <span className="pb-trip-price-n">
              {fmt(cost)} <span>pts</span>
            </span>
          </div>
          {affordable ? (
            <span className="pb-mbadge is-save sm">
              <span className="pb-mbadge-ic" aria-hidden="true">
                ✓
              </span>
              Bookable now
            </span>
          ) : (
            <span className="pb-mbadge is-now sm">
              <span className="pb-mbadge-ic" aria-hidden="true">
                ↑
              </span>
              {fmt(gap)} short
            </span>
          )}
        </div>
        <button type="button" className="pb-trip-cta">
          See the deal →
        </button>
      </div>
    </article>
  );
}

function PBHowDiscover() {
  const steps = [
    { n: "1", t: "Tell us your taste", d: "Beaches, food, nightlife, nature — pick the vibes that are actually you." },
    { n: "2", t: "We match your points", d: "Every trip is priced for a 3-night getaway and checked against your balance." },
    { n: "3", t: "Book what fits", d: "See exactly what's within reach today — no aspirational fantasy you can't afford." },
  ];
  return (
    <section className="pb-how" id="how">
      <div className="pb-how-head">
        <span className="pb-eyebrow dark">How discovery works</span>
        <h2 className="pb-h2">Trips picked for your taste — and your balance.</h2>
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
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path
                d="M12 3c-3.3 0-6 2.6-6 5.8 0 1.8.9 3.2 2 4.2v2h8v-2c1.1-1 2-2.4 2-4.2C18 5.6 15.3 3 12 3Z"
                fill="currentColor"
              />
              <rect x="7" y="16.5" width="10" height="2.4" rx="1.2" fill="currentColor" />
              <circle cx="12" cy="20.4" r="1.4" fill="currentColor" />
            </svg>
          </span>
          My Points Butler
        </div>
        <p className="pb-footer-note">
          mypointsbutler.com · 3-night pricing uses the cheapest current flight + hotel award. Real availability
          may vary.
        </p>
      </div>
    </footer>
  );
}

export default function VariantD() {
  const [selected, setSelected] = useState(["Beaches", "Food"]);
  const [points, setPoints] = useState(206000);
  const [fitsOnly, setFitsOnly] = useState(false);

  const onToggle = (tag: string) =>
    setSelected((s) => (s.includes(tag) ? s.filter((x) => x !== tag) : [...s, tag]));

  const scored: ScoredTrip[] = DESTINATIONS.map((d) => {
    const matched = d.tags.filter((tag) => selected.includes(tag));
    const pct = selected.length ? Math.min(100, Math.round((matched.length / selected.length) * 100)) : null;
    const cost = tripCost(d, "now", 3);
    const affordable = points >= cost;
    return { d, matched, pct, cost, affordable, gap: Math.max(0, cost - points) };
  });
  let list = scored.slice();
  if (selected.length) list = list.filter((s) => s.matched.length > 0);
  if (fitsOnly) list = list.filter((s) => s.affordable);
  list.sort(
    (a, b) =>
      Number(b.affordable) - Number(a.affordable) ||
      b.matched.length - a.matched.length ||
      a.cost - b.cost,
  );

  const affordableCount = scored.filter((s) => s.affordable).length;

  return (
    <div id="top" className="pb-app">
      <PBModeNav active="discover" balance={points} balanceLabel="Points" />
      <section className="pb-hero pb-hero-alerts pb-hero-discover" id="explore">
        <div className="pb-hero-bg">
          <div className="pb-hero-photo" />
          <div className="pb-hero-scrim" />
        </div>
        <div className="pb-hero-inner-alerts">
          <div className="pb-hero-copy center">
            <span className="pb-eyebrow">Personalized trip discovery</span>
            <h1 className="pb-hero-title">
              Trips you can book <em>right now</em> — built around your taste.
            </h1>
            <p className="pb-hero-lede">
              No aspirational fantasy you can&apos;t afford. Tell us what you love and how many points you&apos;ve
              got — we&apos;ll show you what&apos;s genuinely within reach.
            </p>
          </div>
          <div className="pb-hero-single">
            <PBTasteBar
              interests={INTERESTS}
              selected={selected}
              onToggle={onToggle}
              points={points}
              onPoints={setPoints}
              fitsOnly={fitsOnly}
              onFits={setFitsOnly}
              count={list.length}
            />
          </div>
        </div>
      </section>

      <section className="pb-compare" id="discover">
        <div className="pb-compare-head">
          <span className="pb-eyebrow dark">For you, right now</span>
          <h2 className="pb-h2">
            {affordableCount} trips are bookable with your {fmt(points)} pts.
          </h2>
          <p className="pb-compare-lede">
            {selected.length ? `Matched to ${selected.join(", ")}.` : "Pick a vibe above to personalize."} Sorted
            by what fits and fits you best.
          </p>
        </div>
        {list.length === 0 ? (
          <div className="pb-empty">No trips match those filters yet. Try another vibe or raise your points.</div>
        ) : (
          <div className="pb-trip-grid">
            {list.map((s) => (
              <PBTripCard key={s.d.id} s={s} selected={selected} />
            ))}
          </div>
        )}
      </section>

      <PBHowDiscover />
      <PBFooter />
    </div>
  );
}
