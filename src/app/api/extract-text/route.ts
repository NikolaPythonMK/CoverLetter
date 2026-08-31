import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = (file.name || "").toLowerCase();
    const mime = (file.type || "").toLowerCase();
    const ext = filename.split(".").pop() || "";

    const isPdf = mime === "application/pdf" || ext === "pdf";
    const isDocx =
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx";
    const isLegacyDoc = mime === "application/msword" || ext === "doc";

    if (isLegacyDoc) {
      return NextResponse.json(
        { error: "Legacy .doc not supported. Please convert to .docx or PDF." },
        { status: 415 }
      );
    }
    if (!isPdf && !isDocx) {
      return NextResponse.json({ error: "Unsupported file type. Please upload PDF or DOCX." }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (isPdf) {
      const mod = await import("pdf-parse");        // <- normal import, now external
      const pdfParse = (mod as any).default || mod; // CJS/ESM safe
      const data = await pdfParse(buffer);
      text = (data?.text || "").trim();
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = (result?.value || "").trim();
    }

    if (!text) return NextResponse.json({ error: "No text found in file." }, { status: 422 });
    text = text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("extract-text error:", e?.stack || e);
    return NextResponse.json({ error: e?.message || "Failed to extract text" }, { status: 500 });
  }
}
