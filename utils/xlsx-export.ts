/**
 * Minimal, dependency-free XLSX writer.
 *
 * An .xlsx file is a ZIP (OOXML) container — Excel validates the container
 * against the extension and hard-rejects anything else as corrupt (which is
 * exactly what happened when we shipped an HTML table named .xlsx). This
 * module emits a genuine OOXML package: five XML parts inside a ZIP built
 * with STORED (uncompressed) entries, so no compression library is needed.
 *
 * Scope is intentionally tiny: one sheet, every cell an inline string.
 * That is all the table export needs; reach for a real spreadsheet library
 * if formulas/styles/number types ever become a requirement.
 */

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Characters that are not legal in XML 1.0 even when escaped. */
function stripInvalidXmlChars(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/** 0-based column index -> spreadsheet column letters (0 -> A, 26 -> AA). */
function columnRef(index: number): string {
  let ref = "";
  let i = index + 1;
  while (i > 0) {
    const rem = (i - 1) % 26;
    ref = String.fromCharCode(65 + rem) + ref;
    i = Math.floor((i - 1) / 26);
  }
  return ref;
}

/** Excel limits sheet names to 31 chars and bans []:*?/\ */
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, " ").trim();
  return (cleaned || "Sheet1").slice(0, 31);
}

// ---------------------------------------------------------------------------
// ZIP (STORED entries only)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime =
    (now.getHours() << 11) |
    (now.getMinutes() << 5) |
    Math.floor(now.getSeconds() / 2);
  const dosDate =
    ((now.getFullYear() - 1980) << 9) |
    ((now.getMonth() + 1) << 5) |
    now.getDate();

  for (const { name, data } of entries) {
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // local file header signature
    local.setUint16(4, 20, true); // version needed to extract
    local.setUint16(6, 0x0800, true); // general purpose flags: UTF-8 names
    local.setUint16(8, 0, true); // compression method: STORED
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); // compressed size (= raw, STORED)
    local.setUint32(22, data.length, true); // uncompressed size
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true); // extra field length
    localChunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true); // central directory signature
    central.setUint16(4, 20, true); // version made by
    central.setUint16(6, 20, true); // version needed to extract
    central.setUint16(8, 0x0800, true); // UTF-8 names
    central.setUint16(10, 0, true); // STORED
    central.setUint16(12, dosTime, true);
    central.setUint16(14, dosDate, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, nameBytes.length, true);
    // extra len / comment len / disk start / internal+external attrs all 0
    central.setUint32(42, offset, true); // local header offset
    centralChunks.push(new Uint8Array(central.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const centralSize = centralChunks.reduce((n, c) => n + c.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true); // end of central directory signature
  eocd.setUint16(8, entries.length, true); // entries on this disk
  eocd.setUint16(10, entries.length, true); // total entries
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, offset, true); // central directory offset

  const out = new Uint8Array(offset + centralSize + 22);
  let p = 0;
  for (const chunk of [...localChunks, ...centralChunks, new Uint8Array(eocd.buffer)]) {
    out.set(chunk, p);
    p += chunk.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// OOXML parts
// ---------------------------------------------------------------------------

function buildSheetXml(rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  const rowsXml = rows
    .map((cells, r) => {
      const cellsXml = cells
        .map((value, c) => {
          const text = escapeXml(stripInvalidXmlChars(String(value ?? "")));
          return `<c r="${columnRef(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cellsXml}</row>`;
    })
    .join("");
  return `${XML_DECL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
}

/**
 * Build a valid .xlsx Blob from a 2-D array of cell values (first row is
 * typically the header row). Cells are stringified; null/undefined become
 * empty cells.
 */
export function buildXlsxBlob(
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
  sheetName = "Sheet1"
): Blob {
  const safeSheetName = sanitizeSheetName(sheetName);

  const contentTypes = `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;

  const rootRels = `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const workbookXml = `${XML_DECL}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(safeSheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels = `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;

  const encoder = new TextEncoder();
  const zip = buildZip([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypes) },
    { name: "_rels/.rels", data: encoder.encode(rootRels) },
    { name: "xl/workbook.xml", data: encoder.encode(workbookXml) },
    { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(workbookRels) },
    { name: "xl/worksheets/sheet1.xml", data: encoder.encode(buildSheetXml(rows)) },
  ]);

  return new Blob([zip], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
