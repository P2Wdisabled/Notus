"use client";

interface ConnectionWarningProps {
  currentUserId?: string | number | null;
  hasSelectionBar?: boolean;
}

export default function ConnectionWarning({ currentUserId, hasSelectionBar = false }: ConnectionWarningProps) {
  // Ne pas afficher si l'utilisateur est connecté
  if (currentUserId) return null;

  return (
    <div className={`fixed left-0 right-0 z-10 px-0 md:ml-68 md:px-4 ${hasSelectionBar ? 'bottom-15' : 'bottom-0'}`}>
      <div className="">
        <div className={`max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-3 bg-primary text-primary-foreground text-center ${hasSelectionBar ? 'pb-5' : 'pb-3'}`}>
          Vous n'êtes pas connecté. Vos notes locales ne seront pas
          sauvegardées dans le cloud.
        </div>
      </div>
    </div>
  );
}
