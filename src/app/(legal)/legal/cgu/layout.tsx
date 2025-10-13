import { Suspense } from "react";
import { LegalPageSkeleton } from "@/components/ui";

export default function CGULayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LegalPageSkeleton />}>{children}</Suspense>;
}

