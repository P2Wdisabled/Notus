import EditLocalDocumentPageClient from "./EditLocalDocumentPageClient";

interface EditLocalDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLocalDocumentPage({ params }: EditLocalDocumentPageProps) {
  const resolvedParams = await params;
  return <EditLocalDocumentPageClient params={resolvedParams} />;
}

