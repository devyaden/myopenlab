import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side upload of agent chat attachments to Supabase storage, mirroring
// the bucket/path convention in lib/font-storage.ts. Text/docx are extracted to
// plain text at upload time; images/PDFs are read by Claude from their URL.

export const AGENT_BUCKET = "yadn-diagrams";
export const AGENT_PREFIX = "agent-uploads";

export type AttachmentKind = "image" | "pdf" | "text" | "docx";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

const IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const TEXT_MIME = new Set(["text/plain", "text/markdown", "text/csv"]);
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface UploadedAttachment {
  path: string;
  publicUrl: string;
  mediaType: string;
  kind: AttachmentKind;
  fileName: string;
  extractedText: string | null;
}

function classify(file: File): AttachmentKind | null {
  const mime = file.type;
  const name = file.name.toLowerCase();
  if (IMAGE_MIME.has(mime)) return "image";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mime === DOCX_MIME || name.endsWith(".docx")) return "docx";
  if (TEXT_MIME.has(mime) || /\.(txt|md|csv)$/.test(name)) return "text";
  return null;
}

function extOf(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : "bin";
}

export async function uploadAgentFile(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<UploadedAttachment> {
  const kind = classify(file);
  if (!kind) {
    throw new Error(`Unsupported file type: ${file.type || file.name}`);
  }
  const cap = kind === "image" ? MAX_IMAGE_BYTES : MAX_BYTES;
  if (file.size > cap) {
    throw new Error(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB; max is ${(
        cap /
        1024 /
        1024
      ).toFixed(0)} MB.`
    );
  }

  const path = `${AGENT_PREFIX}/${userId}/${Date.now()}-${crypto.randomUUID()}.${extOf(
    file
  )}`;

  const { error } = await supabase.storage
    .from(AGENT_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(AGENT_BUCKET).getPublicUrl(path);

  let extractedText: string | null = null;
  if (kind === "text") {
    extractedText = await file.text();
  } else if (kind === "docx") {
    const mammoth = (await import("mammoth")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  }

  return {
    path,
    publicUrl,
    mediaType: file.type || "application/octet-stream",
    kind,
    fileName: file.name,
    extractedText,
  };
}
