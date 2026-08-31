// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { PLAN_LIMITS, planFromText } from "@/lib/limits";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function onlyJsonSystem(roleHint?: string) {
  return `You ${roleHint ?? "generate outputs"} as STRICT JSON. Do NOT include markdown fences or commentary. Output ONLY raw JSON.`;
}

function tryParseJson(raw: string): any | null {
  if (!raw) return null;
  const trimmed = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(trimmed.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildContentFromStructured(
  structured:
    | {
        salutation: string;
        intro: string;
        bullets?: string[];
        body?: string;
        closing: string;
        signatureName?: string;
        meta?: { role?: string; company?: string };
      }
    | null,
  fallbackRaw: string
) {
  if (!structured) return fallbackRaw || "Unable to generate content.";
  return [
    structured.salutation,
    "",
    structured.intro,
    ...(structured.bullets?.length ? ["", ...structured.bullets.map((b) => `• ${b}`)] : []),
    structured.body ? ["", structured.body] : [],
    "",
    structured.closing,
    structured.signatureName ? ["", structured.signatureName] : [],
  ]
    .flat()
    .filter(Boolean)
    .join("\n");
}

/**
 * Tier-aware, multi-step model fallback.
 * Tries each model in order; returns first success with the model actually used.
 */
async function chatWithFallback(
  client: OpenAI,
  models: readonly string[], // ← allow readonly
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature: number
) {
  const errors: any[] = [];
  for (const m of models) {
    try {
      const completion = await client.chat.completions.create({
        model: m,
        messages,
      });
      return { completion, modelUsed: m };
    } catch (err: any) {
      console.error(`[chatWithFallback] model=${m} failed`, err?.response?.data ?? err?.message ?? err);
      errors.push({ model: m, error: err?.message ?? String(err) });
    }
  }
  const last = errors.at(-1);
  throw new Error(`All fallback models failed; last=${last?.model}: ${last?.error}`);
}

// Preferred models per tier (keeps pricing fidelity)
const TIER_MODELS = {
  free: ["gpt-3.5-turbo-0125", "gpt-4o-mini"],
  pro: ["gpt-5-mini", "gpt-4o"],
  premium: ["gpt-5", "gpt-5-mini", "gpt-4o"],
} as const;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobPost, resume, title, template = "classic" } = await req.json();
  if (!jobPost || !resume) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plan → normalized → tier (strict to the 3 supported tiers)
  const planNormalized = (planFromText(user.plan) || "").toLowerCase();
  const tier: "free" | "pro" | "premium" =
    planNormalized === "premium" ? "premium" : planNormalized === "pro" ? "pro" : "free";

  // Derive limits from the same tier we actually use
  const limit = PLAN_LIMITS[tier];

  console.log(
    `User ${user.id} (${user.email}) generating cover letter on plan=${user.plan} → tier=${tier}`
  );

  const used = await prisma.letter.count({
    where: { userId: user.id, createdAt: { gte: startOfMonth() } },
  });
  if (limit !== "unlimited" && used >= limit) {
    return NextResponse.json(
      { error: "Monthly limit reached. Upgrade your plan." },
      { status: 402 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const candidateName =
    (session.user.name && session.user.name.trim()) ||
    (user.name && user.name.trim()) ||
    "";

  // === PROMPT (quality boost for pro/premium) ===
  const qualityBoost =
    tier === "free"
      ? ""
      : `
QUALITY BOOST:
- Precisely mirror terminology from the posting (skills, frameworks, certs).
- Weave 5–10 high-value keywords NATURALLY into intro/body/bullets.
- Quantify impact, specify scope, and tie to business outcomes.
- Keep reading level ~Grade 8–10, crisp verbs, minimal filler.
- Avoid generic boilerplate; reference role/company context if present.
- Ensure the letter can pass ATS keyword screening (natural usage).`;

  const prompt = `
Return ONLY valid JSON with keys:
salutation (string),
intro (string),
bullets (string[]),
body (string),
closing (string),
signatureName (string | omit if empty),
meta (object with role, company if known).

RULES:
- 250–350 words total across intro/body/closing.
- Tone: professional, confident, warm.
- Use real role/company if present. If no person named, address "Dear Hiring Manager,".
- 2–4 concise bullet points with quantified impact.
- No placeholders like [Company] or {{Name}}.
- Sign with this exact candidate name if provided (else omit name line): ${candidateName || "(none)"}
${qualityBoost}

JOB POSTING:
${jobPost}

RESUME / HIGHLIGHTS:
${resume}
`;

  // === PRIMARY GENERATION (tier-aware fallback) ===
  const primary = await chatWithFallback(
    openai,
    TIER_MODELS[tier],
    [
      { role: "system", content: onlyJsonSystem("generate structured cover letters") },
      { role: "user", content: prompt },
    ],
    tier === "free" ? 0.6 : 0.5
  );

  let { completion } = primary;
  let modelUsed = primary.modelUsed; // track actual used model

  console.log(`[generate] model=${modelUsed} used for user=${user.id} (${user.email})`);

  let raw = completion.choices[0]?.message?.content?.trim() || "";
  let structured:
    | {
        salutation: string;
        intro: string;
        bullets?: string[];
        body?: string;
        closing: string;
        signatureName?: string;
        meta?: { role?: string; company?: string };
      }
    | null = tryParseJson(raw);

  // === ATS CHECK (Pro & Premium) ===
  let atsReport:
    | {
        score: number;
        missingKeywords: string[];
        risks: string[];
        suggestions: string[];
        keywordMatches?: { keyword: string; evidence?: string }[];
        formatFlags?: string[];
      }
    | null = null;

  if (structured && (tier === "pro" || tier === "premium")) {
    const atsPrompt = `
You are an ATS scanner. Analyze and return STRICT JSON with keys:
- score (number 0-100)
- missingKeywords (string[])
- risks (string[])
- suggestions (string[])
- keywordMatches (array of { keyword, evidence? })
- formatFlags (string[])

JOB POSTING:
${jobPost}

RESUME / HIGHLIGHTS:
${resume}

CANDIDATE NAME:
${candidateName || "(unknown)"}

LETTER (structured JSON already generated):
${JSON.stringify(structured)}
`;
    try {
      const ats = await chatWithFallback(
        openai,
        TIER_MODELS[tier],
        [
          { role: "system", content: onlyJsonSystem("act as an ATS scanner") },
          { role: "user", content: atsPrompt },
        ],
        0.2
      );
      atsReport = tryParseJson(ats.completion.choices[0]?.message?.content?.trim() || "");
      // (we don't override modelUsed here; the content visible to users is the letter/refinement)
    } catch {
      atsReport = null;
    }
  }

  // === PREMIUM REFINEMENT (Premium only) ===
  if (structured && atsReport && tier === "premium") {
    const refinePrompt = `
You are revising a cover letter to maximize ATS success and recruiter appeal.
INPUTS:
- candidateName: ${candidateName || "(none)"}
- baseLetter: ${JSON.stringify(structured)}
- atsReport: ${JSON.stringify(atsReport)}

TASK:
Return STRICT JSON with the SAME KEYS as baseLetter:
{ salutation, intro, bullets[], body, closing, signatureName?, meta? }

RULES:
- Keep total 250–350 words.
- Integrate missingKeywords naturally; do not stuff.
- Address top suggestions/risks from atsReport.
- Preserve authentic tone; keep it concise and specific.
- Use only ASCII-safe characters (no special bullets/tables).
`;
    try {
      const refine = await chatWithFallback(
        openai,
        TIER_MODELS[tier],
        [
          { role: "system", content: onlyJsonSystem("revise the structured letter JSON") },
          { role: "user", content: refinePrompt },
        ],
        0.4
      );
      const refined = tryParseJson(refine.completion.choices[0]?.message?.content?.trim() || "");
      if (refined?.intro && refined?.closing) {
        structured = refined;
        modelUsed = refine.modelUsed; // record the last model that produced the final visible content
      }
    } catch {
      // keep original structured
    }
  }

  const content = buildContentFromStructured(structured, raw);

  const inferredTitle =
    structured?.meta?.role
      ? `${structured.meta.role}${structured?.meta?.company ? " — " + structured.meta.company : ""}`
      : (title || null);

  const inserted = await prisma.letter.create({
    data: {
      userId: user.id,
      title: (title || inferredTitle) ?? "Cover Letter",
      content,
    },
    select: { id: true, title: true },
  });

  // === URLs ===
  const pdfUrl = structured
    ? `/api/export-pdf?title=${encodeURIComponent(inserted.title ?? "")}&template=${encodeURIComponent(
        String(template)
      )}&structured=${encodeURIComponent(JSON.stringify(structured))}`
    : `/api/export-pdf?content=${encodeURIComponent(content)}&title=${encodeURIComponent(
        inserted.title ?? ""
      )}&template=${encodeURIComponent(String(template))}`;

  const docxUrl = structured
    ? `/api/export-docx?title=${encodeURIComponent(inserted.title ?? "")}&template=${encodeURIComponent(
        String(template)
      )}&structured=${encodeURIComponent(JSON.stringify(structured))}`
    : `/api/export-docx?id=${encodeURIComponent(inserted.id)}&title=${encodeURIComponent(
        inserted.title ?? ""
      )}&template=${encodeURIComponent(String(template))}`;

  return NextResponse.json({
    id: inserted.id,
    title: inserted.title,
    tier,       // "free" | "pro" | "premium"
    modelUsed,  // actual model after tier-aware fallback(s)
    content,
    structured,
    atsReport,  // null for free
    template,
    pdfUrl,
    docxUrl,
  });
}
