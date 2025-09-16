import { auth } from "../../../auth";
import TestAuthClient from "./TestAuthClient";

export default async function TestAuthPage() {
  const session = await auth();

  return <TestAuthClient serverSession={session} />;
}
