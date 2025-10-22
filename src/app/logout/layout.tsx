import { Suspense } from "react";
import { AuthPageSkeleton } from "@/components/ui";

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AuthPageSkeleton />}>{children}</Suspense>;
}

