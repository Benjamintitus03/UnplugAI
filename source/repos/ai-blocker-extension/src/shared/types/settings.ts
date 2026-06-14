export interface UserSettings {
  enabled: boolean;
  imageBlocking: {
    enabled: boolean;
    useCloudFallback: boolean;
    confidenceThreshold: number;
  };
  textBlocking: {
    enabled: boolean;
    useCloudFallback: boolean;
    confidenceThreshold: number;
    minimumWordCount: number;
  };
  widgetBlocking: {
    enabled: boolean;
    customSelectors: string[];
  };
  networkBlocking: {
    enabled: boolean;
  };
  allowlist: { domain: string; disableAll: boolean }[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  enabled: true,
  imageBlocking: {
    enabled: true,
    useCloudFallback: false,
    confidenceThreshold: 0.7,
  },
  textBlocking: {
    enabled: false,
    useCloudFallback: false,
    confidenceThreshold: 0.8,
    minimumWordCount: 50,
  },
  widgetBlocking: {
    enabled: true,
    customSelectors: [],
  },
  networkBlocking: {
    enabled: true,
  },
  allowlist: [],
};
