import { auth } from "@/../auth";
import NavBar from "@/components/NavBar";
import EditProfilePageClient from "./EditProfilePageClient";
import Link from "next/link";

export default async function EditProfilePage() {
  const session = await auth();
  const user = session?.user || null;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <NavBar />

      {/* Back link */}
      <div className="md:ml-64 md:max-w-4/5 max-w-5xl mx-auto px-4 md:pl-0 md:px-6 py-10 pb-4 hidden md:flex gap-4">
        <Link
          href="/profile"
          className="text-black dark:text-white font-semibold flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          </Link>
          <h2 className="font-title text-4xl font-regular">Modifier le profil</h2>
      </div>

      {/* Cover */}
      <div className="bg-orange dark:bg-dark-purple h-40 md:h-52 w-full" />

      <div className="md:ml-64 md:max-w-4/5 max-w-5xl mx-auto px-4 md:px-6 -mt-12 md:-mt-16 pb-10">
        <EditProfilePageClient user={user} />
      </div>
    </div>
  );
}


