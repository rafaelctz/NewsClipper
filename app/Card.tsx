"use client";

import { forwardRef } from "react";
import type { Aspect, Extracted, Theme } from "./types";

const themeStyles: Record<
  Theme,
  {
    bg: string;
    fg: string;
    muted: string;
    rule: string;
    site: string;
    headlineFont: string;
    bodyFont: string;
  }
> = {
  light: {
    bg: "#ffffff",
    fg: "#0a0a0a",
    muted: "#525252",
    rule: "#e5e5e5",
    site: "#0a0a0a",
    headlineFont: "ui-serif, Georgia, 'Times New Roman', serif",
    bodyFont: "ui-serif, Georgia, 'Times New Roman', serif",
  },
  dark: {
    bg: "#0a0a0a",
    fg: "#fafafa",
    muted: "#a3a3a3",
    rule: "#262626",
    site: "#fafafa",
    headlineFont: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    bodyFont: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  },
  newspaper: {
    bg: "#f5f1e8",
    fg: "#1a1a1a",
    muted: "#5a4a3a",
    rule: "#1a1a1a",
    site: "#1a1a1a",
    headlineFont: "ui-serif, Georgia, 'Times New Roman', serif",
    bodyFont: "ui-serif, Georgia, 'Times New Roman', serif",
  },
};

const aspectStyles: Record<Aspect, { width: number; height: number | null }> = {
  "16:9": { width: 1280, height: 720 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  auto: { width: 1080, height: null },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function proxyImage(url: string | null): string | null {
  if (!url) return null;
  return `/api/image?url=${encodeURIComponent(url)}`;
}

type Props = {
  data: Extracted;
  theme: Theme;
  aspect: Aspect;
  paragraphCount: number;
  showImage: boolean;
};

export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { data, theme, aspect, paragraphCount, showImage },
  ref
) {
  const t = themeStyles[theme];
  const a = aspectStyles[aspect];
  const date = formatDate(data.publishedTime);
  const paragraphs = data.paragraphs.slice(0, paragraphCount);
  const hero = showImage ? proxyImage(data.heroImage) : null;

  const containerStyle: React.CSSProperties = {
    width: a.width,
    height: a.height ?? "auto",
    backgroundColor: t.bg,
    color: t.fg,
    fontFamily: t.bodyFont,
    padding: 64,
    display: "flex",
    flexDirection: "column",
    gap: 28,
    boxSizing: "border-box",
    overflow: "hidden",
  };

  return (
    <div ref={ref} style={containerStyle} data-card-root>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 16,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: t.site,
          borderBottom: `2px solid ${t.rule}`,
          paddingBottom: 16,
        }}
      >
        <span>{data.siteName || new URL(data.url).hostname}</span>
        {date && (
          <span style={{ color: t.muted, fontWeight: 500 }}>{date}</span>
        )}
      </div>

      <h1
        style={{
          fontFamily: t.headlineFont,
          fontWeight: 800,
          fontSize: aspect === "16:9" ? 56 : 64,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: 0,
          color: t.fg,
        }}
      >
        {data.title}
      </h1>

      {data.byline && (
        <div style={{ fontSize: 18, color: t.muted, fontStyle: "italic" }}>
          {data.byline}
        </div>
      )}

      {hero && (
        <div
          style={{
            width: "100%",
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: t.rule,
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: "100%",
              height: aspect === "16:9" ? 280 : 420,
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontSize: 22,
          lineHeight: 1.5,
          color: t.fg,
          fontFamily: t.bodyFont,
          flex: 1,
          minHeight: 0,
        }}
      >
        {paragraphs.length === 0 && data.excerpt && (
          <p style={{ margin: 0 }}>{data.excerpt}</p>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} style={{ margin: 0 }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
});
