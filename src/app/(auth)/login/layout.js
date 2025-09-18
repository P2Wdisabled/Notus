import { Suspense } from "react";
import { LoginPageSkeleton } from "@/components/ui";

export default function LoginLayout({ children }) {
  return <Suspense fallback={<LoginPageSkeleton />}>{children}</Suspense>;
}
