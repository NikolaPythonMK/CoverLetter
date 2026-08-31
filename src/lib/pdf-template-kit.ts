// src/lib/pdf-template-kit.ts
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import type { LetterJson } from "./letter-schema";

export type TemplateName = "classic" | "modern" | "letterhead";

export type TemplateProps = {
  title: string;
  data: LetterJson | { plain: string }; // allow fallback
  watermark?: string | null;
};

export type DrawContext = {
  doc: PDFDocument;
  page: any;
  font: any;
  bold: any;
  margin: number;
  x: number;
  y: number;
  right: number;
  size: number;
  gap: number;
  color: ReturnType<typeof rgb>;
};

export const A4: [number, number] = [595.28, 841.89];

export function wrap(text: string, max: number, font: any, size: number) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const trial = line ? line + " " + w : w;
    if (font.widthOfTextAtSize(trial, size) > max) {
      if (line) lines.push(line);
      line = w;
    } else line = trial;
  }
  if (line) lines.push(line);
  return lines;
}

export function makeBlock(ctx: DrawContext, opts?: { font?: any; size?: number; color?: ReturnType<typeof rgb> }) {
  const f = opts?.font ?? ctx.font;
  const s = opts?.size ?? ctx.size;
  const c = opts?.color ?? ctx.color;
  const max = ctx.right - ctx.x;

  return (text: string) => {
    const lines = wrap(text, max, f, s);
    for (const ln of lines) {
      if (ctx.y < ctx.margin + s) {
        ctx.page = ctx.doc.addPage(A4);
        ctx.y = ctx.page.getHeight() - ctx.margin;
      }
      ctx.page.drawText(ln, { x: ctx.x, y: ctx.y, size: s, font: f, color: c });
      ctx.y -= s + ctx.gap;
    }
  };
}

export function drawBullets(ctx: DrawContext, items: string[]) {
  const indent = 14;
  for (const it of items) {
    const max = ctx.right - (ctx.x + indent);
    const lines = wrap(it, max, ctx.font, ctx.size);

    // bullet dot
    ctx.page.drawText("•", { x: ctx.x, y: ctx.y, size: ctx.size, font: ctx.bold, color: ctx.color });

    let yy = ctx.y;
    for (const ln of lines) {
      ctx.page.drawText(ln, { x: ctx.x + indent, y: yy, size: ctx.size, font: ctx.font, color: ctx.color });
      yy -= ctx.size + ctx.gap;
    }
    ctx.y = yy;
  }
}

export function watermarkAllPages(doc: PDFDocument, text: string, font: any) {
  const size = 60, col = rgb(0.85,0.85,0.85);
  for (const p of doc.getPages()) {
    const w = p.getWidth(), h = p.getHeight();
    const tw = font.widthOfTextAtSize(text, size);
    p.drawText(text, { x: (w - tw) / 2, y: h / 2, size, font, color: col, rotate: degrees(-35) });
  }
}

export async function createContext(doc: PDFDocument): Promise<DrawContext> {
  const page = doc.addPage(A4);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  return {
    doc, page, font, bold,
    margin,
    x: margin,
    y: page.getHeight() - margin,
    right: page.getWidth() - margin,
    size: 11,
    gap: 4,
    color: rgb(0.08,0.08,0.08),
  };
}
