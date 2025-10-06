import { auth } from "../../../../auth";
import EditDocumentPageClient from "./EditDocumentPageClient";

export default async function EditDocumentPage({ params, session }) {
  const resolvedParams = await params;
  // Server component must not call client functions or reference client vars
  return <EditDocumentPageClient session={session} params={resolvedParams} />;
}
