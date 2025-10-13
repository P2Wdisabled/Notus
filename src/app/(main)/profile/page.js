import { auth } from "@/../auth";
import NavBar from "@/components/NavBar";
import { Card, Button } from "@/components/ui";
import DocumentCard from "@/components/DocumentCard";
import { getUserDocumentsAction, getUserProfileAction } from "@/lib/actions";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();

  const userId = session?.user?.id ? Number(session.user.id) : undefined;

  // Récupérer les données complètes du profil utilisateur
  const profileResult = userId
    ? await getUserProfileAction(userId)
    : { success: true, user: null };

  const userProfile = profileResult.success ? profileResult.user : null;
  const username =
    userProfile?.username ||
    session?.user?.username ||
    session?.user?.name ||
    "MonCompte";
  const displayName = userProfile
    ? `${userProfile.first_name} ${userProfile.last_name}`.trim() ||
      userProfile.username
    : session?.user?.name || username || "MonCompte";
  const joinDate = userProfile?.created_at
    ? new Date(userProfile.created_at)
    : session?.user?.createdAt
      ? new Date(session.user.createdAt)
      : new Date();

  const documentsResult = userId
    ? await getUserDocumentsAction(userId)
    : { success: true, documents: [] };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <NavBar />

      {/* Back link */}
      <div className="md:ml-64 md:max-w-4/5 max-w-5xl mx-auto px-4 md:pl-0 md:px-6 py-10 pb-4 hidden md:flex gap-4">
        <Link
          href="/"
          className="text-black dark:text-white font-semibold flex items-center"
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
        <h2 className="font-title text-4xl font-regular">Mon compte</h2>
      </div>

      {/* Cover */}
      <div
        className="h-40 md:h-52 w-full relative"
        style={{
          backgroundImage: userProfile?.banner_image
            ? `url(${userProfile.banner_image})`
            : undefined,
          backgroundColor: userProfile?.banner_image
            ? "transparent"
            : undefined,
          background: userProfile?.banner_image
            ? `url(${userProfile.banner_image})`
            : "linear-gradient(135deg, #f97316, #ea580c)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="md:ml-64 md:max-w-4/5 max-w-5xl mx-auto px-4 md:px-6 -mt-12 md:-mt-16 pb-10">
        {/* Header */}
        <div className="flex flex-col items-center md:flex-row md:items-end gap-4 relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-black overflow-hidden">
            {userProfile?.profile_image ? (
              <img
                src={userProfile.profile_image}
                alt="Photo de profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-orange dark:bg-dark-purple flex items-center justify-center text-black font-bold text-xl">
                {getInitials(displayName)}
              </div>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 justify-center md:justify-start w-full md:w-auto">
            <Link href="/profile/edit">
              <Button className="px-4 py-2">Modifier le profil</Button>
            </Link>
            {/* <Button variant="secondary" className="px-4 py-2">
              Partager le profil
            </Button> */}
          </div>
        </div>

        {/* Identity */}
        <div className="mt-4 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
            {displayName}
          </h1>
          <p className="text-dark-gray dark:text-gray">
            @{username || "pseudo"}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm text-dark-gray dark:text-gray">
            <CalendarIcon className="w-4 h-4" />
            <span>
              A rejoint en {joinDate.toLocaleString("fr-FR", { month: "long" })}{" "}
              {joinDate.getFullYear()}
            </span>
          </div>
        </div>

        {/* Notes section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
            Mes notes
          </h2>

          {documentsResult.success &&
            documentsResult.documents.length === 0 && (
              <Card className="p-6">
                <Card.Title>Aucune note</Card.Title>
                <Card.Description>
                  Créez votre première note depuis la page d'accueil.
                </Card.Description>
              </Card>
            )}

          {documentsResult.success && documentsResult.documents.length > 0 && (
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
              {documentsResult.documents
                .sort((a, b) => {
                  const dateA = new Date(a.updated_at || a.created_at);
                  const dateB = new Date(b.updated_at || b.created_at);
                  return dateB - dateA; // Tri décroissant (plus récent en premier)
                })
                .map((document) => (
                  <div key={document.id} className="w-full">
                    <DocumentCard
                      document={document}
                      currentUserId={session?.user?.id}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}
