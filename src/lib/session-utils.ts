// Utilitaires pour gérer la session utilisateur dans sessionStorage

// Types pour les données de session
interface UserSessionData {
  id: string | number;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string;
  bannerImage?: string;
  timestamp: number;
}

const SESSION_KEY = "notus_user_session";

export function saveUserSession(userData: UserSessionData): boolean {
  try {
    const sessionData: UserSessionData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      profileImage: userData.profileImage,
      bannerImage: userData.bannerImage,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde de la session:", error);
    return false;
  }
}

export function getUserSession(): UserSessionData | null {
  try {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    const parsed = JSON.parse(sessionData) as UserSessionData;

    // sessionStorage expire automatiquement à la fermeture du navigateur
    // Pas besoin de vérifier l'âge de la session
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la session:", error);
    clearUserSession();
    return null;
  }
}

export function clearUserSession(): boolean {
  try {
    // Vider complètement le sessionStorage
    sessionStorage.clear();

    // Vider aussi le localStorage pour la session utilisateur
    if (typeof window !== "undefined") {
      localStorage.removeItem("userSession");
    }

    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la session:", error);
    return false;
  }
}

export function isUserLoggedIn(): boolean {
  const session = getUserSession();
  return session !== null && !!session.id;
}

export function getUserId(): string | number | null {
  const session = getUserSession();
  return session ? session.id : null;
}

export function getUserName(): string | null {
  const session = getUserSession();
  return session ? session.name : null;
}

export function getUserEmail(): string | null {
  const session = getUserSession();
  return session ? session.email : null;
}

export function getUserFirstName(): string | null {
  const session = getUserSession();
  return session ? session.firstName : null;
}

export function getUserLastName(): string | null {
  const session = getUserSession();
  return session ? session.lastName : null;
}

export function getUsername(): string | null {
  const session = getUserSession();
  return session ? session.username : null;
}
