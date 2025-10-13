import { Suspense } from "react";
import { RegisterPageSkeleton } from "@/components/ui";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RegisterPageSkeleton />}>{children}</Suspense>;
}

