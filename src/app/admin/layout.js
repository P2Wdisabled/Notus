import { auth } from "../../../auth";
import { isUserAdmin } from "@/lib/database";
import { redirect } from "next/navigation";
import AdminNavigation from "@/components/AdminNavigation";

export const metadata = {
  title: "Administration - Notus",
  description: "Interface d'administration de Notus",
};

export default async function AdminLayout({ children }) {
  const session = await auth();

  // Vérifier si l'utilisateur est connecté
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = await isUserAdmin(session.user.id);
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
