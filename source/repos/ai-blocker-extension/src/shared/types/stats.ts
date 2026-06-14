export interface DaySummary {
  images: number;
  text: number;
  widgets: number;
  networkRequests: number;
  total: number;
}

export const EMPTY_SUMMARY: DaySummary = {
  images: 0,
  text: 0,
  widgets: 0,
  networkRequests: 0,
  total: 0,
};
