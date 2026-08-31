import { NextResponse } from "next/server";

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const urls = ["", "/generator", "/dashboard", "/billing", "/blog"];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join("\n")}
</urlset>`;
  return new NextResponse(body, { headers: { "Content-Type": "application/xml" } });
}
