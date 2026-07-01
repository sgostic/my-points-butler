import type { Metadata } from "next";
import { PBStart } from "@/components/pages/start";

export const metadata: Metadata = {
  title: "My Points Butler — Start your plan",
  description:
    "Answer a few quick questions and we'll build a personalized points plan based on your balance, your priorities, and where you actually want to go.",
};

export default function StartPage() {
  return <PBStart />;
}
