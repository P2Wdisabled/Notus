"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

export { SessionProvider };

interface AuthSessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export default function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}


