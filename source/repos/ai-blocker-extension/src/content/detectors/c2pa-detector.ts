import type { DetectionResult } from "../../shared/types/detection";

const AI_PRODUCERS = [
  "Adobe Firefly",
  "DALL-E",
  "Midjourney",
  "Stable Diffusion",
  "Imagen",
  "Gemini",
  "Sora",
  "Bing Image Creator",
];

export async function detectC2PA(imageUrl: string): Promise<DetectionResult | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { Range: "bytes=0-65535" },
      // Reuse cached response where possible
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const producer = extractC2PAProducer(buffer);
    if (!producer) return null;

    const isAI = AI_PRODUCERS.some((p) =>
      producer.toLowerCase().includes(p.toLowerCase()),
    );

    return {
      isAI,
      confidence: isAI ? 0.99 : 0.5,
      source: "c2pa",
      contentType: "image",
      detail: `C2PA producer: ${producer}`,
    };
  } catch {
    return null;
  }
}

// Scans for JUMBF box signature and extracts producer string from C2PA manifest
function extractC2PAProducer(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);
  const jumb = [0x6a, 0x75, 0x6d, 0x62]; // "jumb"
  const c2pa = [0x63, 0x32, 0x70, 0x61]; // "c2pa"

  for (let i = 0; i < bytes.length - 8; i++) {
    if (
      bytes[i] === jumb[0] &&
      bytes[i + 1] === jumb[1] &&
      bytes[i + 2] === jumb[2] &&
      bytes[i + 3] === jumb[3]
    ) {
      for (let j = i; j < Math.min(i + 4096, bytes.length - 4); j++) {
        if (
          bytes[j] === c2pa[0] &&
          bytes[j + 1] === c2pa[1] &&
          bytes[j + 2] === c2pa[2] &&
          bytes[j + 3] === c2pa[3]
        ) {
          return extractString(bytes, j + 4, 128);
        }
      }
    }
  }
  return null;
}

function extractString(bytes: Uint8Array, offset: number, maxLen: number): string | null {
  const slice = bytes.slice(offset, Math.min(offset + maxLen, bytes.length));
  const str = new TextDecoder("utf-8", { fatal: false }).decode(slice);
  const cleaned = str.replace(/[^\x20-\x7E]/g, "").trim();
  return cleaned.length > 2 ? cleaned : null;
}
