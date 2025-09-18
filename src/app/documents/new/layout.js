import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/ui";

export default function NewDocumentLayout({ children }) {
  return <Suspense fallback={<HomePageSkeleton />}>{children}</Suspense>;
}
