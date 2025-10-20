import EditLocalDocumentPageClient from "../[id]/EditLocalDocumentPageClient";

interface NewLocalDocumentPageProps {
  params: Promise<any>;
}

export default async function NewLocalDocumentPage({ params }: NewLocalDocumentPageProps) {
  const resolvedParams = await params;
  return <EditLocalDocumentPageClient params={{ id: "new" }} />;
}

