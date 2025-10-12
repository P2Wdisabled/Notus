"use server";

import { AdminService } from "./AdminService";

const adminService = new AdminService();

export const getAllUsersAction = adminService.getAllUsers.bind(adminService);
export const toggleUserBanAction = adminService.toggleUserBan.bind(adminService);
export const toggleUserAdminAction = adminService.toggleUserAdmin.bind(adminService);
export const isUserAdminAction = adminService.isUserAdmin.bind(adminService);
