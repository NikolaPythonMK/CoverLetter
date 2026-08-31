import { NextRequest, NextResponse } from "next/server";
// IMPORTANT: use standalone build (no AFM lookups)
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import fs from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LetterData = {
  salutation?: string;
  intro?: string;
  bullets?: string[];
  body?: string;
  closing?: string;
  signatureName?: string;
};

const FONT_REGULAR_PATH = path.join(process.cwd(), "public", "fonts", "ARIAL.ttf");
const FONT_BOLD_PATH = path.join(process.cwd(), "public", "fonts", "ARIALBD.ttf");

function mustRead(p: string) {
  if (!fs.existsSync(p)) throw new Error(`Font file missing at ${p}`);
  return fs.readFileSync(p);
}

function sanitizeFileName(s: string) {
  return (s || "Cover Letter").replace(/[^a-z0-9\-_. ]+/gi, "_");
}
function formatDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function composeFromStructured(s: LetterData): string {
  const parts: string[] = [];
  if (s.salutation) parts.push(s.salutation);
  if (s.intro) parts.push(s.intro);
  if (s.bullets?.length) parts.push(s.bullets.map((b) => `• ${b}`).join("\n"));
  if (s.body) parts.push(s.body);
  if (s.closing) parts.push(s.closing);
  if (s.signatureName) parts.push(s.signatureName);
  return parts.join("\n\n");
}

// --- pretty layout constants ---
const SPACING = {
  lineGap: 4,          // extra leading
  paraGap: 5,          // space after paragraphs
  bulletGap: 6,        // space between bullets
  sectionGap: 16,      // gap after salutation/closing blocks
  titleSize: 22,
  dateSize: 10,
  bodySize: 12,
};

async function renderPdfBytes(opts: { title?: string; content: string }) {
  const { title = "Cover Letter", content } = opts;

  return await new Promise<Uint8Array>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 64, bottom: 64, left: 68, right: 68 },
      info: { Title: title },
      bufferPages: true,
    });

    // embed fonts (no AFM)
    doc.registerFont("Body", mustRead(FONT_REGULAR_PATH));
    doc.registerFont("BodyBold", mustRead(FONT_BOLD_PATH));

    // collect bytes as Uint8Array
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: unknown) => {
      if (typeof c === "string") chunks.push(new TextEncoder().encode(c));
      else if (c instanceof Uint8Array) chunks.push(c);
      else chunks.push(new Uint8Array(c as ArrayBufferLike));
    });
    doc.on("end", () => {
      const total = chunks.reduce((n, u) => n + u.byteLength, 0);
      const merged = new Uint8Array(total);
      let off = 0;
      for (const u of chunks) { merged.set(u, off); off += u.byteLength; }
      resolve(merged);
    });
    doc.on("error", reject);

    const blockWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ===== Header =====
    doc.fillColor("#000").font("BodyBold").fontSize(SPACING.titleSize)
       .text(title, doc.page.margins.left, doc.y, { width: blockWidth, align: "left" });

    doc.moveDown(0.2);
    doc.font("Body").fontSize(SPACING.dateSize).fillColor("#666")
       .text(formatDate(), { width: blockWidth, align: "left" });

    // hairline divider
    doc.moveTo(doc.page.margins.left, doc.y + 8)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y + 8)
       .strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.moveDown(1.2);

    // ===== Body =====
    doc.font("Body").fontSize(SPACING.bodySize).fillColor("#000");

    const paras = content.replace(/\r\n/g, "\n").split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

    const isSalutation = (s: string) => /^dear\b/i.test(s);
    const isClosing = (s: string) => /^(sincerely|kind regards|best regards|regards|respectfully)\b/i.test(s);

    const textOpts = {
      width: blockWidth,
      align: "left" as const,
      lineGap: SPACING.lineGap,
      paragraphGap: SPACING.paraGap,
    };

    for (let i = 0; i < paras.length; i++) {
      const para = paras[i];

      // bullets (•, -, – at line start)
      const lines = para.split("\n").map(l => l.trim()).filter(Boolean);
      const isBulletBlock = lines.length > 0 &&
        lines.every(l => /^([•\-–])\s+/.test(l) || l.startsWith("• ") || l.startsWith("- "));

      // extra spacing for salutation / closing blocks
      if (isSalutation(para)) doc.moveDown(SPACING.sectionGap / 10);

      if (isBulletBlock) {
        const items = lines.map(l => l.replace(/^([•\-–])\s+/, "").replace(/^•\s+|-+\s+/, ""));
        doc.list(items, {
          width: blockWidth,
          bulletRadius: 2,
          bulletIndent: 8,
          textIndent: 16,
          lineGap: SPACING.lineGap,
        });
        doc.moveDown(SPACING.bulletGap / 10 + 0.4);
      } else {
        doc.text(para, textOpts);
      }

      if (isClosing(para)) doc.moveDown(SPACING.sectionGap / 10 + 0.4);
    }

    doc.end();
  });
}

async function handle(params: URLSearchParams | null, body: any) {
  const title =
    (params?.get("title")) ||
    (typeof body?.title === "string" && body.title) ||
    "Cover Letter";
  const disposition =
    (params?.get("disposition")) ||
    (typeof body?.disposition === "string" && body.disposition) ||
    "attachment";

  let content = "";
  if (typeof body?.content === "string") content = body.content;
  else if (params?.get("content")) content = params.get("content") || "";
  else if (body?.structured) content = composeFromStructured(body.structured as LetterData);
  else if (params?.get("structured")) {
    try { content = composeFromStructured(JSON.parse(params.get("structured") || "{}")); } catch {}
  }

  if (!content.trim()) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  const bytes = await renderPdfBytes({ title, content });
  const filename = `${sanitizeFileName(title)}.pdf`;

  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;

  // NEW: support ?id=... (auth + ownership enforced)
  const id = params.get("id");
  if (id) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const letter = await prisma.letter.findUnique({ where: { id } });
    if (!letter) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (letter.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const title = letter.title || letter.jobTitle || "Cover Letter";
    const bytes = await renderPdfBytes({ title, content: letter.content });
    const filename = `${sanitizeFileName(title)}.pdf`;

    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // fallback: original behavior (content/structured via query/body)
  return handle(params, null);
}

export async function POST(req: NextRequest) {
  // Also allow POST with { id } or with { content|structured }
  const body = await req.json().catch(() => ({}));

  if (body?.id) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const letter = await prisma.letter.findUnique({ where: { id: String(body.id) } });
    if (!letter) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (letter.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const title = letter.title || letter.jobTitle || "Cover Letter";
    const bytes = await renderPdfBytes({ title, content: letter.content });
    const filename = `${sanitizeFileName(title)}.pdf`;

    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // fallback: original behavior
  return handle(null, body);
}
