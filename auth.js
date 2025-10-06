import { getServerSession } from "next-auth/next";
import { authOptions } from "./lib/auth";

export const auth = () => getServerSession(authOptions);
