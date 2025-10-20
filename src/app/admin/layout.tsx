import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<HomePageSkeleton />}>{children}</Suspense>;
}

