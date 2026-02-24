
import { Venue, CCA, Post, HeroSection, MediaItem } from '../types';

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

  async uploadImage(file: File): Promise<string | null> {
    // 파일 크기 체크 (D1 1MB 제한 고려하여 700KB로 제한)
    if (file.size > 700 * 1024) {
      alert("파일 크기가 너무 큽니다. 700KB 이하의 이미지를 사용해주세요. (D1 데이터베이스 제한)");
      return null;
    }

    try {
      // 1. 서버 업로드 시도
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.url) return data.url;
        }
      }
    } catch (error) {
      console.warn("Server upload failed, using client-side fallback");
    }
    
    // 2. 서버 업로드 실패 시 클라이언트 측에서 Base64 변환 후 반환
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => {
        console.error("FileReader error");
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
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

  async updateCCAProfile(id: string, data: Partial<CCA> & { password?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/ccas/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Server error' };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('updateCCAProfile error:', error);
      return { success: false, error: error.message };
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

  // Gallery
  async getGallery(ccaId?: string): Promise<MediaItem[]> {
    try {
      let url = `${API_BASE}/gallery`;
      if (ccaId) url += `?ccaId=${encodeURIComponent(ccaId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch gallery');
      return await response.json();
    } catch (error) {
      console.error('getGallery error:', error);
      return [];
    }
  },

  async createGalleryItem(data: { ccaId: string; type: 'photo' | 'video'; url: string; caption?: string }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Server error' };
      }
      return await response.json();
    } catch (error: any) {
      console.error('createGalleryItem error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteGalleryItem(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/gallery/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('deleteGalleryItem error:', error);
      return false;
    }
  },

  // Holidays
  async getHolidays(ccaId: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/holidays?ccaId=${encodeURIComponent(ccaId)}`);
      if (!response.ok) throw new Error('Failed to fetch holidays');
      return await response.json();
    } catch (error) {
      console.error('getHolidays error:', error);
      return [];
    }
  },

  async syncHolidays(ccaId: string, dates: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccaId, dates }),
      });
      return response.ok;
    } catch (error) {
      console.error('syncHolidays error:', error);
      return false;
    }
  },

  // Sold Out Dates
  async getSoldOutDates(ccaId: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/soldout?ccaId=${encodeURIComponent(ccaId)}`);
      if (!response.ok) throw new Error('Failed to fetch sold out dates');
      return await response.json();
    } catch (error) {
      console.error('getSoldOutDates error:', error);
      return [];
    }
  },

  async syncSoldOutDates(ccaId: string, dates: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/soldout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccaId, dates }),
      });
      return response.ok;
    } catch (error) {
      console.error('syncSoldOutDates error:', error);
      return false;
    }
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
