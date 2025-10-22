import { Suspense } from "react";
import { LoginPageSkeleton } from "@/components/ui";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoginPageSkeleton />}>{children}</Suspense>;
}

