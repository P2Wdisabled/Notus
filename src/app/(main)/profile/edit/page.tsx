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
    id:
      session?.user?.id ||
      (userProfile?.id != null ? String(userProfile.id) : undefined),
    email: userProfile?.email ?? session?.user?.email ?? "",
    username: userProfile?.username ?? session?.user?.username ?? "",
    firstName: userProfile?.first_name ?? session?.user?.firstName ?? "",
    lastName: userProfile?.last_name ?? session?.user?.lastName ?? "",
    name: session?.user?.name ?? "",
    profileImage: userProfile?.profile_image ?? null,
    bannerImage: userProfile?.banner_image ?? null,
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Back link */}
      <div className="md:ml-64 md:pl-4 pt-6">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pb-4 hidden md:flex gap-4">
          <Link
            href="/profile"
            className="text-foreground font-semibold flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h2 className="font-title text-4xl font-regular">Modifier le profil</h2>
        </div>
      </div>

      {/* Cover */}
      <div className="md:ml-64 md:pl-4">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <div
            className="h-40 md:h-52 w-full relative rounded-2xl overflow-hidden"
            style={{
              backgroundImage: userProfile?.banner_image
                ? `url(${userProfile.banner_image})`
                : "linear-gradient(135deg, var(--primary),var(--primary))",
              backgroundColor: userProfile?.banner_image
                ? "transparent"
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      </div>

      <div className="md:ml-64 md:pl-4">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 -mt-12 md:-mt-16 pb-10">
          <EditProfilePageClient user={user} />
        </div>
      </div>
    </div>
  );
}

