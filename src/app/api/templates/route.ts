// src/app/api/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeTemplateName } from "@/lib/templates";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const wordDir = path.join(process.cwd(), "src", "word-templates");
   // const pdfDir = path.join(process.cwd(), "src", "lib", "pdf-templates");

    const [wordEntries] = await Promise.allSettled([
      fs.readdir(wordDir).catch(() => []),
     // fs.readdir(pdfDir).catch(() => []),
    ]);

    const wordFiles: string[] =
      wordEntries.status === "fulfilled" ? (wordEntries.value as string[]) : [];
    //const pdfFiles: string[] =
     // pdfEntries.status === "fulfilled" ? (pdfEntries.value as string[]) : [];

    const docx = wordFiles
      .filter((f) => f.toLowerCase().endsWith(".docx"))
      .map((f) => normalizeTemplateName(f));

  //  const pdf = pdfFiles
    //  .filter((f) => !/^(index|types)\./i.test(f))
   //   .filter((f) => /\.(tsx|ts|jsx|js)$/i.test(f))
   //   .map((f) => normalizeTemplateName(f));

    // union (so the dropdown shows all names that exist in either system)
    const all = Array.from(new Set([...docx])).sort();

    return NextResponse.json({ templates: all, docx});
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to list templates", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
