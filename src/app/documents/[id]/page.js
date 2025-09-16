import { auth } from "../../../../auth";
import EditDocumentPageClient from "./EditDocumentPageClient";

export default async function EditDocumentPage({ params }) {
  const session = await auth();
  const resolvedParams = await params;

  return <EditDocumentPageClient session={session} params={resolvedParams} />;
}
