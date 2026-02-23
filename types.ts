
export interface Venue {
  id: string;
  name: string;
  region: string;
  rating: number;
  reviewsCount: number;
  description: string;
  image: string;
  bannerImage?: string;
  phone?: string;
  sns?: {
    telegram?: string;
    kakao?: string;
    facebook?: string;
  };
  operatingHours?: {
    open: string;
    close: string;
  };
  showUpTime?: {
    first: string;
    last: string;
  };
  address?: string;
  tags: string[];
  features: string[];
  menu?: string;
}

export type CCAStatus = 'active' | 'absent' | 'off' | 'resigned';
export type CCAGrade = 'ACE' | 'PRO' | 'CUTE';
export type CustomerGrade = 'VIP' | 'EXCELLENT' | 'GENERAL' | 'WARNING';

export interface CCA {
  id: string;
  name: string;
  displayName?: string;
  age?: number;
  weight?: string;
  venueId: string;
  venueName: string;
  rating: number;
  image: string;
  isNew?: boolean;
  isTopRated?: boolean;
  isVipOnly?: boolean;
  experience: string;
  languages: string[];
  height: string;
  description: string;
  specialties: string[];
  status?: CCAStatus;
  grade?: CCAGrade;
  points?: number;
  themeColor?: string;
  // New Fields
  mbti?: string;
  zodiac?: string;
  interests?: string[];
  preferredStyle?: string;
  oneLineStory?: string;
  commStyle?: string;
  restStyle?: string;
  friendsRelation?: string;
  drinking?: string;
  smoking?: string;
  pets?: string;
  sns?: {
    instagram?: string;
    facebook?: string;
  };
}

export interface Reservation {
  id: string;
  venueId: string;
  ccaId: string;
  ccaName: string;
  customerName: string;
  customerNote: string;
  customerGrade?: CustomerGrade;
  time: string;
  endTime?: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'request_change';
  shortMessage: string;
}

// Fixed missing Post interface to resolve import error in constants.ts
export interface Post {
  id: string;
  board: string;
  title: string;
  author: string;
  authorAvatar: string;
  date: string;
  views: number;
  likes: number;
  commentsCount: number;
  content: string;
  image?: string;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  url: string;
  caption: string;
  likes: number;
  shares: number;
  commentsCount: number;
  date: string;
}

export interface HeroSection {
  id: number;
  ccaId?: string;
  badge1: string;
  badge2: string;
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  displayOrder: number;
}
