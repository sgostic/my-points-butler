import type { Metadata } from "next";
import { PBThankYou } from "@/components/pages/thankyou";

export const metadata: Metadata = {
  title: "You're all set! | My Points Butler",
  description: "We've matched your points and priorities to real trips you can book right now.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return <PBThankYou />;
}
