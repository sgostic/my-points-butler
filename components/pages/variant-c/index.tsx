"use client";

/* My Points Butler — Variant C: Goal tracking.
   "Tell us your dream trips. We'll tell you what points to save, earn, or use. ⭐"
   Reuses Variant A's world map + data and the shared alerts/base styles. */

import { useState } from "react";
import {
  DESTINATIONS,
  findDestinationByQuery,
  makeCustomDestination,
  fmt,
  type Destination,
} from "../variant-a/data";
import { WorldMap } from "../variant-a/world-map";
import { PBModeNav } from "../mode-nav";
import { AuthModal, PBSignupGate, useAuth } from "../auth";
import { PBFeedbackModal } from "../feedback-modal";
import { PBFooter } from "../footer";
import { pbEta, pbPlanGoals, type GoalPlan } from "./goals";
import {
  EVENTS,
  track,
  trackCta,
  trackMapPin,
  trackPointsEnteredDebounced,
} from "@/lib/analytics";
import "../variant-a/variant-a.css";
import "../variant-b/variant-b.css";
import "./variant-c.css";
import ValueChat from "../value-chat";

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
            onChange={(e) => {
              const next = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
              onCurrent(next);
              trackPointsEnteredDebounced("current", next, "c");
            }}
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
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              onSpend(next);
              trackPointsEnteredDebounced("monthly_spend", next, "c");
            }}
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

      <button
        type="button"
        className="pb-hero-cta pb-engine-cta"
        onClick={() => {
          trackCta("build_plan", "c");
          document.getElementById("goals")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Build My Points Travel Plan →
      </button>
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
  const [feedback, setFeedback] = useState(false);
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
          <button
            type="button"
            className="pb-goal-x"
            aria-label="Remove goal"
            onClick={() => onRemove(plan.id)}
          >
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
          {plan.status === "use" && (
            <button
              type="button"
              className="pb-goal-book"
              onClick={() => setFeedback(true)}
            >
              Book {dest.city} now →
            </button>
          )}
        </div>
      </div>
      {feedback && (
        <PBFeedbackModal context={`Book ${dest.city}`} onClose={() => setFeedback(false)} />
      )}
    </div>
  );
}

