"use client";

/* My Points Butler — /start flow.
   Two phases, UI only:
   1. Hero — split layout recreated from the Claude Design handoff.
   2. Quiz — one question per step with a progress bar, matching the second
      handoff screen. Colors follow the project's cream/forest-green system. */

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PBNavMark } from "../nav-mark";
import "./start.css";

type Question = {
  eyebrow: string;
  title: string;
  sub?: string;
  options: string[];
  multi?: boolean;
};

const QUESTIONS: Question[] = [
  {
    eyebrow: "Choose one",
    title: "How many times do you travel a year?",
    sub: "A rough estimate is fine.",
    options: ["1 – 2", "3 – 5", "6+"],
  },
  {
    eyebrow: "Choose one",
    title: "Who do you travel with?",
    sub: "Pick the one that fits most trips.",
    options: ["Alone", "Partner", "Family"],
  },
  {
    eyebrow: "Choose all that apply",
    title: "Which rewards do you currently have?",
    sub: "Across all your cards and programs.",
    multi: true,
    options: [
      "Chase",
      "Amex",
      "Capital One",
      "Citi",
      "Airline miles",
      "Hotel points",
      "Not sure",
      "Other",
    ],
  },
  {
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
    eyebrow: "Choose all that apply",
    title: "What do you most want to understand?",
    sub: "We'll tailor your plan around this.",
    multi: true,
    options: [
      "Cash value of my points",
      "Flights",
      "Hotels",
      "Whether to save or use",
      "Not sure",
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
      <button type="button" className="pb-start-exit">
        Exit
      </button>
    </header>
  );
}

function PBHero({ onStart }: { onStart: () => void }) {
  return (
    <>
      <PBTopNav />
      <main className="pb-start-hero">
        <div className="pb-start-copy">
          <span className="pb-start-badge">
            Personalized · Free · 2 minutes
          </span>
          <h1 className="pb-start-title">
            Find the right trip without the{" "}
            <span className="grad">guesswork</span>.
          </h1>
          <p className="pb-start-sub">
            Answer a few quick questions and we&rsquo;ll build a personalized
            points plan based on your balance, your priorities, and where you
            actually want to go.
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

  const total = QUESTIONS.length;
  const q = QUESTIONS[index];
  const selected = answers[index];
  const hasAnswer = selected.length > 0;

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
    if (index < total - 1) setIndex((i) => i + 1);
    else onDone();
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

function PBEmail({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onDone();
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
        <button type="button" className="pb-cap-skip" onClick={onDone}>
          Skip for now
        </button>
      </form>
    </main>
  );
}

function PBAllSet({ onView }: { onView: () => void }) {
  return (
    <main className="pb-start-done">
      <div className="pb-done-card">
        <span className="pb-done-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="var(--save)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="pb-done-title">You&rsquo;re all set!</h1>
        <p className="pb-done-sub">
          We&rsquo;ve matched your points and priorities to real trips you can
          book right now.
        </p>
        <button type="button" className="pb-done-cta" onClick={onView}>
          View My Recommendations →
        </button>
      </div>
    </main>
  );
}

type Phase = "hero" | "quiz" | "building" | "email" | "done";

export function PBStart() {
  const [phase, setPhase] = useState<Phase>("hero");
  const router = useRouter();
  const goHome = () => router.push("/");

  return (
    <div className="pb-start">
      {phase === "hero" ? (
        <PBHero onStart={() => setPhase("quiz")} />
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
          ) : phase === "email" ? (
            <PBEmail onDone={() => setPhase("done")} />
          ) : (
            <PBAllSet onView={goHome} />
          )}
        </>
      )}
    </div>
  );
}
