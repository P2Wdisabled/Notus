import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <Suspense fallback={<AdminPageSkeleton />}>{children}</Suspense>
    </AdminGuard>
  );
}