function PBHeroGoals({
  goalIds,
  onToggle,
  onCustomDestination,
  current,
  spend,
  onCurrent,
  onSpend,
  plans,
}: {
  goalIds: string[];
  onToggle: (id: string) => void;
  onCustomDestination: (place: string) => void;
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
            Tell us your dream trips. We&apos;ll tell you what points to save, earn, or use. ⭐
          </h1>
          <p className="pb-hero-lede">
            Build a points strategy around the trips you actually want to take.
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
            <WorldMap
              destinations={pinned}
              selectedId=""
              onSelect={onToggle}
              onCustomDestination={onCustomDestination}
              dotColor={DOT_COLOR}
            />
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

function PBGoalAdvancedInsights({
  plans,
  spend,
  isSignedIn,
  onSignUp,
}: {
  plans: GoalPlan[];
  spend: number;
  isSignedIn: boolean;
  onSignUp: () => void;
}) {
  const monthly = earnFromSpend(spend);
  const nextReady = plans.find((p) => p.gap > 0);
  const biggestGap = plans.reduce<GoalPlan | null>(
    (best, plan) => (!best || plan.gap > best.gap ? plan : best),
    null,
  );
  const bonusTrip = biggestGap ? pbEta(Math.max(0, biggestGap.months - 4)) : "today";

  const content = (
    <div className="pb-advanced">
      <div className="pb-advanced-head">
        <div>
          <span className="pb-eyebrow dark">Advanced insights</span>
          <h3>Optimize the order, earn path, and alerts.</h3>
        </div>
        <span className="pb-advanced-pill">{isSignedIn ? "Live plan" : "Account unlock"}</span>
      </div>
      <div className="pb-advanced-grid">
        <div className="pb-advanced-item">
          <span className="pb-advanced-label">Next unlock</span>
          <strong>{nextReady ? `${nextReady.dest.city} by ${nextReady.eta}` : "Every goal is bookable"}</strong>
          <p>{monthly ? `At +${fmt(monthly)} pts/month, this is the next trip to watch.` : "Add monthly spend to forecast unlock timing."}</p>
        </div>
        <div className="pb-advanced-item">
          <span className="pb-advanced-label">Fastest boost</span>
          <strong>{biggestGap ? `${biggestGap.dest.city} by ${bonusTrip}` : "No boost needed"}</strong>
          <p>A targeted card bonus can compress the biggest gap by roughly four months.</p>
        </div>
        <div className="pb-advanced-item">
          <span className="pb-advanced-label">Saved alerts</span>
          <strong>{plans.length} tracked trip{plans.length === 1 ? "" : "s"}</strong>
          <p>Get pinged when forecast windows move or a goal becomes bookable.</p>
        </div>
      </div>
    </div>
  );

  return (
    <PBSignupGate
      isSignedIn={isSignedIn}
      onSignUp={onSignUp}
      title="Sign up to unlock advanced goal insights"
      body="Save this plan, track moving ETAs, and see the fastest path to each trip."
      ctaLabel="Sign up for insights"
      className="pb-gate-advanced"
    >
      {content}
    </PBSignupGate>
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

export default function VariantC() {
  const auth = useAuth();
  const [goalIds, setGoalIds] = useState(DEFAULT_GOALS);
  const [customDestinations, setCustomDestinations] = useState<Destination[]>([]);
  const [current, setCurrent] = useState(206000);
  const [spend, setSpend] = useState(12000);
  const isSignedIn = Boolean(auth.userEmail);
  const openSignUp = () => auth.openAuthModal("sign-up");
  const allDestinations = [...customDestinations, ...DESTINATIONS];

  const goals = goalIds
    .map((id) => ({ id, dest: allDestinations.find((d) => d.id === id) }))
    .filter((g): g is { id: string; dest: (typeof DESTINATIONS)[number] } => Boolean(g.dest));
  const plans = pbPlanGoals(goals, current, earnFromSpend(spend));

  const onToggle = (id: string) => {
    const isAdding = !goalIds.includes(id);
    trackMapPin(id, "toggle", "c");
    track(isAdding ? EVENTS.GOAL_ADDED : EVENTS.GOAL_REMOVED, {
      destId: id,
      totalGoals: isAdding ? goalIds.length + 1 : goalIds.length - 1,
    });
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
  const onCustomDestination = (place: string) => {
    const existing = findDestinationByQuery(place);
    if (existing) {
      onToggle(existing.id);
      return;
    }
    const next = makeCustomDestination(place, DESTINATIONS.find((d) => d.id === "maldives") ?? DESTINATIONS[0]);
    setCustomDestinations((destinations) =>
      destinations.some((destination) => destination.id === next.id) ? destinations : [next, ...destinations],
    );
    if (!goalIds.includes(next.id)) {
      trackMapPin(next.id, "toggle", "c");
      track(EVENTS.GOAL_ADDED, { destId: next.id, totalGoals: goalIds.length + 1 });
      setGoalIds((ids) => [next.id, ...ids]);
    }
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const el = document.getElementById("goals");
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 60);
    }
  };
  const onRemove = (id: string) => {
    track(EVENTS.GOAL_REMOVED, { destId: id, totalGoals: goalIds.length - 1 });
    setGoalIds((g) => g.filter((x) => x !== id));
  };
  const move = (id: string, dir: number) =>
    setGoalIds((g) => {
      const i = g.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= g.length) return g;
      track(EVENTS.GOAL_REORDERED, {
        destId: id,
        direction: dir < 0 ? "up" : "down",
        newIndex: j,
      });
      const copy = g.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div id="top" className="pb-app">
      <PBModeNav
        active="goals"
        balance={current}
        balanceLabel="Points"
        userEmail={auth.userEmail}
        isSubmitting={auth.isSubmitting}
        onSignIn={() => auth.openAuthModal("sign-in")}
        onSignOut={auth.handleSignOut}
      />
      <PBHeroGoals
        goalIds={goalIds}
        onToggle={onToggle}
        onCustomDestination={onCustomDestination}
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
        <PBGoalAdvancedInsights plans={plans} spend={spend} isSignedIn={isSignedIn} onSignUp={openSignUp} />
      </section>
      <PBHowGoals />
      <PBFooter />
      {auth.isAuthOpen ? <AuthModal {...auth} /> : null}
      <ValueChat />
    </div>
  );
}
