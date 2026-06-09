/* My Points Butler — Goals: dream-trip planning logic (save / earn / use). */

import { tripCost, type Destination } from "../variant-a/data";

export type GoalStatus = "use" | "save" | "earn";

export interface Goal {
  id: string;
  dest: Destination;
}

export interface GoalPlan extends Goal {
  target: number;
  funded: number;
  gap: number;
  pct: number;
  months: number;
  eta: string;
  status: GoalStatus;
}

// Base "today" = June 2026 (project date).
export function pbEta(months: number): string {
  const d = new Date(2026, 5, 1);
  d.setMonth(d.getMonth() + Math.max(0, months));
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

/* Allocate the current balance to goals in priority order, then fill the rest
   with future monthly earnings (sequentially). Returns per-goal plan. */
export function pbPlanGoals(goals: Goal[], current: number, monthlyEarn: number): GoalPlan[] {
  let remaining = current;
  let cumGap = 0;
  return goals.map((g) => {
    const target = tripCost(g.dest, "later", g.dest.nights);
    const funded = Math.min(remaining, target);
    remaining -= funded;
    const gap = target - funded;
    cumGap += gap;
    const months = monthlyEarn > 0 ? Math.ceil(cumGap / monthlyEarn) : Infinity;
    const status: GoalStatus = gap === 0 ? "use" : months <= 3 ? "save" : "earn";
    return { ...g, target, funded, gap, pct: funded / target, months, eta: pbEta(months), status };
  });
}
