
import { Venue, CCA, Post } from '../types';

/**
 * Cloudflare Pages Functions와 통신하기 위한 API 서비스
 * 현재는 로컬 개발을 위해 constants.ts의 데이터를 폴백으로 사용하며,
 * 배포 후에는 실제 /api 엔드포인트에서 데이터를 가져옵니다.
 */

const API_BASE = '/api';

export const apiService = {
  // Venues
  async getVenues(): Promise<Venue[]> {
    try {
      const response = await fetch(`${API_BASE}/venues`);
      if (!response.ok) throw new Error('Failed to fetch venues');
      return await response.json();
    } catch (error) {
      console.warn('Using mock data for venues');
      const { VENUES } = await import('../constants');
      return VENUES;
    }
  },

  // CCAs
  async getCCAs(): Promise<CCA[]> {
    try {
      const response = await fetch(`${API_BASE}/ccas`);
      if (!response.ok) throw new Error('Failed to fetch ccas');
      return await response.json();
    } catch (error) {
      console.warn('Using mock data for ccas');
      const { CCAS } = await import('../constants');
      return CCAS;
    }
  },

  // Posts
  async getPosts(): Promise<Post[]> {
    try {
      const response = await fetch(`${API_BASE}/posts`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return await response.json();
    } catch (error) {
      const { POSTS } = await import('../constants');
      return POSTS;
    }
  },

  // Create Reservation
  async createReservation(data: any): Promise<boolean> {
    const response = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.ok;
  }
};
