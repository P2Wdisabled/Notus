import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/ui/skeleton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AdminPageSkeleton />}>{children}</Suspense>;
}

