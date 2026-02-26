
export interface Venue {
  id: string;
  name: string;
  region: string;
  rating: number;
  reviewsCount: number;
  description: string;
  image: string;
  banner_image?: string;
  bannerImage?: string; // legacy support
  phone?: string;
  sns?: {
    telegram?: string;
    kakao?: string;
    facebook?: string;
    band?: string;
    instagram?: string;
    discord?: string;
  };
  operating_hours?: {
    open: string;
    close: string;
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
  menu?: any;
  media?: any;
  tables?: any;
  rooms?: any;
  introduction?: string;
}

export type CCAStatus = 'active' | 'absent' | 'off' | 'resigned' | 'late';
export type CCAGrade = 'ACE' | 'PRO' | 'CUTE';
export type CustomerGrade = 'VIP' | 'EXCELLENT' | 'GENERAL' | 'WARNING';

export interface CCA {
  id: string;
  name: string;
  nickname?: string;
  realNameFirst?: string;
  realNameMiddle?: string;
  realNameLast?: string;
  birthday?: string;
  address?: string;
  phone?: string;
  displayName?: string;
  age?: number;
  weight?: string;
  venueId: string;
  venueName: string;
  region?: string;
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
    tiktok?: string;
    twitter?: string;
    threads?: string;
    telegram?: string;
  };
  experienceHistory?: CCAExperience[];
  maritalStatus?: string;
  childrenStatus?: string;
  specialNotes?: string;
  viewsCount?: number;
  likesCount?: number;
  postsCount?: number;
}

export interface CCAExperience {
  joinDate: string;
  leaveDate: string;
  venueName: string;
  venueType: 'JTV' | 'KTV' | 'BAR' | 'CASINO' | 'GOLF' | 'ETC';
  grade: string;
}

export interface Reservation {
  id: string;
  venueId: string;
  ccaId?: string;
  ccaIds?: string[];
  ccaName?: string;
  customerName: string;
  customerContact?: string;
  customerNote: string;
  customerGrade?: CustomerGrade;
  groupSize: number;
  time: string;
  endTime?: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'request_change' | 'check_in' | 'missed';
  shortMessage: string;
  tableId?: string;
  roomId?: string;
  tableName?: string;
  roomName?: string;
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

export interface PointCategory {
  id: string;
  venue_id: string;
  name: string;
  amount: number;
  type: 'point' | 'penalty';
}

export interface PointLog {
  id: string;
  cca_id: string;
  category_id?: string;
  name: string;
  amount: number;
  quantity: number;
  total: number;
  description: string;
  log_date: string;
  created_at: string;
}
