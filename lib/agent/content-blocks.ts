// Turns stored attachment rows into Anthropic content blocks. Opus 4.7 reads
// images and PDFs natively from URL sources; .docx/text are injected as extracted
// text (Claude has no native .docx).

export interface AttachmentRow {
  public_url: string;
  file_name: string;
  media_type: string;
  kind: string; // image | pdf | text | docx
  extracted_text?: string | null;
}

export function toContentBlocks(attachments: AttachmentRow[]): any[] {
  return attachments.map((a) => {
    if (a.kind === "image") {
      return { type: "image", source: { type: "url", url: a.public_url } };
    }
    if (a.kind === "pdf") {
      return { type: "document", source: { type: "url", url: a.public_url } };
    }
    // text / docx → extracted text
    return {
      type: "text",
      text: `Attached file "${a.file_name}":\n\n${a.extracted_text ?? "(no extractable text)"}`,
    };
  });
}
