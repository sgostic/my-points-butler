export const ONBOARDING_COMPLETED_KEY = "pb_onboarding_completed";
export const ONBOARDING_COMPLETED_EVENT = "pb:onboarding-completed";

export function hasCompletedOnboarding() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    window.dispatchEvent(new Event(ONBOARDING_COMPLETED_EVENT));
  } catch {
    // Ignore storage failures so onboarding can still proceed.
  }
}
