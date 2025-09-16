import { auth } from "../../../auth";
import TestSessionClient from "./TestSessionClient";

export default async function TestSessionPage() {
  const session = await auth();

  return <TestSessionClient serverSession={session} />;
}
