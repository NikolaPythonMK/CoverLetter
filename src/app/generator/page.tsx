// src/app/generator/page.tsx
"use client";

import { useRef, useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type TargetKind = "job" | "resume";

function PageOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-md">
      <div className="flex items-center gap-5 rounded-2xl border border-white/15 bg-white/10 px-10 py-8 text-white shadow-2xl">
        <Loader2 className="h-14 w-14 animate-spin" />
        <span className="text-xl font-semibold tracking-wide">
          {label ?? "Working…"}
        </span>
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  // Inputs
  const [jobPost, setJobPost] = useState("");
  const [resume, setResume] = useState("");
  const [title, setTitle] = useState("");

  // Generation + Editing
  const [editorText, setEditorText] = useState("");

  // Global busy overlay
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState<string>("");

  // (optional) legacy flags if you still want them for small UI tweaks
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingJob, setUploadingJob] = useState(false);

  // Exports (kept for future signed URLs etc.)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxUrl, setDocxUrl] = useState<string | null>(null);

  const jobInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Keep a default template value to satisfy your API
  const template = "classic";

  const canGenerate = useMemo(
    () => !!jobPost && !!resume && !busy,
    [jobPost, resume, busy]
  );

  const withOverlay = async (label: string, fn: () => Promise<void>) => {
    setBusy(true);
    setBusyText(label);
    try {
      await fn();
    } finally {
      setBusy(false);
      setBusyText("");
    }
  };

