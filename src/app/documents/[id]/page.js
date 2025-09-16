import { auth } from "../../../../auth";
import EditDocumentPageClient from "./EditDocumentPageClient";

export default async function EditDocumentPage({ params }) {
  const session = await auth();

  return <EditDocumentPageClient session={session} params={params} />;
}
