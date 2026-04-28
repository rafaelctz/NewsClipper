import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function absolutize(url: string | null | undefined, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

function pickMeta(doc: Document, names: string[]): string | null {
  for (const name of names) {
    const el =
      doc.querySelector(`meta[property="${name}"]`) ||
      doc.querySelector(`meta[name="${name}"]`);
    const content = el?.getAttribute("content");
    if (content) return content;
  }
  return null;
}

function pickFavicon(doc: Document, base: string): string | null {
  const selectors = [
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'link[rel="icon"][sizes="192x192"]',
    'link[rel="icon"][sizes="180x180"]',
    'link[rel="icon"][sizes="64x64"]',
    'link[rel="icon"][sizes="32x32"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
  ];
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    const href = el?.getAttribute("href");
    if (href) {
      try {
        return new URL(href, base).toString();
      } catch {
        // continue
      }
    }
  }
  try {
    return new URL("/favicon.ico", base).toString();
  } catch {
    return null;
  }
}

function extractParagraphs(html: string, max = 5): string[] {
  const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
  const ps = Array.from(dom.window.document.querySelectorAll("p"));
  const out: string[] = [];
  for (const p of ps) {
    const text = (p.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length < 40) continue;
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http(s) URLs allowed" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Source returned ${res.status}` },
        { status: 502 }
      );
    }
    html = await res.text();
  } catch (e) {
    return NextResponse.json(
      { error: `Fetch failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const dom = new JSDOM(html, { url: parsed.toString() });
  const doc = dom.window.document;

  const ogImage = pickMeta(doc, ["og:image", "twitter:image", "twitter:image:src"]);
  const ogTitle = pickMeta(doc, ["og:title", "twitter:title"]);
  const ogSite = pickMeta(doc, ["og:site_name", "application-name"]);
  const ogPublished = pickMeta(doc, [
    "article:published_time",
    "article:published",
    "og:published_time",
  ]);
  const ogAuthor = pickMeta(doc, ["article:author", "author"]);

  const reader = new Readability(doc).parse();

  const title = reader?.title || ogTitle || doc.title || "";
  const byline = reader?.byline || ogAuthor || null;
  const siteName = reader?.siteName || ogSite || parsed.hostname.replace(/^www\./, "");
  const excerpt = reader?.excerpt || pickMeta(doc, ["og:description", "description"]) || "";

  const paragraphs = reader?.content
    ? extractParagraphs(reader.content, 5)
    : [];

  return NextResponse.json({
    url: parsed.toString(),
    title: title.trim(),
    byline: byline?.trim() || null,
    siteName: siteName?.trim() || null,
    excerpt: excerpt.trim(),
    paragraphs,
    heroImage: absolutize(ogImage, parsed.toString()),
    publishedTime: ogPublished || null,
    faviconUrl: pickFavicon(doc, parsed.toString()),
  });
}
