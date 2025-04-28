import Editor from "@/components/editor";
import { Unauthorized } from "@/components/unauthorized";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: documentId } = await params;
  const supabase = await createClient();

  // Check if the document exists and is public or belongs to the current user
  const { data: document, error } = await supabase
    .from("document")
    .select("visibility, user_id")
    .eq("id", documentId)
    .single();

  // If document doesn't exist, redirect to home
  if (error) {
    redirect("/");
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If document is not public and doesn't belong to the current user, show unauthorized page
  if (
    document.visibility !== "public" &&
    (!user || document.user_id !== user.id)
  ) {
    return <Unauthorized />;
  }

  // If document is public or belongs to the current user, render it
  return <Editor canvasId={documentId} />;
}
