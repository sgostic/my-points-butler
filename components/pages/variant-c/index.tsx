"use client";

/* My Points Butler — Variant C: Goal tracking.
   "Tell us your dream trips. We'll tell you what points to save, earn, or use."
   Reuses Variant A's world map + data and the shared alerts/base styles. */

import { useState } from "react";
import { DESTINATIONS, fmt } from "../variant-a/data";
import { WorldMap } from "../variant-a/world-map";
import { PBModeNav } from "../mode-nav";
import { pbEta, pbPlanGoals, type GoalPlan } from "./goals";
import "../variant-a/variant-a.css";
import "../variant-b/variant-b.css";
import "./variant-c.css";

const DOT_COLOR = "#C2AE9F";
const DEFAULT_GOALS = ["tokyo", "maldives", "capetown"];

/* Approximate points earned per $1 spent on a rewards card (blended rate). */
const PTS_PER_DOLLAR = 1.5;
const earnFromSpend = (spend: number) => Math.round(spend * PTS_PER_DOLLAR);

/* ---------- Points engine (inputs + roll-up) ---------- */
function PBGoalsEngine({
  current,
  spend,
  onCurrent,
  onSpend,
  plans,
}: {
  current: number;
  spend: number;
  onCurrent: (n: number) => void;
  onSpend: (n: number) => void;
  plans: GoalPlan[];
}) {
  const monthly = earnFromSpend(spend);
  const totalTarget = plans.reduce((s, p) => s + p.target, 0);
  const totalFunded = Math.min(current, totalTarget);
  const pct = totalTarget ? Math.round((totalFunded / totalTarget) * 100) : 0;
  const lastEta = plans.length ? plans[plans.length - 1].eta : "—";
  const allReady = plans.every((p) => p.gap === 0);

  return (
    <div className="pb-wallet pb-engine">
      <div className="pb-wallet-head">
        <div>
          <div className="pb-wallet-title">Your points engine</div>
          <div className="pb-wallet-sub">What you hold and how much you spend.</div>
        </div>
      </div>

      <div className="pb-eng-fields">
        <label className="pb-field pb-field-grow">
          <span className="pb-field-label">Points balance today</span>
          <input
            className="pb-input pb-input-wide"
            inputMode="numeric"
            value={fmt(current)}
            onChange={(e) => onCurrent(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
          />
        </label>
        <div className="pb-field pb-field-grow">
          <span className="pb-field-label">
            Spending <strong className="pb-eng-rate">${fmt(spend)}</strong> / month ·{" "}
            <span className="pb-eng-earn">≈ +{fmt(monthly)} pts</span>
          </span>
          <input
            className="pb-range"
            type="range"
            min={0}
            max={30000}
            step={500}
            value={spend}
            onChange={(e) => onSpend(parseInt(e.target.value, 10))}
          />
          <div className="pb-range-scale">
            <span>$0</span>
            <span>~{PTS_PER_DOLLAR} pts / $1</span>
            <span>$30k / mo</span>
          </div>
        </div>
      </div>

      <div className="pb-eng-roll">
        <div className="pb-eng-bar">
          <div className="pb-eng-bar-fill" style={{ width: pct + "%" }} />
        </div>
        <div className="pb-eng-stats">
          <span>
            <strong>{fmt(totalFunded)}</strong> of {fmt(totalTarget)} pts · {pct}% funded
          </span>
          <span className="pb-eng-eta">
            {allReady ? "All dreams ready to book 🎉" : `All funded by ${lastEta}`}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Goal card ---------- */
function PBGoalCard({
  plan,
  index,
  total,
  onRemove,
  onUp,
  onDown,
}: {
  plan: GoalPlan;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onUp: (id: string) => void;
  onDown: (id: string) => void;
}) {
  const { dest } = plan;
  const pct = Math.round(plan.pct * 100);
  const REC = {
    use: { c: "save", k: "Use now", t: "You've got enough — book the dream." },
    save: { c: "wait", k: "Keep saving", t: `On track for ${plan.eta} at this rate.` },
    earn: { c: "now", k: "Earn faster", t: `${fmt(plan.gap)} to go · ${plan.eta} at this rate.` },
  } as const;
  const rec = REC[plan.status];

  return (
    <div
      id={"goal-" + plan.id}
      className={"pb-goal tone-" + rec.c}
      style={{ "--accent": dest.accent } as React.CSSProperties}
    >
      <div className="pb-goal-rank">
        <button
          type="button"
          className="pb-goal-arrow"
          aria-label="Higher priority"
          disabled={index === 0}
          onClick={() => onUp(plan.id)}
        >
          ▲
        </button>
        <span className="pb-goal-num">#{index + 1}</span>
        <button
          type="button"
          className="pb-goal-arrow"
          aria-label="Lower priority"
          disabled={index === total - 1}
          onClick={() => onDown(plan.id)}
        >
          ▼
        </button>
      </div>

      <div className="pb-goal-body">
        <div className="pb-goal-head">
          <span className="pb-goal-flag">{dest.flag}</span>
          <div className="pb-goal-titles">
            <div className="pb-goal-city">
              {dest.city}, {dest.country}
            </div>
            <div className="pb-goal-vibe">{dest.vibe}</div>
          </div>
          <button type="button" className="pb-goal-x" aria-label="Remove goal" onClick={() => onRemove(plan.id)}>
            ×
          </button>
        </div>

        <div className="pb-goal-progwrap">
          <div className="pb-goal-prog">
            <div className={"pb-goal-prog-fill is-" + rec.c} style={{ width: Math.min(100, pct) + "%" }} />
          </div>
          <div className="pb-goal-nums">
            <span className="pb-goal-have">
              <strong>{fmt(plan.funded)}</strong> saved
            </span>
            <span className="pb-goal-target">
              of {fmt(plan.target)} pts · {dest.nights} nights
            </span>
            <span className="pb-goal-pct">{pct}%</span>
          </div>
        </div>

        <div className="pb-goal-foot">
          <span className={"pb-mbadge is-" + rec.c}>
            <span className="pb-mbadge-ic" aria-hidden="true">
              {plan.status === "use" ? "✓" : plan.status === "save" ? "⏳" : "↑"}
            </span>
            {rec.k}
          </span>
          <span className="pb-goal-rec">{rec.t}</span>
          {plan.status === "earn" && (
            <span className="pb-goal-boost">
              💳 A new-card bonus (~60k) gets you there by {pbEta(Math.max(0, plan.months - 4))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PBHeroGoals({
  goalIds,
  onToggle,
  current,
  spend,
  onCurrent,
  onSpend,
  plans,
}: {
  goalIds: string[];
  onToggle: (id: string) => void;
  current: number;
  spend: number;
  onCurrent: (n: number) => void;
  onSpend: (n: number) => void;
  plans: GoalPlan[];
}) {
  const pinned = DESTINATIONS.map((d) => ({
    ...d,
    pinColor: goalIds.includes(d.id) ? "var(--save)" : "var(--brand-2)",
  }));
  return (
    <section className="pb-hero pb-hero-alerts" id="explore">
      <div className="pb-hero-bg">
        <div className="pb-hero-photo" />
        <div className="pb-hero-scrim" />
      </div>
      <div className="pb-hero-inner-alerts">
        <div className="pb-hero-copy center">
          <span className="pb-eyebrow">Goal tracking</span>
          <h1 className="pb-hero-title">
            Tell us your dream trips. <em>We&apos;ll plan the points.</em>
          </h1>
          <p className="pb-hero-lede">
            Pin the places you&apos;re chasing. We&apos;ll tell you exactly what to save, earn, or use — and
            when each dream becomes bookable.
          </p>
        </div>
        <div className="pb-hero-grid">
          <PBGoalsEngine
            current={current}
            spend={spend}
            onCurrent={onCurrent}
            onSpend={onSpend}
            plans={plans}
          />
          <div className="pb-map-card pb-map-card-sm">
            <div className="pb-map-card-head">
              <div>
                <div className="pb-map-card-title">Add a dream trip</div>
                <div className="pb-map-card-sub">Tap to track · tap again to drop</div>
              </div>
            </div>
            <WorldMap destinations={pinned} selectedId="" onSelect={onToggle} dotColor={DOT_COLOR} />
            <div className="pb-map-legend">
              <span className="pb-leg">
                <i className="dot save" /> Tracking
              </span>
              <span className="pb-leg">
                <i className="dot" style={{ background: "var(--brand-2)" }} /> Tap to add
              </span>
              <span className="pb-map-hint">
                {goalIds.length} dream{goalIds.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PBHowGoals() {
  const steps = [
    { n: "1", t: "Pin your dreams", d: "Tap the trips you're chasing. We price each one at its cheapest forecast window." },
    { n: "2", t: "We do the math", d: "Your balance funds them in priority order; your monthly earn fills the rest." },
    { n: "3", t: "Save, earn, or use", d: "Each goal gets a clear call and an ETA — plus the fastest way to close the gap." },
  ];
  return (
    <section className="pb-how" id="how">
      <div className="pb-how-head">
        <span className="pb-eyebrow dark">How goals work</span>
        <h2 className="pb-h2">A real plan for every trip on your list.</h2>
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
          mypointsbutler.com · Targets use forecast best-window pricing and update as the market moves.
        </p>
      </div>
    </footer>
  );
}

export default function VariantC() {
  const [goalIds, setGoalIds] = useState(DEFAULT_GOALS);
  const [current, setCurrent] = useState(206000);
  const [spend, setSpend] = useState(12000);

  const goals = goalIds
    .map((id) => ({ id, dest: DESTINATIONS.find((d) => d.id === id) }))
    .filter((g): g is { id: string; dest: (typeof DESTINATIONS)[number] } => Boolean(g.dest));
  const plans = pbPlanGoals(goals, current, earnFromSpend(spend));

  const onToggle = (id: string) => {
    // Add a newly-tracked trip at the top (highest priority) so it's funded
    // from your balance first — its progress then reflects your points.
    setGoalIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [id, ...g]));
    // Reveal the change below: scroll to the tracked city's card (or the list).
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const el = document.getElementById("goal-" + id) || document.getElementById("goals");
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 60);
    }
  };
  const onRemove = (id: string) => setGoalIds((g) => g.filter((x) => x !== id));
  const move = (id: string, dir: number) =>
    setGoalIds((g) => {
      const i = g.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= g.length) return g;
      const copy = g.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div id="top" className="pb-app">
      <PBModeNav active="goals" balance={current} balanceLabel="Points" />
      <PBHeroGoals
        goalIds={goalIds}
        onToggle={onToggle}
        current={current}
        spend={spend}
        onCurrent={setCurrent}
        onSpend={setSpend}
        plans={plans}
      />
      <section className="pb-compare" id="goals">
        <div className="pb-compare-head">
          <span className="pb-eyebrow dark">Your dream trips</span>
          <h2 className="pb-h2">Save, earn, or use — trip by trip.</h2>
          <p className="pb-compare-lede">Listed in priority order. Reorder to see how the plan shifts.</p>
        </div>
        {plans.length === 0 ? (
          <div className="pb-empty">Tap a destination on the map to start tracking a dream trip.</div>
        ) : (
          <div className="pb-goals-list">
            {plans.map((p, i) => (
              <PBGoalCard
                key={p.id}
                plan={p}
                index={i}
                total={plans.length}
                onRemove={onRemove}
                onUp={(id) => move(id, -1)}
                onDown={(id) => move(id, 1)}
              />
            ))}
          </div>
        )}
      </section>
      <PBHowGoals />
      <PBFooter />
    </div>
  );
}
