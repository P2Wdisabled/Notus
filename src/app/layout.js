import "./globals.css";
import FloatingCreateButton from "@/components/FloatingCreateButton";
import AuthSessionProvider from "@/components/SessionProvider";
import PromoteAdminButton from "@/components/PromoteAdminButton";
import { auth } from "../../auth";
import Link from "next/link";

export const metadata = {
  title: "Notus",
  description: "Notus the bloc note app",
};

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthSessionProvider session={session}>
          {children}
          <FloatingCreateButton serverSession={session} />
        </AuthSessionProvider>

        {/* Footer */}
        {/* <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                © 2025 Notus. Tous droits réservés.
              </div>
              <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                <div className="flex space-x-4">
                  <Link
                    href="/legal/rgpd"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
                  >
                    Mentions légales RGPD
                  </Link>
                  <Link
                    href="/legal/cgu"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
                  >
                    Conditions Générales d&apos;Utilisation
                  </Link>
                </div>
                {session?.user && (
                  <div className="mt-2 md:mt-0">
                    <PromoteAdminButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        </footer> */}
      </body>
    </html>
  );
}
