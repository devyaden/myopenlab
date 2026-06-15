import { NextRequest, NextResponse } from "next/server";
import { uploadAgentFile } from "@/lib/agent/uploads";

export const maxDuration = 60;

// Accepts a single file (multipart). Uploads it, extracts text for text/docx,
// and persists an agent_attachment row. Creates a conversation if none is given
// so attachments can be added before the first message is sent.
export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    let conversationId = (form.get("conversationId") as string) || null;
    const canvasId = (form.get("canvasId") as string) || null;

    if (!conversationId) {
      const { data: created } = await supabase
        .from("agent_conversation")
        .insert({ user_id: user.id, canvas_id: canvasId })
        .select("id")
        .single();
      conversationId = created?.id ?? null;
    }
    if (!conversationId) {
      return NextResponse.json(
        { error: "Could not create conversation" },
        { status: 500 }
      );
    }

    const uploaded = await uploadAgentFile(supabase, user.id, file);

    const { data: row, error: insErr } = await supabase
      .from("agent_attachment")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        storage_path: uploaded.path,
        public_url: uploaded.publicUrl,
        file_name: uploaded.fileName,
        media_type: uploaded.mediaType,
        kind: uploaded.kind,
        extracted_text: uploaded.extractedText,
      })
      .select("id, file_name, kind")
      .single();
    if (insErr) throw insErr;

    return NextResponse.json({
      conversationId,
      attachment: row,
    });
  } catch (error: any) {
    console.error("Agent upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
