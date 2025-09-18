import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/ui";

export default function MainLayout({ children }) {
  return <Suspense fallback={<HomePageSkeleton />}>{children}</Suspense>;
}
