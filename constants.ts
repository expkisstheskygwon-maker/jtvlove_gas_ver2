
import { Venue, CCA, Post, Reservation } from './types';

export const VENUES: Venue[] = [
  {
    id: 'v1',
    name: 'Grand Palace JTV',
    region: 'Pasay',
    rating: 4.9,
    reviewsCount: 128,
    description: 'Experience the pinnacle of nightlife at Grand Palace JTV.',
    image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=2000&auto=format&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2000&auto=format&fit=crop',
    phone: '0912-345-6789',
    address: 'Entertainment City, Pasay, Metro Manila',
    sns: { telegram: '@grandpalace_admin', kakao: 'grandpalace_official' },
    operatingHours: { open: '19:00', close: '04:00' },
    showUpTime: { first: '19:30', last: '21:00' },
    tags: ['Premium Service', 'VIP Room'],
    features: ['VIP Rooms', 'Live Stage', 'Pro Audio', 'Safe Parking'],
    menu: '<h1>Premium Drink Menu</h1><p>Hennessy XO - 15,000 PHP</p>'
  },
  {
    id: 'v2',
    name: 'G-Diamond JTV',
    region: 'Clark',
    rating: 4.8,
    reviewsCount: 95,
    description: 'Clark highest luxury JTV.',
    image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=2000&auto=format&fit=crop',
    tags: ['Elite', 'Luxury'],
    features: ['Pool Table', 'Private Suite']
  }
];

export const CCAS: CCA[] = [
  {
    id: 'c1',
    name: 'Yumi Kim',
    venueId: 'v1',
    venueName: 'Grand Palace',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
    experience: '4 Years',
    languages: ['ENGLISH', 'KOREAN', 'JAPANESE'],
    height: '165 cm',
    description: '안녕하세요, 유미입니다. 우아하고 편안한 밤을 약속드립니다.',
    specialties: ['Karaoke Specialist', 'Conversational Japanese'],
    status: 'active',
    grade: 'ACE',
    points: 1250
  },
  {
    id: 'c2',
    name: 'Sofia Park',
    venueId: 'v1',
    venueName: 'Grand Palace',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop',
    experience: '3 Years',
    languages: ['ENGLISH', 'JAPANESE'],
    height: '162 cm',
    description: '특별한 VIP를 위한 세심한 배려.',
    specialties: ['Wine Knowledge'],
    status: 'off',
    grade: 'PRO',
    points: 850
  },
  {
    id: 'c3',
    name: 'Maria Luna',
    venueId: 'v1',
    venueName: 'Grand Palace',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop',
    experience: '5 Years',
    languages: ['JAPANESE', 'ENGLISH'],
    height: '168 cm',
    description: '마리아입니다! 밝은 미소로 여러분을 기다립니다.',
    specialties: ['Vocal performance'],
    status: 'absent',
    grade: 'CUTE',
    points: 500
  }
];

export const RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    venueId: 'v1',
    ccaId: 'c1',
    ccaName: 'Yumi Kim',
    customerName: 'Lee Manager',
    customerNote: 'First time visit. Prefers quiet environment.',
    groupSize: 1,
    time: '20:00',
    date: '2023-11-20',
    status: 'confirmed',
    shortMessage: 'VIP 1룸 예약'
  },
  {
    id: 'r2',
    venueId: 'v1',
    ccaId: 'c2',
    ccaName: 'Sofia Park',
    customerName: 'Mr. Tanaka',
    customerNote: 'Regular guest.',
    groupSize: 2,
    time: '21:00',
    date: '2023-11-20',
    status: 'pending',
    shortMessage: '생일 파티 예정'
  }
];

export const POSTS: Post[] = [
  {
    id: 'p1',
    board: 'Free Board',
    title: 'Nightlife in Manila: Top 5 Spots for a Premium Experience',
    author: 'Kim Min-jun',
    authorAvatar: 'https://picsum.photos/100/100?random=1',
    date: '2023.10.24',
    views: 1240,
    likes: 428,
    commentsCount: 18,
    content: 'The nightlife scene in Manila has evolved significantly...'
  }
];
