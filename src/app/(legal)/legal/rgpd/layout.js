import { Suspense } from "react";
import { LegalPageSkeleton } from "@/components/ui";

export default function RGPDLayout({ children }) {
  return <Suspense fallback={<LegalPageSkeleton />}>{children}</Suspense>;
}
