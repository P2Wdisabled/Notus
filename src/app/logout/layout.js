import { Suspense } from "react";
import { AuthPageSkeleton } from "@/components/ui";

export default function LogoutLayout({ children }) {
  return <Suspense fallback={<AuthPageSkeleton />}>{children}</Suspense>;
}
