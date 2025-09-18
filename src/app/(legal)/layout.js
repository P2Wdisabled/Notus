import { Suspense } from "react";
import { LegalPageSkeleton } from "@/components/ui";

export default function LegalLayout({ children }) {
  return <Suspense fallback={<LegalPageSkeleton />}>{children}</Suspense>;
}
