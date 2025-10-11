// Utilitaires pour gérer la session utilisateur dans sessionStorage

const SESSION_KEY = "notus_user_session";

export function saveUserSession(userData) {
  try {
    const sessionData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde de la session:", error);
    return false;
  }
}

export function getUserSession() {
  try {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    const parsed = JSON.parse(sessionData);

    // sessionStorage expire automatiquement à la fermeture du navigateur
    // Pas besoin de vérifier l'âge de la session
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la session:", error);
    clearUserSession();
    return null;
  }
}

export function clearUserSession() {
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

export function isUserLoggedIn() {
  const session = getUserSession();
  return session !== null && session.id;
}

export function getUserId() {
  const session = getUserSession();
  return session ? session.id : null;
}

export function getUserName() {
  const session = getUserSession();
  return session ? session.name : null;
}

export function getUserEmail() {
  const session = getUserSession();
  return session ? session.email : null;
}

export function getUserFirstName() {
  const session = getUserSession();
  return session ? session.firstName : null;
}

export function getUserLastName() {
  const session = getUserSession();
  return session ? session.lastName : null;
}

export function getUsername() {
  const session = getUserSession();
  return session ? session.username : null;
}
