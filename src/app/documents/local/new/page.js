import EditLocalDocumentPageClient from "../[id]/EditLocalDocumentPageClient";

export default async function NewLocalDocumentPage({ params }) {
  const resolvedParams = await params;
  return <EditLocalDocumentPageClient params={{ id: "new" }} />;
}
