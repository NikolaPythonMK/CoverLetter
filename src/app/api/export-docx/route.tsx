import { NextRequest, NextResponse } from "next/server";
import { renderDocxTemplate, type LetterData } from "@/lib/docx-template"; // ← import LetterData

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Cover Letter";
  const templateName = (searchParams.get("template") || "classic").toLowerCase();
  const structured = searchParams.get("structured");

  if (!structured) {
    return NextResponse.json({ error: "Missing 'structured' query param" }, { status: 400 });
  }

  let s: any;
  try {
    s = JSON.parse(structured);
  } catch {
    return NextResponse.json({ error: "Invalid JSON in 'structured'" }, { status: 400 });
  }

  // 🔹 Build a proper LetterData object (what renderDocxTemplate expects)
  const data: LetterData = {
    salutation: s.salutation ?? "Dear Hiring Manager,",
    intro: s.intro ?? "",
    bullets: Array.isArray(s.bullets) ? s.bullets : [],
    body: s.body ?? "",
    closing: s.closing ?? "",
    signatureName: s.signatureName ?? "",
    meta: s.meta ?? {},
    applicant: s.applicant ?? {},
    hiringManager: s.hiringManager ?? {},
    // NOTE: don't pass plain here; DOCX templates are structured
  };

  try {
    const bytes = await renderDocxTemplate(templateName, data); // ← pass LetterData, NOT the uppercase map
    const safe = title.replace(/[^a-z0-9-_]+/gi, "_");
    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safe}.docx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Docx render failed", detail: e?.message ?? e }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title = "Cover Letter", template = "classic", structured } = await req.json();

    if (!structured) {
      return NextResponse.json({ error: "Missing 'structured' in body" }, { status: 400 });
    }

    const data: LetterData = structured; // trust caller shape
    const bytes = await renderDocxTemplate(String(template).toLowerCase(), data);
    const safe = String(title).replace(/[^a-z0-9-_]+/gi, "_");

    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safe}.docx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Docx render failed", detail: e?.message ?? e }, { status: 500 });
  }
}

