export interface SearchHistoryItem {
  userId: string;
  searchedAt: Date;
  // User info will be populated from user service
  user?: {
    id: string;
    userName: string;
    fullName: string;
    avatar?: string;
  };
}

export interface SearchHistoryZSetItem {
  userId: string;
  timestamp: number;
}

export interface SearchHistoryCache {
  items: SearchHistoryItem[];
}

export const SEARCH_HISTORY_CONSTANTS = {
  MAX_HISTORY_ITEMS: 10,
  CACHE_TTL_SECONDS: 7 * 24 * 60 * 60 * 1000,
  CACHE_KEY_PREFIX: 'search_history:user:',
} as const;
