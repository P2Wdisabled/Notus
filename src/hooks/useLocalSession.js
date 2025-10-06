import { useSession as useNextAuthSession } from "next-auth/react";

export function useLocalSession(serverSession = null) {
  const { data: session, status } = useNextAuthSession();
  
  const loading = status === "loading";
  const isLoggedIn = !!session?.user;

  return {
    session: session || serverSession,
    loading,
    isLoggedIn,
    userId: session?.user?.id || null,
    userName: session?.user?.name || null,
    userEmail: session?.user?.email || null,
    userFirstName: session?.user?.firstName || null,
    userLastName: session?.user?.lastName || null,
    username: session?.user?.username || null,
    isAdmin: session?.user?.isAdmin || false,
    isVerified: session?.user?.isVerified || false,
  };
}
