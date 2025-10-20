import { Suspense } from "react";
import { VerifyEmailPageSkeleton } from "@/components/ui";

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<VerifyEmailPageSkeleton />}>{children}</Suspense>;
}

