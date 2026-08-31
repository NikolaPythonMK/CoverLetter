"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  template: string;              // "classic" | "modern" (or any you add)
  structured?: any | null;       // preferred structured JSON, if you have it
  content?: string;              // plain text fallback
  className?: string;
};

export default function PdfPreview({ title, template, structured, content, className }: Props) {
  const [url, setUrl] = useState<string>("");
  const revokeRef = useRef<string | null>(null);

  // Serialize props to trigger refresh
  const key = useMemo(
    () => JSON.stringify({ title, template, structured, content }),
    [title, template, structured, content]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // cleanup previous blob
      if (revokeRef.current) {
        URL.revokeObjectURL(revokeRef.current);
        revokeRef.current = null;
      }

      // If nothing to preview yet, show placeholder
      if (!structured && !content) {
        setUrl("");
        return;
      }

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          template,
          structured: structured ?? undefined,
          content: structured ? undefined : content,
          disposition: "inline",
        }),
      });
      if (!res.ok) {
        setUrl("");
        return;
      }
      const blob = await res.blob();
      if (cancelled) return;
      const objectUrl = URL.createObjectURL(blob);
      revokeRef.current = objectUrl;
      setUrl(objectUrl);
    };

    const handle = setTimeout(run, 300); // debounce
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [key]);

  useEffect(() => {
    return () => {
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
    };
  }, []);

  return (
    <div className={className}>
      {url ? (
        <iframe
          src={url}
          className="h-[560px] w-full rounded-xl border border-white/10 bg-white"
          title="PDF preview"
        />
      ) : (
        <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-white/20 text-white/60">
          PDF preview will appear here
        </div>
      )}
    </div>
  );
}
