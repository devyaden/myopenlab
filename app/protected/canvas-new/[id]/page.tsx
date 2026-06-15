import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Legacy route — playbooks now live at /protected/playbook/[id].
// Redirect any stale links or bookmarks to the new path.
export default async function LegacyCanvasRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/protected/playbook/${id}`);
}
