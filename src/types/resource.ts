export type ResourceId = number;

export type ResourceCategory =
  | 'basic'
  | 'exam'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'tools'
  | 'japan'
  | 'weekly';

export type ResourceSource = 'public' | 'private';

export interface ResourceRecord {
  id: ResourceId;
  category: ResourceCategory;
  name: string;
  description: string;
  url: string;
  tags: string[];
  source: ResourceSource;
  marked: boolean;
  sortOrder: number;
}

export interface PrivateResourceInput {
  category: ResourceCategory;
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export interface CategoryCatalog {
  category: ResourceCategory;
  resources: ResourceRecord[];
  totalCount: number;
  lockedCount: number;
}

export interface HistoryItem {
  resource: ResourceRecord;
  visitCount: number;
  lastVisitedAt: string;
}

export interface SimilarResourceMatch {
  resource: ResourceRecord;
  matchType: 'exact_url' | 'same_normalized_url';
}

export type SavePrivateResourceResult =
  | { status: 'saved'; resourceId: ResourceId }
  | { status: 'invalid_input' }
  | { status: 'exact_url_exists'; recommendations: SimilarResourceMatch[] }
  | { status: 'similar_review_required'; recommendations: SimilarResourceMatch[] }
  | { status: 'similar_limit_reached'; recommendations: SimilarResourceMatch[] }
  | { status: 'private_limit_reached'; current: number; limit: number };
