"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Card } from "./Card";
import type { Aspect, Extracted, Theme } from "./types";

const aspectLabels: Record<Aspect, string> = {
  "16:9": "Slide (16:9)",
  "4:5": "Portrait (4:5)",
  "1:1": "Square (1:1)",
  auto: "Auto height",
};

const themeLabels: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  newspaper: "Newsprint",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<Extracted | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [paragraphCount, setParagraphCount] = useState(2);
  const [showImage, setShowImage] = useState(true);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function fetchArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to fetch article");
      } else {
        setData(json);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function exportPng() {
    if (!cardRef.current || !data) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: undefined,
      });
      const link = document.createElement("a");
      const safe = (data.title || "newsclip")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
      link.download = `${safe || "newsclip"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError(`Export failed: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-[1400px] mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">NewsClipper</h1>
        <p className="text-zinc-600 mt-1">
          Paste an article URL — get a clean headline + image + first paragraphs as a PNG, no ads.
        </p>
      </header>

      <form onSubmit={fetchArticle} className="flex gap-2 mb-6">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.nytimes.com/..."
          className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 text-white px-5 py-2.5 font-medium hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(themeLabels) as Theme[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTheme(k)}
                    className={`rounded-md border px-2 py-2 text-xs font-medium ${
                      theme === k
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {themeLabels[k]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Aspect ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(aspectLabels) as Aspect[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setAspect(k)}
                    className={`rounded-md border px-2 py-2 text-xs font-medium ${
                      aspect === k
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {aspectLabels[k]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Paragraphs: {paragraphCount}
              </label>
              <input
                type="range"
                min={0}
                max={Math.max(1, data.paragraphs.length)}
                value={paragraphCount}
                onChange={(e) => setParagraphCount(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            {data.heroImage && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showImage}
                  onChange={(e) => setShowImage(e.target.checked)}
                />
                Include hero image
              </label>
            )}

            <button
              onClick={exportPng}
              disabled={exporting}
              className="w-full rounded-md bg-emerald-600 text-white px-4 py-2.5 font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {exporting ? "Rendering…" : "Download PNG"}
            </button>

            <div className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-200 pt-4">
              Source: <span className="font-medium">{data.siteName}</span>
              <br />
              {data.paragraphs.length} paragraph
              {data.paragraphs.length === 1 ? "" : "s"} extracted.
            </div>
          </aside>

          <div className="overflow-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4">
            <div
              className="origin-top-left"
              style={{ transform: "scale(0.55)", width: "fit-content" }}
            >
              <Card
                ref={cardRef}
                data={data}
                theme={theme}
                aspect={aspect}
                paragraphCount={paragraphCount}
                showImage={showImage}
              />
            </div>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-zinc-500">
          <p className="text-sm">Paste a news article URL above to get started.</p>
          <p className="text-xs mt-2">
            Tip: works best on public articles. Paywalled content may show only a snippet.
          </p>
        </div>
      )}
    </main>
  );
}
