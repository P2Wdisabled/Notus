"use server";

import { UserProfileService } from "./UserProfileService";
import { PasswordService } from "./PasswordService";

const userProfileService = new UserProfileService();
const passwordService = new PasswordService();

export const updateUserProfileAction = userProfileService.updateUserProfile.bind(userProfileService);
export const getUserProfileAction = userProfileService.getUserProfile.bind(userProfileService);
export const getUserIdByEmailAction = userProfileService.getUserIdByEmail.bind(userProfileService);

export const sendPasswordResetEmailAction = passwordService.sendPasswordResetEmail.bind(passwordService);
export const resetPasswordAction = passwordService.resetPassword.bind(passwordService);
