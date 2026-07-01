"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import VariantC from "./variant-c";
import {
  hasCompletedOnboarding,
  ONBOARDING_COMPLETED_EVENT,
} from "@/lib/onboarding";

function subscribeToOnboardingChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(ONBOARDING_COMPLETED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(ONBOARDING_COMPLETED_EVENT, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => undefined;
}

export function PBHomePage() {
  const router = useRouter();
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const hasCompleted = useSyncExternalStore(
    subscribeToOnboardingChange,
    hasCompletedOnboarding,
    () => false,
  );

  useEffect(() => {
    if (hasHydrated && !hasCompleted) {
      router.replace("/start");
    }
  }, [hasCompleted, hasHydrated, router]);

  if (!hasHydrated || !hasCompleted) return null;

  return <VariantC />;
}
