import { auth } from "../../../../auth";
import EditDocumentPageClient from "./EditDocumentPageClient";

interface EditDocumentPageProps {
  params: Promise<{ id: string }>;
  session?: any;
}

export default async function EditDocumentPage({ params, session }: EditDocumentPageProps) {
  const resolvedParams = await params;
  // Server component must not call client functions or reference client vars
  return <EditDocumentPageClient session={session} params={resolvedParams} />;
}

