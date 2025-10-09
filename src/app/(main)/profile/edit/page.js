import { auth } from "@/../auth";
import NavBar from "@/components/NavBar";
import EditProfilePageClient from "./EditProfilePageClient";
import Link from "next/link";
import { getUserProfileAction } from "@/lib/actions";

export default async function EditProfilePage() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : undefined;

  // Charger le profil complet pour récupérer les images (profile_image, banner_image)
  const profileResult = userId
    ? await getUserProfileAction(userId)
    : { success: true, user: null };
  const userProfile = profileResult.success ? profileResult.user : null;

  // Mapper vers les propriétés attendues par le client (camelCase)
  const user = {
    ...session?.user,
    id: session?.user?.id || (userProfile?.id != null ? String(userProfile.id) : undefined),
    email: userProfile?.email ?? session?.user?.email ?? "",
    username: userProfile?.username ?? session?.user?.username ?? "",
    firstName: userProfile?.first_name ?? session?.user?.firstName ?? "",
    lastName: userProfile?.last_name ?? session?.user?.lastName ?? "",
    name: session?.user?.name ?? "",
    profileImage: userProfile?.profile_image ?? session?.user?.profileImage ?? null,
    bannerImage: userProfile?.banner_image ?? session?.user?.bannerImage ?? null,
  };

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
      <div
        className="h-40 md:h-52 w-full relative"
        style={{
          backgroundImage: userProfile?.banner_image
            ? `url(${userProfile.banner_image})`
            : undefined,
          backgroundColor: userProfile?.banner_image ? "transparent" : undefined,
          background: userProfile?.banner_image
            ? `url(${userProfile.banner_image})`
            : "linear-gradient(135deg, #f97316, #ea580c)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="md:ml-64 md:max-w-4/5 max-w-5xl mx-auto px-4 md:px-6 -mt-12 md:-mt-16 pb-10">
        <EditProfilePageClient user={user} />
      </div>
    </div>
  );
}


