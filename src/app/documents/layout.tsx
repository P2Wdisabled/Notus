import { Suspense } from "react";
import { DocumentPageSkeleton } from "@/components/ui/skeleton";

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DocumentPageSkeleton />}>{children}</Suspense>;
}

