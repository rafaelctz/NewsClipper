export type Extracted = {
  url: string;
  title: string;
  byline: string | null;
  siteName: string | null;
  excerpt: string;
  paragraphs: string[];
  heroImage: string | null;
  publishedTime: string | null;
};

export type Theme = "light" | "dark" | "newspaper";
export type Aspect = "16:9" | "4:5" | "1:1" | "auto";
