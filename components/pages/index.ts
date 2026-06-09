/* A/B test variant registry.

   The homepage renders one of these variants based on the `?variant=` query
   param (e.g. `?variant=a`). Variant A is the fully-built, default direction;
   B / C / D are placeholders for future experiments. */

import type { ComponentType } from "react";
import VariantA from "./variant-a";
import VariantB from "./variant-b";
import VariantC from "./variant-c";
import VariantD from "./variant-d";

export type Variant = "a" | "b" | "c" | "d";

export const DEFAULT_VARIANT: Variant = "a";

export const VARIANTS: Record<Variant, ComponentType> = {
  a: VariantA,
  b: VariantB,
  c: VariantC,
  d: VariantD,
};

/** Normalize a raw query-param value into a known variant, falling back to the default. */
export function resolveVariant(raw?: string | string[]): Variant {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase();
  if (value && value in VARIANTS) return value as Variant;
  return DEFAULT_VARIANT;
}
