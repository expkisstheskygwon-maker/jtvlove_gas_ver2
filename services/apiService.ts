
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

  async getVenueById(id: string): Promise<Venue | null> {
    try {
      const response = await fetch(`${API_BASE}/venues?id=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error('Failed to fetch venue');
      return await response.json();
    } catch (error) {
      console.error('getVenueById error:', error);
      return null;
    }
  },

  async updateVenue(id: string, updates: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/venues`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      return response.ok;
    } catch (error) {
      console.error('updateVenue error:', error);
      return false;
    }
  },

  async createVenue(data: any): Promise<{ success: boolean; id?: string }> {
    try {
      const response = await fetch(`${API_BASE}/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) return { success: false };
      return await response.json();
    } catch (error) {
      console.error('createVenue error:', error);
      return { success: false };
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

  async getCCAById(id: string): Promise<CCA | null> {
    try {
      const response = await fetch(`${API_BASE}/ccas/${id}`);
      if (!response.ok) throw new Error('Failed to fetch cca');
      return await response.json();
    } catch (error) {
      console.error('getCCAById error:', error);
      const { CCAS } = await import('../constants');
      return CCAS.find(c => c.id === id) || null;
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
  },

  // CCA Portal Home
  async getCCAPortalHome(ccaId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/cca-portal/home?ccaId=${encodeURIComponent(ccaId)}`);
      if (!response.ok) throw new Error('Failed to fetch cca portal home');
      return await response.json();
    } catch (error) {
      console.warn('getCCAPortalHome fallback:', error);
      // fallback mock data
      const today = new Date().toISOString().split('T')[0];
      return {
        cca: { id: ccaId, name: 'Yumi Kim', venue_name: 'Grand Palace JTV', grade: 'ACE', points: 1250, image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200' },
        reservations: [
          { id: 'r10', customer_name: 'Lee Manager', reservation_time: '20:00', reservation_date: today, status: 'confirmed' },
          { id: 'r11', customer_name: 'Mr. Tanaka', reservation_time: '21:30', reservation_date: today, status: 'pending' },
          { id: 'r12', customer_name: 'Kim Director', reservation_time: '22:00', reservation_date: today, status: 'confirmed' },
        ],
        customerMessages: [
          { id: 'cm1', customer_name: 'Lee Manager', message: '유미님, 오늘 저녁 8시 예약 가능할까요?', is_read: 0, replied: 0, created_at: '2026-02-25 14:30:00' },
          { id: 'cm2', customer_name: 'Mr. Tanaka', message: '先日はありがとうございました。また来週お会いしましょう。', is_read: 0, replied: 0, created_at: '2026-02-25 13:15:00' },
          { id: 'cm3', customer_name: 'Kim Director', message: '다음 주 금요일 VIP 파티 참석 가능하신가요?', is_read: 1, replied: 0, created_at: '2026-02-25 11:00:00' },
          { id: 'cm4', customer_name: 'Park Team Lead', message: '오늘 방문 시 특별 주문이 있습니다.', is_read: 0, replied: 0, created_at: '2026-02-25 10:20:00' },
          { id: 'cm5', customer_name: 'Alex Chen', message: '좋은 시간 감사했습니다 😊', is_read: 1, replied: 1, created_at: '2026-02-24 22:00:00' },
        ],
        adminMessages: [
          { id: 'am1', sender_name: 'Grand Palace 매니저', title: '이번 주 VIP 이벤트 안내', message: '유미님, 이번 주 토요일 VIP 이벤트 세션 참여 가능 여부를 확인해 주세요.', is_read: 0, priority: 'important', created_at: '2026-02-25 09:00:00' },
          { id: 'am2', sender_name: 'Grand Palace 매니저', title: '유니폼 변경 공지', message: '새로운 유니폼이 도착했습니다. 내일 출근 시 사무실에서 수령해 주세요.', is_read: 1, priority: 'normal', created_at: '2026-02-24 15:00:00' },
        ],
        notices: [
          { id: 'vn1', title: '2월 마지막 주 영업시간 변경', content: '2월 28일(금)은 특별 이벤트로 인해 영업시간이 18:00~05:00으로 변경됩니다.', is_pinned: 1, created_at: '2026-02-25 08:00:00' },
          { id: 'vn2', title: '신규 음료 메뉴 추가', content: '3월부터 프리미엄 칵테일 라인업이 추가됩니다. 메뉴 숙지 부탁드립니다.', is_pinned: 0, created_at: '2026-02-24 10:00:00' },
          { id: 'vn3', title: '직원 건강검진 안내', content: '3월 첫째 주 직원 건강검진이 예정되어 있습니다.', is_pinned: 0, created_at: '2026-02-23 14:00:00' },
        ],
        attendance: null,
        today,
      };
    }
  },

  async ccaCheckIn(ccaId: string, venueId: string): Promise<{ success: boolean; time?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-portal/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccaId, venueId, action: 'check_in' }),
      });
      if (!response.ok) throw new Error('Check-in failed');
      return await response.json();
    } catch (error) {
      console.error('ccaCheckIn error:', error);
      return { success: true, time: new Date().toISOString() };
    }
  },

  async ccaCheckOut(ccaId: string, venueId: string): Promise<{ success: boolean; time?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-portal/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccaId, venueId, action: 'check_out' }),
      });
      if (!response.ok) throw new Error('Check-out failed');
      return await response.json();
    } catch (error) {
      console.error('ccaCheckOut error:', error);
      return { success: true, time: new Date().toISOString() };
    }
  },

  // CCA Portal Reservations
  async getCCAReservations(ccaId: string, month?: string): Promise<any[]> {
    try {
      let url = `${API_BASE}/cca-portal/reservations?ccaId=${encodeURIComponent(ccaId)}`;
      if (month) url += `&month=${encodeURIComponent(month)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cca reservations');
      const data = await response.json();
      return data.map((r: any) => ({
        ...r,
        ccaIds: r.cca_ids ? JSON.parse(r.cca_ids) : []
      }));
    } catch (error) {
      console.error('getCCAReservations error:', error);
      return [];
    }
  },

  async createCCAReservation(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/cca-portal/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('createCCAReservation error:', error);
      return false;
    }
  },

  async updateCCAReservation(id: string, updates: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/cca-portal/reservations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      return response.ok;
    } catch (error) {
      console.error('updateCCAReservation error:', error);
      return false;
    }
  },

  async updateCCAReservationStatus(id: string, status: string): Promise<boolean> {
    return this.updateCCAReservation(id, { status });
  },

  // CCA Portal Messages
  async getCCAMessages(ccaId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/cca-portal/messages?ccaId=${encodeURIComponent(ccaId)}`);
      if (!response.ok) throw new Error('Failed to fetch cca messages');
      return await response.json();
    } catch (error) {
      console.error('getCCAMessages error:', error);
      return [];
    }
  },

  async updateCCA(data: any): Promise<boolean> {
    try {
      const id = data.id || '';
      const response = await fetch(`${API_BASE}/ccas/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('updateCCA error:', error);
      return false;
    }
  },

  async updateCCAMessageStatus(id: string, updates: { is_read?: boolean; replied?: boolean; reply_text?: string }): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/cca-portal/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      return response.ok;
    } catch (error) {
      console.error('updateCCAMessageStatus error:', error);
      return false;
    }
  },

  // Admin Staff & Points Management
  async getCCAPointCategories(venueId: string = 'v1'): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/cca-point-categories?venueId=${encodeURIComponent(venueId)}`);
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('getCCAPointCategories error:', error);
      return [];
    }
  },

  async saveCCAPointCategory(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/cca-point-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('saveCCAPointCategory error:', error);
      return false;
    }
  },

  async deleteCCAPointCategory(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/cca-point-categories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return response.ok;
    } catch (error) {
      console.error('deleteCCAPointCategory error:', error);
      return false;
    }
  },

  async getCCAPointLogs(ccaId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/cca-point-logs?ccaId=${encodeURIComponent(ccaId)}`);
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('getCCAPointLogs error:', error);
      return [];
    }
  },

  async addCCAPointLog(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/cca-point-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('addCCAPointLog error:', error);
      return false;
    }
  },

  async deleteCCAPointLog(params: { id: string, ccaId: string, total: number, type: 'point' | 'penalty' }): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/cca-point-logs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response.ok;
    } catch (error) {
      console.error('deleteCCAPointLog error:', error);
      return false;
    }
  },

  // Super Admin Partners
  async getSuperVenues(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/super-partners?action=listVenues`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('getSuperVenues error:', error);
      return [];
    }
  },

  async getSuperCCAs(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/super-partners?action=listCCAs`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('getSuperCCAs error:', error);
      return [];
    }
  },

  async getVenueHistory(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/super-partners?action=venueHistory&id=${id}`);
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('getVenueHistory error:', error);
      return null;
    }
  },

  async getCCAHistory(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/super-partners?action=ccaHistory&id=${id}`);
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('getCCAHistory error:', error);
      return null;
    }
  }
};
