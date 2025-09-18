import { Suspense } from "react";
import { AuthPageSkeleton } from "@/components/ui";

export default function AuthLayout({ children }) {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      {children}
    </Suspense>
  );
}
