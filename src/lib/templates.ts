// src/lib/templates.ts
import { rgb } from "pdf-lib";
import type { TemplateProps, DrawContext, TemplateName } from "./pdf-template-kit";
import { createContext, makeBlock, drawBullets, watermarkAllPages } from "./pdf-template-kit";

function headerClassic(ctx: DrawContext, title: string, meta?: { role?: string; company?: string }) {
  const h1 = makeBlock(ctx, { font: ctx.bold, size: 16 });
  const sub = makeBlock(ctx, { size: 11, color: rgb(0.34,0.34,0.34) });
  h1(title);
  const subline = [meta?.role || "Cover Letter", meta?.company].filter(Boolean).join(" · ");
  if (subline) sub(subline);
  ctx.y -= 8;
}

function headerModern(ctx: DrawContext, title: string, meta?: { role?: string; company?: string }) {
  // accent bar
  ctx.page.drawRectangle({ x: ctx.x - 16, y: ctx.y - 24, width: 6, height: 36, color: rgb(0.31,0.27,0.9), borderRadius: 2 });
  headerClassic(ctx, title, meta);
}

export async function renderClassic(props: TemplateProps) {
  const doc = await PDFDocument.create();
  const ctx = await createContext(doc);
  const block = makeBlock(ctx);
  headerClassic(ctx, props.title, (props as any).data.meta);

  if ("plain" in props.data) {
    const first = props.data.plain.split("\n")[0] || "";
    const looksSal = /^dear\b/i.test(first.trim());
    const txt = looksSal ? props.data.plain : `Dear Hiring Manager,\n\n${props.data.plain}`;
    block(txt);
  } else {
    const d = props.data;
    if (d.salutation) block(d.salutation);
    if (d.intro) { block(d.intro); ctx.y -= 2; }
    if (d.bullets?.length) { drawBullets(ctx, d.bullets); ctx.y -= 2; }
    if (d.body) { block(d.body); ctx.y -= 2; }
    if (d.closing) { block(d.closing); ctx.y -= 6; }
    if (d.signatureName) {
      const sig = makeBlock(ctx, { font: ctx.bold });
      sig(d.signatureName);
    }
  }

  if (props.watermark) watermarkAllPages(doc, props.watermark, ctx.font);
  return doc.save();
}

export async function renderModern(props: TemplateProps) {
  const doc = await PDFDocument.create();
  const ctx = await createContext(doc);
  const block = makeBlock(ctx);
  headerModern(ctx, props.title, (props as any).data.meta);

  if ("plain" in props.data) {
    const first = props.data.plain.split("\n")[0] || "";
    const looksSal = /^dear\b/i.test(first.trim());
    const txt = looksSal ? props.data.plain : `Dear Hiring Manager,\n\n${props.data.plain}`;
    block(txt);
  } else {
    const d = props.data;
    if (d.salutation) block(d.salutation);
    if (d.intro) { block(d.intro); ctx.y -= 2; }
    if (d.bullets?.length) { drawBullets(ctx, d.bullets); ctx.y -= 2; }
    if (d.body) { block(d.body); ctx.y -= 2; }
    if (d.closing) { block(d.closing); ctx.y -= 6; }
    if (d.signatureName) {
      const sig = makeBlock(ctx, { font: ctx.bold });
      sig(d.signatureName);
    }
  }

  if (props.watermark) watermarkAllPages(doc, props.watermark, ctx.font);
  return doc.save();
}

// Example: a “letterhead” template with a top contact band (you can expand later)
export async function renderLetterhead(props: TemplateProps & { contact?: { name?: string; email?: string; phone?: string; linkedin?: string } }) {
  const doc = await PDFDocument.create();
  const ctx = await createContext(doc);

  // top band
  ctx.page.drawRectangle({ x: 0, y: ctx.page.getHeight() - 70, width: ctx.page.getWidth(), height: 70, color: rgb(0.96, 0.97, 1) });
  const titleBlock = makeBlock(ctx, { font: ctx.bold, size: 14, color: rgb(0.18,0.2,0.45) });
  const muted = makeBlock(ctx, { size: 10, color: rgb(0.35,0.4,0.6) });
  ctx.y = ctx.page.getHeight() - 38;
  ctx.x = 50;
  titleBlock(props.title);
  const meta = (props as any).data.meta;
  const line = [meta?.role || "Cover Letter", meta?.company].filter(Boolean).join(" · ");
  if (line) muted(line);
  // reset cursor to normal text area
  ctx.x = ctx.margin;
  ctx.y = ctx.page.getHeight() - ctx.margin - 90;

  const block = makeBlock(ctx);

  if ("plain" in props.data) {
    const first = props.data.plain.split("\n")[0] || "";
    const looksSal = /^dear\b/i.test(first.trim());
    const txt = looksSal ? props.data.plain : `Dear Hiring Manager,\n\n${props.data.plain}`;
    block(txt);
  } else {
    const d = props.data;
    if (d.salutation) block(d.salutation);
    if (d.intro) { block(d.intro); ctx.y -= 2; }
    if (d.bullets?.length) { drawBullets(ctx, d.bullets); ctx.y -= 2; }
    if (d.body) { block(d.body); ctx.y -= 2; }
    if (d.closing) { block(d.closing); ctx.y -= 6; }
    if (d.signatureName) {
      const sig = makeBlock(ctx, { font: ctx.bold });
      sig(d.signatureName);
    }
  }

  if (props.watermark) watermarkAllPages(doc, props.watermark, ctx.font);
  return doc.save();
}

// Registry
export async function renderTemplate(name: TemplateName, props: TemplateProps) {
  switch (name) {
    case "modern":     return renderModern(props);
    case "letterhead": return renderLetterhead(props as any);
    case "classic":
    default:           return renderClassic(props);
  }
}

export async function renderElegant(props: TemplateProps) {
  const doc = await PDFDocument.create();
  const ctx = await createContext(doc);

  // Example: blue bar across top
  ctx.page.drawRectangle({
    x: 0,
    y: ctx.page.getHeight() - 40,
    width: ctx.page.getWidth(),
    height: 40,
    color: rgb(0.2, 0.4, 0.9),
  });

  ctx.y = ctx.page.getHeight() - 70;
  const block = makeBlock(ctx, { font: ctx.bold, size: 16, color: rgb(1,1,1) });
  block(props.title);

  // then same body rendering as classic/modern
  const d = props.data as LetterJson;
  if (d.salutation) block(d.salutation);
  if (d.intro) block(d.intro);
  if (d.bullets?.length) drawBullets(ctx, d.bullets);
  if (d.body) block(d.body);
  if (d.closing) block(d.closing);
  if (d.signatureName) makeBlock(ctx, { font: ctx.bold })(d.signatureName);

  if (props.watermark) watermarkAllPages(doc, props.watermark, ctx.font);
  return doc.save();
}

export type TemplateKey = string; // we’ll discover them dynamically

export function normalizeTemplateName(name: string): TemplateKey {
  return name.trim().toLowerCase().replace(/\.(docx|tsx|jsx|js|ts)$/i, "");
}



// pdf-lib import
import { PDFDocument } from "pdf-lib";import { LetterJson } from "./letter-schema";

