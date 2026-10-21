export type ReviewStatus = 'pending' | 'accepted' | 'rejected';

export interface Review {
  id: string;
  customerName: string;
  stars: number;
  text: string;
  thumbnails: string[];
  date: string;
  status: ReviewStatus;
}

export interface ReviewSettings {
  isSystemEnabled: boolean;
  allowImages: boolean;
  manualReviewRequired: boolean;
}

export type ReviewFilterStatus = 'all' | ReviewStatus;
