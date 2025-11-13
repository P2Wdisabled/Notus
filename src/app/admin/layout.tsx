import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminNavigation from "@/components/admin/AdminNavigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminNavigation />
      <Suspense fallback={<AdminPageSkeleton />}>{children}</Suspense>
    </AdminGuard>
  );
}

