export interface Profile {
  name: string;
  linkedinUrl: string;
}

export interface ProfilesConfig {
  you: Profile;
  competitors: Profile[];
  settings: {
    yourPostsToFetch: number;
    competitorPostsToFetch: number;
  };
}

export interface LinkedInPost {
  authorName: string;
  authorUrl: string;
  isOwnPost: boolean;
  postUrl: string;
  postedAt?: string;
  postType: 'text' | 'image' | 'video' | 'carousel' | 'poll' | 'article';
  text: string;
  likes: number;
  comments: number;
  reposts: number;
  engagementTotal: number;
  scrapedAt: string;
}

export interface AuthorBaseline {
  authorName: string;
  isOwn: boolean;
  postCount: number;
  medianEngagement: number;
  topPosts: LinkedInPost[];
  bottomPosts: LinkedInPost[];
}
