import Link from "next/link";
import Icon from "@/components/Icon";

export const metadata = {
  title: "Compte banni - Notus",
  description: "Votre compte a été banni",
};

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-red-500">
            <Icon name="alert" className="w-full h-full" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Compte banni
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Votre compte a été suspendu par un administrateur.
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon name="alert" className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Accès refusé
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>
                  Vous ne pouvez plus accéder à cette application. Si vous
                  pensez qu'il s'agit d'une erreur, contactez un administrateur.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

