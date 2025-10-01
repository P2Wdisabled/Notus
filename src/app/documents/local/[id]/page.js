import EditLocalDocumentPageClient from "./EditLocalDocumentPageClient";

export default async function EditLocalDocumentPage({ params }) {
  const resolvedParams = await params;
  return <EditLocalDocumentPageClient params={resolvedParams} />;
}



