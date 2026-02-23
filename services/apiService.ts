
import { Venue, CCA, Post, HeroSection } from '../types';

/**
 * Cloudflare Pages Functions와 통신하기 위한 API 서비스
 */

const API_BASE = '/api';

export const apiService = {
  // Hero Sections
  async getHeroSections(): Promise<HeroSection[]> {
    try {
      const response = await fetch(`${API_BASE}/hero`);
      if (!response.ok) throw new Error('Failed to fetch hero sections');
      return await response.json();
    } catch (error) {
      console.error('getHeroSections error:', error);
      return [];
    }
  },

  async updateHeroSections(heroSections: HeroSection[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/hero`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroSections }),
      });
      return response.ok;
    } catch (error) {
      console.error('updateHeroSections error:', error);
      return false;
    }
  },

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
  },

  // Site Settings
  async getSiteSettings(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/settings`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }
      return await response.json();
    } catch (error) {
      console.error("apiService.getSiteSettings Error:", error);
      return {
        site_name: 'Philippine JTV Association',
        admin_phone: '0917-000-0000',
        admin_email: 'admin@ph-jtv.org',
        admin_sns: '@phjtv_official',
        hq_address: 'Metro Manila, Philippines',
        logo_url: '',
        favicon_url: ''
      };
    }
  },

  async updateSiteSettings(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Critical: Update failed server-side:", errorData);
        return false;
      }
      
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Critical: Update settings failed network-side:', error);
      return false;
    }
  }
};
