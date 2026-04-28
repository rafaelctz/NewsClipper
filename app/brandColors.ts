const COLORS: Record<string, string> = {
  "theguardian.com": "#052962",
  "nytimes.com": "#000000",
  "bbc.com": "#BB1919",
  "bbc.co.uk": "#BB1919",
  "washingtonpost.com": "#000000",
  "wsj.com": "#000000",
  "ft.com": "#990F3D",
  "reuters.com": "#FB8C00",
  "apnews.com": "#DA291C",
  "bloomberg.com": "#000000",
  "cnn.com": "#CC0000",
  "foxnews.com": "#003366",
  "theatlantic.com": "#BB1919",
  "newyorker.com": "#000000",
  "economist.com": "#E3120B",
  "npr.org": "#FFC72C",
  "vox.com": "#FFF200",
  "axios.com": "#1A1A1A",
  "politico.com": "#E60000",
  "bloomberg.co.jp": "#000000",
  // Brazilian outlets
  "folha.uol.com.br": "#1A4DA1",
  "estadao.com.br": "#003E7E",
  "g1.globo.com": "#C4170C",
  "globo.com": "#C4170C",
  "uol.com.br": "#1791DC",
  "veja.abril.com.br": "#DC0000",
  "cnnbrasil.com.br": "#CC0000",
};

export function getBrandColor(url: string, fallback: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (COLORS[host]) return COLORS[host];
    const parts = host.split(".");
    for (let i = 1; i < parts.length - 1; i++) {
      const sub = parts.slice(i).join(".");
      if (COLORS[sub]) return COLORS[sub];
    }
  } catch {
    // fall through
  }
  return fallback;
}
