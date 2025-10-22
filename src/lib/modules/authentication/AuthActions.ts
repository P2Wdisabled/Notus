"use server";

import { AuthService } from "./AuthService";

const authService = new AuthService();

export const authenticate = authService.authenticate.bind(authService);
export const registerUser = authService.registerUser.bind(authService);
export const getCurrentUser = authService.getCurrentUser.bind(authService);
