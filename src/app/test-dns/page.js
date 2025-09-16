import { auth } from "../../../auth";
import TestDnsClient from "./TestDnsClient";

export default async function TestDnsPage() {
  const session = await auth();

  return <TestDnsClient serverSession={session} />;
}
