import { Venue, CCA, Post } from '../types';

/**
 * Cloudflare Pages Functions와 통신하기 위한 API 서비스
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
  async getPosts(board?: string): Promise<Post[]> {
    try {
      let url = `${API_BASE}/posts`;
      if (board) url += `?board=${encodeURIComponent(board)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return await response.json();
    } catch (error) {
      const { POSTS } = await import('../constants');
      return board ? POSTS.filter(p => p.board === board) : POSTS;
    }
  },

  async getPostById(id: string): Promise<Post | null> {
    try {
      const response = await fetch(`${API_BASE}/posts?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      const { POSTS } = await import('../constants');
      return POSTS.find(p => p.id === id) || null;
    }
  },

  async createPost(data: Partial<Post>): Promise<Post | null> {
    try {
      const response = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create post');
      return await response.json();
    } catch (error) {
      console.error('Create post failed', error);
      return null;
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