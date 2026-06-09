/* My Points Butler — wallet model + match logic (Deal Alerts variant). */

import type { Destination, Offer } from "../variant-a/data";

export type WalletType = "card" | "airline" | "hotel";

export interface WalletEntry {
  id: number;
  type: WalletType;
  program: string;
  points: number;
}

export interface Pools {
  flexible: number;
  airline: number;
  hotel: number;
  flight: number;
  stay: number;
  total: number;
}

export type MatchKey = "now" | "wait" | "short";

export interface Match {
  key: MatchKey;
  label: string;
  gap: number;
  gapLater?: number;
}

export const PB_PROGRAMS: Record<WalletType, { label: string; icon: string; list: string[] }> = {
  card: {
    label: "Card",
    icon: "💳",
    list: ["Amex Membership Rewards", "Chase Ultimate Rewards", "Capital One Miles", "Citi ThankYou"],
  },
  airline: {
    label: "Airline",
    icon: "✈",
    list: ["United MileagePlus", "Delta SkyMiles", "American AAdvantage", "Air France–KLM Flying Blue"],
  },
  hotel: {
    label: "Hotel",
    icon: "🏨",
    list: ["Marriott Bonvoy", "Hilton Honors", "World of Hyatt", "IHG One Rewards"],
  },
};

/* Card points are transferable, so they top up both flights and hotels. */
export function pbPools(wallet: WalletEntry[]): Pools {
  const sum = (t: WalletType) => wallet.filter((w) => w.type === t).reduce((s, w) => s + w.points, 0);
  const flexible = sum("card");
  const airline = sum("airline");
  const hotel = sum("hotel");
  return {
    flexible,
    airline,
    hotel,
    flight: flexible + airline,
    stay: flexible + hotel,
    total: flexible + airline + hotel,
  };
}

/* Match a single award (now / later cost) against the relevant wallet pool. */
export function pbMatch(pool: number, now: number, later: number): Match {
  if (pool >= now) return { key: "now", label: "Bookable now", gap: 0 };
  if (pool >= later) return { key: "wait", label: "Unlocks if you wait", gap: now - pool, gapLater: 0 };
  return { key: "short", label: "Keep saving", gap: now - pool, gapLater: later - pool };
}

export function pbPoolForTab(pools: Pools, tab: "flights" | "hotels") {
  return tab === "hotels" ? pools.stay : pools.flight;
}

export interface MatchedRow {
  o: Offer;
  pool: number;
  kind: "flight" | "hotel";
  m: Match;
}

export interface WalletSummary {
  total: number;
  now: MatchedRow[];
  wait: MatchedRow[];
  short: MatchedRow[];
  topUnlock: MatchedRow | null;
}

/* Aggregate wallet match across a destination (used for the summary + alert). */
export function pbWalletSummary(dest: Destination, pools: Pools): WalletSummary {
  const rows: MatchedRow[] = [
    ...dest.flights.map((o) => ({ o, pool: pools.flight, kind: "flight" as const })),
    ...dest.hotels.map((o) => ({ o, pool: pools.stay, kind: "hotel" as const })),
  ].map((r) => ({ ...r, m: pbMatch(r.pool, r.o.now, r.o.later) }));
  const now = rows.filter((r) => r.m.key === "now");
  const wait = rows.filter((r) => r.m.key === "wait");
  const short = rows.filter((r) => r.m.key === "short");
  // Headline unlock: the priciest award that becomes affordable only by waiting.
  const topUnlock = wait.slice().sort((a, b) => b.o.later - a.o.later)[0] || null;
  return { total: rows.length, now, wait, short, topUnlock };
}
