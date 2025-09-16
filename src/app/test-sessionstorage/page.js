import { auth } from "../../../auth";
import TestSessionStorageClient from "./TestSessionStorageClient";

export default async function TestSessionStoragePage() {
  const session = await auth();

  return <TestSessionStorageClient serverSession={session} />;
}
