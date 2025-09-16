import { auth } from "../../../../auth";
import NewDocumentPageClient from "./NewDocumentPageClient";

export default async function NewDocumentPage() {
  const session = await auth();

  return <NewDocumentPageClient session={session} />;
}
