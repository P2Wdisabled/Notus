import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/ui";

export default function DocumentsLayout({ children }) {
  return <Suspense fallback={<HomePageSkeleton />}>{children}</Suspense>;
}