const generate = async () =>
  withOverlay("Generating…", async () => {
    setLoading(true);
    setEditorText("");
    setPdfUrl(null);
    setDocxUrl(null);
    // optional if you track these:
    // setTier(undefined); setModelUsed(undefined); setAtsReport(null); setStructured(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobPost, resume, title, template }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const payload = isJson ? await res.json() : { error: await res.text() };

      // Handle auth/limits explicitly
      if (res.status === 401) {
        // not logged in → send to login then back here
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/generator")}`;
        return;
      }
      if (res.status === 402) {
        // monthly limit reached → send to pricing section
        window.location.href = `/#pricing`;
        return;
      }
      if (!res.ok) {
        throw new Error(payload?.error || `Request failed (${res.status})`);
      }

      // Tier-aware fields (present for all tiers; atsReport only for pro/premium)
      // If you have these states, set them:
      // setTier(payload.tier);                // "free" | "pro" | "premium"
      // setModelUsed(payload.modelUsed);      // e.g., "gpt-4o" or fallback
      // setAtsReport(payload.atsReport || null);
      // setStructured(payload.structured || null);

      const content = (payload.content as string) || "";
      setEditorText(content);

      if (payload.pdfUrl) setPdfUrl(payload.pdfUrl);
      if (payload.docxUrl) setDocxUrl(payload.docxUrl);
    } catch (err: any) {
      console.error("Generate error:", err);
      alert(err?.message || "Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  });


  async function downloadPdfPOST() {
    if (!editorText.trim()) return;
    await withOverlay("Preparing PDF…", async () => {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Cover Letter",
          content: editorText,
          disposition: "attachment",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || `Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "Cover Letter").replace(/[^a-z0-9-_]+/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  async function uploadAndExtract(file: File, target: TargetKind) {
    if (!file) return;
    const isResume = target === "resume";
    isResume ? setUploadingResume(true) : setUploadingJob(true);

    await withOverlay(isResume ? "Uploading resume…" : "Uploading job post…", async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/extract-text", { method: "POST", body: fd });
        const data = await r.json();
        if (!r.ok) {
          alert(data.error || "Failed to extract text");
          return;
        }
        const text = (data.text as string) || "";
        if (!text) {
          alert("No text found in file.");
          return;
        }
        if (isResume) setResume((p) => (p ? p + "\n\n" + text : text));
        else setJobPost((p) => (p ? p + "\n\n" + text : text));
      } catch (e: any) {
        alert(e?.message || "Upload failed");
      } finally {
        isResume ? setUploadingResume(false) : setUploadingJob(false);
      }
    });
  }

  const accept =
    ".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword";

  const DropZone = ({
    label,
    hint,
    uploading,
    inputRef,
    target,
    accept,
  }: {
    label: string;
    hint: string;
    uploading: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
    target: TargetKind;
    accept: string;
  }) => {
    const openPicker = () => inputRef.current?.click();
    const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = input.files?.[0];
      if (file) await uploadAndExtract(file, target);
      if (input) input.value = "";
    };

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-white">{label}</div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            if (busy) return;
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            await uploadAndExtract(file, target);
            if (inputRef.current) inputRef.current.value = "";
          }}
          role="button"
          tabIndex={0}
          aria-busy={uploading}
          className="group relative rounded-xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur-md transition hover:bg-white/10 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium text-white">Upload PDF / DOCX</div>
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              className="rounded-full border-white/20 bg-white/10 text-white hover:opacity-90 disabled:opacity-60"
              onClick={openPicker}
            >
              Choose file
            </Button>
          </div>
          <div className="mt-2 text-xs text-white/60">{hint}</div>
        </div>

        <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="sr-only" />
      </div>
    );
  };

  // Fallback export links using plain content (left as-is)
  const fallbackPdfHref = `/api/export-pdf?title=${encodeURIComponent(
    title || "Cover Letter"
  )}&template=${encodeURIComponent(template)}&disposition=inline&content=${encodeURIComponent(editorText)}`;

  const fallbackDocxHref = `/api/export-docx?title=${encodeURIComponent(
    title || "Cover Letter"
  )}&template=${encodeURIComponent(template)}&content=${encodeURIComponent(editorText)}`;

  return (
    <div className="relative" aria-busy={busy}>
      {/* background accents (clipped so they don't cause horizontal scroll) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[8%] h-[480px] w-[480px] rounded-full opacity-25 blur-3xl [background:radial-gradient(closest-side,rgba(99,102,241,0.25),transparent_65%)]" />
        <div className="absolute right-[5%] top-[20%] h-[420px] w-[420px] rounded-full opacity-20 blur-3xl [background:radial-gradient(closest-side,rgba(56,189,248,0.22),transparent_60%)]" />
      </div>

      {/* TOP BAR (sticky) – unchanged so Generate stays fixed relative to the page */}
      <div className="sticky top-16 z-40 border-b border-white/10 bg-black/30 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-black/20">
        <div className="container mx-auto flex items-center gap-1 sm:gap-2">
          {/* Title: grows, can truncate */}
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-sm sm:text-base md:text-lg font-semibold leading-tight text-white">
              Compose Cover Letter
            </h1>
          </div>

          {/* Button: never shrinks; smaller on mobile */}
          <div className="shrink-0">
            <Button
              onClick={generate}
              disabled={!canGenerate}
              className="rounded-full !bg-[#2c974b] px-5 py-3 text-sm sm:px-7 sm:py-4 sm:text-base md:px-8 md:py-5 font-semibold text-white shadow-md ring-1 ring-black/10 hover:!bg-[#2c974b] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-[1px] disabled:opacity-60"
              title={!canGenerate ? 'Paste job post and resume to enable' : 'Generate letter'}
            >
              Generate
            </Button>
          </div>
        </div>
      </div>


      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT: Inputs */}
          <div className="space-y-5 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <label className="text-sm font-medium text-white">Title (optional)</label>
              <Input
                placeholder="e.g. Backend Engineer at Stripe — Berlin"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>

            {/* Job posting */}
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white">Job Posting</label>
              </div>
              <Textarea
                placeholder="Paste the job posting..."
                value={jobPost}
                onChange={(e) => setJobPost(e.target.value)}
                className="bg-white/5 text-white placeholder:text-white/40"
                style={{ minHeight: 180 }}
              />
              {/* <DropZone
                label="Attach job description file"
                hint="Drag & drop or click. Max 5MB. PDF or DOCX."
                uploading={uploadingJob}
                inputRef={jobInputRef}
                target="job"
                accept={accept}
              /> */}
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{jobPost.trim().length} chars</span>
                <span>Tip: Include responsibilities & requirements</span>
              </div>
            </div>

            {/* Resume */}
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white">Resume / Highlights</label>
              </div>
              <Textarea
                placeholder="Paste your resume (or highlights)…"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="bg-white/5 text-white placeholder:text-white/40"
                style={{ minHeight: 220 }}
              />
              <DropZone
                label="Attach resume file"
                hint="Drag & drop or click. Max 5MB. PDF or DOCX."
                uploading={uploadingResume}
                inputRef={resumeInputRef}
                target="resume"
                accept={accept}
              />
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{resume.trim().length} chars</span>
                <span>Tip: Use bullet points with metrics</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Editable Preview */}
          <div className="space-y-5 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Editable Preview</h2>
                <div className="text-xs text-white/60">
                  {editorText ? "Click and edit directly" : "Your letter will appear here"}
                </div>
              </div>

              {!editorText ? (
                <div className="space-y-3 text-sm text-white/60">
                  <p>
                    Once you click <span className="text-white">Generate</span>, your tailored, ATS-ready letter will
                    render here. You can then edit it directly.
                  </p>
                  <ul className="list-disc pl-5">
                    <li>Clear intro that mirrors the role</li>
                    <li>3–4 achievement bullets with metrics</li>
                    <li>Confident closing with availability</li>
                  </ul>
                </div>
              ) : (
                <Textarea
                  className="mt-2 min-h-[520px] w-full whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white"
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                />
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={downloadPdfPOST}
                  variant="outline"
                  disabled={!editorText.trim() || busy}
                  className="rounded-full border-white/20 bg-white/10 text-white hover:opacity-90 disabled:opacity-60"
                >
                  Download PDF
                </Button>

                {/* Optional DOCX */}
                {/* <a className="inline-block" href={docxUrl ? docxUrl : fallbackDocxHref} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    disabled={!editorText.trim() || busy}
                    className="rounded-full border-white/20 bg-white/10 text-white hover:opacity-90 disabled:opacity-60"
                  >
                    Download DOCX
                  </Button>
                </a> */}

                <a className="inline-block" href="/dashboard">
                  <Button
                    disabled={!editorText.trim() || busy}
                    className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:opacity-90 disabled:opacity-60"
                  >
                    Save & View in Library
                  </Button>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 backdrop-blur-md">
              <h3 className="mb-2 text-white">Pro tips</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                <li>Mirror keywords from the post</li>
                <li>Quantify impact (%, $, time)</li>
                <li>Keep to one page</li>
                <li>Match tone to company</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Global overlay */}
      <PageOverlay show={busy} label={busyText} />
    </div>
  );
}
