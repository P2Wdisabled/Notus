import { Suspense } from "react";
import { VerifyEmailPageSkeleton } from "@/components/ui";

export default function VerifyEmailLayout({ children }) {
  return <Suspense fallback={<VerifyEmailPageSkeleton />}>{children}</Suspense>;
}
