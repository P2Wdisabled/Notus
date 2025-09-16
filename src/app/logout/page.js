import { signOut } from "../../../auth";

export default function LogoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Déconnexion
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Êtes-vous sûr de vouloir vous déconnecter ?
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
