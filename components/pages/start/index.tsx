"use client";

/* My Points Butler — /start flow.
   Four UI-only phases:
   1. Hero
   2. Quiz
   3. Building
   4. Email capture / skip
   Colors follow the project's cream/forest-green system. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PBNavMark } from "../nav-mark";
import {
  trackOnboardingStarted,
  trackOnboardingStepViewed,
  trackOnboardingAnswered,
  trackOnboardingCompleted,
  trackOnboardingEmail,
  trackOnboardingSkipped,
} from "@/lib/analytics";
import { markOnboardingCompleted } from "@/lib/onboarding";
import "./start.css";

type Question = {
  id: string;
  eyebrow: string;
  title: string;
  sub?: string;
  options: string[];
  multi?: boolean;
};

const QUESTIONS: Question[] = [
  {
    id: "travel_frequency",
    eyebrow: "Choose one",
    title: "How many times do you travel a year?",
    sub: "A rough estimate is fine.",
    options: ["1 – 2", "3 – 5", "6+"],
  },
  {
    id: "travel_companions",
    eyebrow: "Choose one",
    title: "Who do you travel with?",
    sub: "Pick the one that fits most trips.",
    options: ["Single", "Partner", "Family"],
  },
  {
    id: "points_usage",
    eyebrow: "Choose one",
    title: "How do you use your points/miles?",
    sub: "Pick the pattern that sounds most like you.",
    options: [
      "Save them for one big trip",
      "Spend them on several smaller trips",
      "Use them for seat/class upgrades",
      "Put them toward hotels & stays",
      "Still saving / haven't used them yet",
    ],
  },
  {
    id: "rewards_held",
    eyebrow: "Choose all that apply",
    title: "Which credit cards or reward programs do you use for travel?",
    sub: "Select every card or loyalty program you actively use.",
    multi: true,
    options: [
      "Chase Sapphire Reserve",
      "Chase Sapphire Preferred",
      "Amex Platinum",
      "Amex Gold",
      "Capital One Venture X",
      "Capital One Venture",
      "Citi Strata Premiere",
      "Citi Strata Elite",
      "Airline Loyalty",
      "Hotel Loyalty",
      "Other",
    ],
  },
  {
    id: "points_balance",
    eyebrow: "Choose one",
    title: "About how many points or miles do you have?",
    sub: "Across all your cards and programs — a rough estimate is fine.",
    options: [
      "Under 50,000",
      "50,000 – 150,000",
      "150,000 – 300,000",
      "300,000+",
    ],
  },
  {
    id: "priority",
    eyebrow: "Choose one",
    title: "What is your priority?",
    sub: "We'll tailor your plan around this.",
    options: ["Flights", "Hotels", "Cashback", "All above", "Other"],
  },
  {
    id: "hardest_part",
    eyebrow: "Choose one",
    title: "What's the hardest part about using your points?",
    sub: "Pick what trips you up the most.",
    options: [
      "Choosing cash vs. points",
      "Figuring out where to transfer",
      "Finding the best trip / redemption",
      "Picking the right card to use",
      "Tracking your point earnings",
      "Knowing whether to save points for later",
    ],
  },
];

const BUILD_STEPS = [
  "Reading your points & program mix",
  "Scanning current award pricing",
  "Matching trips to your vibe",
  "Building your personalized plan",
];

function PBTopNav({
  progress,
  step,
}: {
  progress?: { current: number; total: number };
  step?: string;
}) {
  return (
    <header className="pb-start-nav">
      <div className="pb-start-nav-lead">
        <span className="pb-start-brand">
          <span className="pb-start-brand-mark" aria-hidden="true">
            <PBNavMark size={20} />
          </span>
          <span className="pb-start-brand-name">My Points Butler</span>
        </span>
        {progress ? (
          <span className="pb-start-progress" aria-hidden="true">
            <span
              className="pb-start-progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </span>
        ) : null}
      </div>
      {step ? <span className="pb-start-step">{step}</span> : null}
    </header>
  );
}

function PBHero({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <>
      <PBTopNav />
      <main className="pb-start-hero">
        <div className="pb-start-copy">
          <span className="pb-start-badge">
            Personalized · Free · 2 minutes
          </span>
          <h1 className="pb-start-title">
            Tell us your dream trips. We&rsquo;ll tell you what points to{" "}
            <span className="grad">save, earn, or use</span>
          </h1>
          <p className="pb-start-sub">
            Answer a few quick questions and we&rsquo;ll build a points
            strategy around the trips you actually want to take &mdash; based on
            your balance, your priorities, and where you want to go.
          </p>
          <button type="button" className="pb-start-cta" onClick={onStart}>
            Start My Plan
          </button>
          <p className="pb-start-note">
            Takes less than 2 minutes · No signup required to start
          </p>
        </div>

        <div className="pb-start-media">
          <Image
            src="/images/sunny-beach.webp"
            alt="Sunny beach travel destination"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
          />
          <span className="pb-start-media-tint" aria-hidden="true" />
          <span className="pb-start-badge-float">
            Trusted by frequent flyers
          </span>
        </div>
      </main>
    </>
  );
}

function PBQuiz({
  onExit,
  onDone,
}: {
  onExit: () => void;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(() =>
    QUESTIONS.map(() => []),
  );
  const [otherText, setOtherText] = useState<string[]>(() =>
    QUESTIONS.map(() => ""),
  );

  const total = QUESTIONS.length;
  const q = QUESTIONS[index];
  const selected = answers[index];
  const showOther = selected.includes("Other");
  const hasOtherValue = otherText[index].trim().length > 0;
  const hasAnswer = selected.length > 0 && (!showOther || hasOtherValue);

  // Fire once per question shown. Comparing distinct sessions across `step`
  // values is the drop-off funnel: a cliff between step N and N+1 pinpoints
  // exactly which question loses people.
  useEffect(() => {
    const question = QUESTIONS[index];
    trackOnboardingStepViewed(index + 1, total, question.id, question.title);
  }, [index, total]);

  /* Resolve a question's answer for logging: an array for multi-selects, a
     single string otherwise. "Other" is expanded with its free-text value. */
  const answerFor = (i: number): string | string[] => {
    const withOther = answers[i].map((o) =>
      o === "Other" && otherText[i].trim()
        ? `Other: ${otherText[i].trim()}`
        : o,
    );
    return QUESTIONS[i].multi ? withOther : (withOther[0] ?? "");
  };

  const choose = (option: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      if (q.multi) {
        next[index] = prev[index].includes(option)
          ? prev[index].filter((o) => o !== option)
          : [...prev[index], option];
      } else {
        next[index] = [option];
      }
      return next;
    });
  };

  const back = () => {
    if (index === 0) {
      onExit();
      return;
    }
    setIndex((i) => i - 1);
  };

  const advance = () => {
    if (!hasAnswer) return;
    trackOnboardingAnswered(index + 1, q.id, q.title, answerFor(index));
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      const responses: Record<string, string | string[]> = {};
      QUESTIONS.forEach((question, i) => {
        responses[question.id] = answerFor(i);
      });
      trackOnboardingCompleted(responses);
      onDone();
    }
  };

  return (
    <>
      <PBTopNav
        progress={{ current: index + 1, total }}
        step={`Step ${index + 1} of ${total}`}
      />
      <main className="pb-start-quiz">
        <div className="pb-quiz-card">
          <span className="pb-quiz-eyebrow">{q.eyebrow}</span>
          <h1 className="pb-quiz-title">{q.title}</h1>
          {q.sub ? <p className="pb-quiz-sub">{q.sub}</p> : null}

          <div
            className="pb-quiz-options"
            role={q.multi ? "group" : "radiogroup"}
            aria-label={q.title}
          >
            {q.options.map((option) => {
              const active = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  role={q.multi ? "checkbox" : "radio"}
                  aria-checked={active}
                  className={
                    "pb-quiz-option" +
                    (q.multi ? " is-multi" : "") +
                    (active ? " is-active" : "")
                  }
                  onClick={() => choose(option)}
                >
                  <span className="pb-quiz-radio" aria-hidden="true">
                    {q.multi ? (
                      <svg
                        viewBox="0 0 16 16"
                        width="11"
                        height="11"
                        fill="none"
                      >
                        <path
                          d="M3 8.2l3 3 7-7.4"
                          stroke="#fff"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="pb-quiz-option-label">{option}</span>
                </button>
              );
            })}
          </div>

          {showOther ? (
            <input
              type="text"
              className="pb-quiz-other"
              placeholder="Tell us which one"
              value={otherText[index]}
              onChange={(e) =>
                setOtherText((prev) => {
                  const next = [...prev];
                  next[index] = e.target.value;
                  return next;
                })
              }
              aria-label="Other — please specify"
            />
          ) : null}

          <div className="pb-quiz-actions">
            <button type="button" className="pb-quiz-back" onClick={back}>
              Back
            </button>
            <button
              type="button"
              className="pb-quiz-continue"
              disabled={!hasAnswer}
              onClick={advance}
            >
              {index < total - 1 ? "Continue" : "See my plan"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

function PBBuilding({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= BUILD_STEPS.length) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), 900);
    return () => clearTimeout(t);
  }, [done, onDone]);

  return (
    <main className="pb-start-building">
      <div className="pb-build-card">
        <span className="pb-build-spinner" aria-hidden="true" />
        <h1 className="pb-build-title">Building your plan…</h1>
        <p className="pb-build-sub">
          Give us a moment to match your points against real award pricing.
        </p>

        <ul className="pb-build-list">
          {BUILD_STEPS.map((label, i) => {
            const complete = i < done;
            const active = i === done;
            return (
              <li
                key={label}
                className={
                  "pb-build-row" +
                  (complete ? " is-done" : "") +
                  (active ? " is-active" : "")
                }
                hidden={i > done}
              >
                <span className="pb-build-check" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                    <path
                      d="M3 8.2l3 3 7-7.4"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="pb-build-label">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

function PBEmail({ onDone }: { onDone: (submitted: boolean) => void }) {
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    trackOnboardingEmail(email.trim());
    markOnboardingCompleted();
    onDone(true);
  };

  const skip = () => {
    trackOnboardingSkipped(QUESTIONS.length + 1);
    markOnboardingCompleted();
    onDone(false);
  };

  return (
    <main className="pb-start-cap">
      <form className="pb-cap-card" onSubmit={submit}>
        <span className="pb-cap-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2.5"
              stroke="#fff"
              strokeWidth="1.8"
            />
            <path
              d="M4 7l8 6 8-6"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="pb-cap-title">Your plan is almost ready</h1>
        <p className="pb-cap-sub">
          Drop your email and we&rsquo;ll send your personalized points plan,
          plus alerts when your matched trips get cheaper.
        </p>

        <input
          type="email"
          className="pb-cap-input"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-label="Email address"
        />
        <button type="submit" className="pb-cap-submit" disabled={!valid}>
          Get My Plan
        </button>

        <p className="pb-cap-note">
          We&rsquo;ll only use this to send your recommendations and deal
          alerts. No spam, unsubscribe anytime.
        </p>
        <button type="button" className="pb-cap-skip" onClick={skip}>
          Skip for now
        </button>
      </form>
    </main>
  );
}

type Phase = "hero" | "quiz" | "building" | "email";

export function PBStart() {
  const [phase, setPhase] = useState<Phase>("hero");
  const router = useRouter();
  const pixelFiredRef = useRef(false);

  useEffect(() => {
    if (pixelFiredRef.current) return;
    pixelFiredRef.current = true;
    let cancelled = false;
    const tryFire = (attempt = 0) => {
      if (cancelled) return;
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
        return;
      }
      if (attempt < 50) setTimeout(() => tryFire(attempt + 1), 100);
    };
    tryFire();
    return () => { cancelled = true; };
  }, []);

  const goHome = (submitted: boolean) =>
    router.replace(submitted ? "/thankyou" : "/");

  const start = () => {
    trackOnboardingStarted();
    setPhase("quiz");
  };

  return (
    <div className="pb-start">
      {phase === "hero" ? (
        <PBHero onStart={start} />
      ) : phase === "quiz" ? (
        <PBQuiz
          onExit={() => setPhase("hero")}
          onDone={() => setPhase("building")}
        />
      ) : (
        <>
          <PBTopNav />
          {phase === "building" ? (
            <PBBuilding onDone={() => setPhase("email")} />
          ) : (
            <PBEmail onDone={(submitted) => goHome(submitted)} />
          )}
        </>
      )}
    </div>
  );
}

