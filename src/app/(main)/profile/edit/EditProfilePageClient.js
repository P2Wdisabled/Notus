"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Form, Input, Modal, ImageUpload } from "@/components/ui";
import { updateUserProfileAction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { saveUserSession } from "@/lib/session-utils";
import { useImageValidation } from "@/hooks/useImageValidation";

export default function EditProfilePageClient({ user }) {
  const router = useRouter();
  const { update } = useSession();
  const [message, formAction, isPending] = useActionState(
    updateUserProfileAction,
    undefined
  );

  const initial = useMemo(
    () => ({
      username: user?.username || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      name: user?.name || "",
      profileImage: user?.profileImage || null,
      bannerImage: user?.bannerImage || null,
    }),
    [user]
  );

  const displayName =
    initial.name ||
    `${initial.firstName} ${initial.lastName}`.trim() ||
    initial.username ||
    "MonCompte";

  const [username, setUsername] = useState(initial.username);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(initial.email);
  const [profileImage, setProfileImage] = useState(initial.profileImage);
  const [bannerImage, setBannerImage] = useState(initial.bannerImage);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const hasSyncedRef = useRef(false);

  const { errors, validateImage, validateProfileImages, clearError } =
    useImageValidation();

  useEffect(() => {
    if (!message || !message.toLowerCase().includes("succès")) return;
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const doUpdate = async () => {
      const computedName = `${firstName} ${lastName}`.trim() || username || "";
      try {
        await update({
          name: computedName,
          firstName,
          lastName,
          username,
          email,
          profileImage,
          bannerImage,
        });
      } catch (e) {
        console.error("Erreur lors de la mise à jour de la session:", e);
      }

      try {
        saveUserSession({
          id: user?.id || "unknown",
          email,
          name: computedName,
          firstName,
          lastName,
          username,
          profileImage,
          bannerImage,
        });
      } catch (e) {
        console.error(
          "Erreur lors de l'enregistrement de la session locale:",
          e
        );
      }

      setShowSuccessModal(true);
    };

    const t = setTimeout(() => doUpdate(), 200);
    return () => clearTimeout(t);
  }, [
    message,
    firstName,
    lastName,
    username,
    email,
    user?.id,
    update,
    profileImage,
    bannerImage,
  ]);

  const handleImageChange = (imageType, value) => {
    if (imageType === "profile") {
      setProfileImage(value);
      if (value) {
        validateImage(value, "profileImage");
      } else {
        clearError("profileImage");
      }
    } else if (imageType === "banner") {
      setBannerImage(value);
      if (value) {
        validateImage(value, "bannerImage");
      } else {
        clearError("bannerImage");
      }
    }
  };

  const handleSubmit = (formData) => {
    // Validation des images avant soumission
    const profileData = {
      profileImage,
      bannerImage,
    };

    const validation = validateProfileImages(profileData);
    if (!validation.isValid) {
      return; // Ne pas soumettre si validation échoue
    }

    formData.set("username", username);
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("email", email);
    if (profileImage) formData.set("profileImage", profileImage);
    if (bannerImage) formData.set("bannerImage", bannerImage);
    formAction(formData);
  };

  return (
    <div>
      {/* Header with avatar and edit badges like screenshot */}
      <div className="flex flex-col items-center md:flex-row md:items-end gap-4">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-black bg-orange dark:bg-dark-purple flex items-center justify-center text-black font-bold text-xl">
          {getInitials(displayName)}
        </div>
        <div className="flex-1" />
      </div>

      <div className="mt-6">
        <h2 className="font-title text-3xl md:text-4xl text-black dark:text-white mb-4">
          Informations personnelles
        </h2>

        <Card className="px-3 py-6">
          <form action={handleSubmit} className="space-y-4">
            <Input
              label="Pseudo"
              labelClassName="!text-black dark:!text-white text-xl font-title font-bold"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pseudo"
              className="bg-white dark:bg-black !text-dark-gray dark:!text-gray border-0 border-b border-gray dark:border-dark-gray rounded-none pl-0 pt-0"
              noFocusRing
              endAdornment={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                    fill="currentColor"
                  />
                  <path
                    d="M20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            <Input
              label="Nom"
              labelClassName="!text-black dark:!text-white text-xl font-title font-bold"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              className="bg-white dark:bg-black !text-dark-gray dark:!text-gray border-0 border-b border-gray dark:border-dark-gray rounded-none pl-0 pt-0"
              noFocusRing
              endAdornment={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                    fill="currentColor"
                  />
                  <path
                    d="M20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            <Input
              label="Prénom"
              labelClassName="!text-black dark:!text-white text-xl font-title font-bold"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="bg-white dark:bg-black !text-dark-gray dark:!text-gray border-0 border-b border-gray dark:border-dark-gray rounded-none pl-0 pt-0"
              noFocusRing
              endAdornment={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                    fill="currentColor"
                  />
                  <path
                    d="M20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            {/* <Input
              label="Adresse mail"
              labelClassName="text-black dark:text-white text-xl font-title font-bold"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="bg-white dark:bg-black !text-dark-gray dark:!text-gray border-0 border-b border-gray dark:border-dark-gray rounded-none pl-0 pt-0"
              noFocusRing
            /> */}

            {/* Champs d'images */}
            <div className="space-y-6">
              <ImageUpload
                label="Image de profil"
                value={profileImage}
                onChange={(value) => handleImageChange("profile", value)}
                error={errors.profileImage}
                className="mt-6"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                maxSize={10 * 1024 * 1024} // 10MB
              />

              <ImageUpload
                label="Image de bannière"
                value={bannerImage}
                onChange={(value) => handleImageChange("banner", value)}
                error={errors.bannerImage}
                className="mt-6"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                maxSize={10 * 1024 * 1024} // 10MB
                recommendedSize="1200x480 pixels"
              />
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.toLowerCase().includes("succès")
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex justify-center pt-2 gap-4">
              <Button
                type="submit"
                loading={isPending}
                variant="primary"
                className="px-6 py-2"
              >
                Mettre à jour
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="px-6 py-2"
                onClick={() => router.push("/profile")}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="sm"
        className="!bg-white dark:!bg-black text-black dark:text-white border-2 border-dark-orange dark:border-dark-purple"
      >
        <div className="flex flex-col items-center text-center gap-5 bg-white dark:bg-black">
          <h3 className="font-title text-3xl">Profil mis à jour</h3>
          <div className="w-12 h-12 rounded-full bg-orange dark:bg-dark-purple flex items-center justify-center shadow-md">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-black dark:text-white"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="primary"
              className="px-6 py-2 bg-orange dark:bg-dark-purple hover:bg-dark-orange dark:hover:bg-dark-purple shadow-orange dark:shadow-dark-purple"
              onClick={() => router.push("/profile")}
            >
              Continuer
            </Button>
            <Button
              variant="secondary"
              className="px-6 py-2 border-orange dark:border-dark-purple text-orange dark:text-dark-purple shadow-orange dark:shadow-dark-purple"
              onClick={() => setShowSuccessModal(false)}
            >
              Éditer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}
