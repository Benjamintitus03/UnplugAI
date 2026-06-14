export type ContentType = "image" | "text" | "widget" | "network-request";
export type DetectionSource = "dnr" | "url-pattern" | "dom-heuristic" | "c2pa" | "hive" | "gptzero";

export interface DetectionResult {
  isAI: boolean;
  confidence: number;
  source: DetectionSource;
  contentType: ContentType;
  detail?: string;
}
