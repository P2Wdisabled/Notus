import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/ui";

export default function DocumentDetailLayout({ children }) {
  return <Suspense fallback={<HomePageSkeleton />}>{children}</Suspense>;
}
