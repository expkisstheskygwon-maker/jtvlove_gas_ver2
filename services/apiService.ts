import { Venue, CCA, Post, HeroSection, MediaItem } from '../types';
import { POSTS, CCAS, VENUES } from '../constants';

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

  async uploadImage(file: File, imageType: string = 'misc'): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', imageType);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData, // Content-Type 자동 설정됨
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('Upload succeeded but returned no URL');
      }
      return data.url;
    } catch (error: any) {
      console.error('uploadImage error:', error);
      alert(`[Upload Debug] ${error.message || error}`);
      throw error;
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

  async updateVenue(id: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/venues`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (response.ok) return { success: true };
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to update venue' };
    } catch (error: any) {
      console.error('updateVenue error:', error);
      return { success: false, error: error.message };
    }
  },

  async createVenue(data: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, id: result.id };
      return { success: false, error: result.error || 'Failed to create venue' };
    } catch (error: any) {
      console.error('createVenue error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteVenue(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/venues?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (response.ok) return { success: true };
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to delete' };
    } catch (error: any) {
      console.error('deleteVenue error:', error);
      return { success: false, error: error.message };
    }
  },

  // CCAs
  async getCCAs(venueId?: string): Promise<CCA[]> {
    try {
      let url = `${API_BASE}/ccas`;
      if (venueId) url += `?venueId=${encodeURIComponent(venueId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ccas');
      return await response.json();
    } catch (error) {
      console.warn('Using mock data for ccas');
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
      const cleanId = id.startsWith('@') ? id.substring(1) : id;
      return CCAS.find(c => c.id === cleanId || (c.nickname && c.nickname.toLowerCase() === cleanId.toLowerCase())) || null;
    }
  },

  async getCCAByNickname(nickname: string): Promise<CCA | null> {
    const cleanNick = nickname.startsWith('@') ? nickname.substring(1) : nickname;
    return this.getCCAById(cleanNick);
  },

  async updateCCA(id: string, data: Partial<CCA | any>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/ccas/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, id: result.id };
      return { success: false, error: result.error || 'Failed to update CCA' };
    } catch (error: any) {
      console.error('updateCCA error:', error);
      return { success: false, error: error.message };
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


  async createCCA(data: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/ccas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, id: result.id };
      return { success: false, error: result.error || 'Create failed' };
    } catch (error: any) {
      console.error('createCCA error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteCCA(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/ccas/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) return { success: true };
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to delete' };
    } catch (error: any) {
      console.error('deleteCCA error:', error);
      return { success: false, error: error.message };
    }
  },

  // Posts
  async getPosts(board?: string, category?: string): Promise<Post[]> {
    try {
      let url = `${API_BASE}/posts?`;
      const params = new URLSearchParams();
      if (board) params.append('board', board);
      if (category) params.append('category', category);

      const response = await fetch(url + params.toString());
      if (!response.ok) throw new Error('Failed to fetch posts');
      return await response.json();
    } catch (error) {
      let data = board ? POSTS.filter(p => p.board === board) : POSTS;
      if (category && category !== '전체') {
        data = data.filter(p => p.category === category);
      }
      return data;
    }
  },

  async getPostById(id: string): Promise<Post | null> {
    try {
      const response = await fetch(`${API_BASE}/posts?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create post');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  async updatePost(id: string, data: Partial<Post>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/posts?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('updatePost error:', error);
      return false;
    }
  },

  async deletePost(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/posts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('deletePost error:', error);
      return false;
    }
  },

  async incrementPostViews(id: string, userId?: string): Promise<void> {
    try {
      let url = `${API_BASE}/posts?id=${encodeURIComponent(id)}&action=view`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      await fetch(url, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('incrementPostViews error:', error);
    }
  },

  async likePost(id: string, userId?: string): Promise<boolean> {
    try {
      let url = `${API_BASE}/posts?id=${encodeURIComponent(id)}&action=like`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: 'PATCH'
      });
      return response.ok;
    } catch (error) {
      console.error('likePost error:', error);
      return false;
    }
  },

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const response = await fetch(`${API_BASE}/comments?postId=${encodeURIComponent(postId)}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return await response.json();
    } catch (error) {
      console.error('getComments error:', error);
      return [];
    }
  },

  async createComment(data: { postId: string; author: string; content: string }): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('createComment error:', error);
      return false;
    }
  },

  async likeComment(id: string, userId?: string): Promise<boolean> {
    try {
      let url = `${API_BASE}/comments?id=${encodeURIComponent(id)}&action=like`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: 'PATCH'
      });
      return response.ok;
    } catch (error) {
      console.error('likeComment error:', error);
      return false;
    }
  },

  async dislikeComment(id: string, userId?: string): Promise<boolean> {
    try {
      let url = `${API_BASE}/comments?id=${encodeURIComponent(id)}&action=dislike`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: 'PATCH'
      });
      return response.ok;
    } catch (error) {
      console.error('dislikeComment error:', error);
      return false;
    }
  },

  async deleteComment(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/comments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('deleteComment error:', error);
      return false;
    }
  },

  async recalculateCCAScore(ccaId: string): Promise<{ success: boolean; newScore?: number; newGrade?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-score/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccaId })
      });
      return await response.json();
    } catch (error: any) {
      console.error('recalculateCCAScore error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reservations
  async createReservation(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('createReservation error:', error);
      return false;
    }
  },

  async getVenueReservations(venueId: string, date?: string): Promise<any[]> {
    try {
      let url = `${API_BASE}/reservations?venueId=${encodeURIComponent(venueId)}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch venue reservations');
      return await response.json();
    } catch (error) {
      console.error('getVenueReservations error:', error);
      return [];
    }
  },

  async updateReservation(id: string, updates: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/reservations?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return response.ok;
    } catch (error) {
      console.error('updateReservation error:', error);
      return false;
    }
  },

  async updateReservationStatus(id: string, status: string): Promise<boolean> {
    return this.updateReservation(id, { status });
  },

  // Gallery
  async getGallery(ccaId?: string): Promise<MediaItem[]> {
    try {
      let url = `${API_BASE}/gallery`;
      if (ccaId) {
        const cleanId = ccaId.startsWith('@') ? ccaId.substring(1) : ccaId;
        url += `?ccaId=${encodeURIComponent(cleanId)}`;
      }
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
      const data = await response.json();
      return {
        ...data,
        ui_texts: data.ui_texts ? JSON.parse(data.ui_texts) : {}
      };
    } catch (error) {
      console.error("apiService.getSiteSettings Error:", error);
      return {
        site_name: 'JTV STAR',
        admin_phone: '0917-000-0000',
        admin_email: 'admin@jtvstar.com',
        admin_sns: '@jtvstar_official',
        hq_address: 'Metro Manila, Philippines',
        logo_url: '',
        favicon_url: '',
        emblem_url: '',
        venues_hero_image: '',
        venues_hero_title: '이달의 추천 JTV',
        venues_hero_subtitle: '최고의 서비스와 품격을 보장합니다.',
        ui_texts: {}
      };
    }
  },

  async updateSiteSettings(data: any): Promise<boolean> {
    try {
      const payload = { ...data };
      if (payload.ui_texts && typeof payload.ui_texts === 'object') {
        payload.ui_texts = JSON.stringify(payload.ui_texts);
      }
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  async updateVenueAdminAccount(venueId: string, newEmail: string, newPassword?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/super-partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateVenueAdminAccount', venueId, newEmail, newPassword })
      });
      return await response.json();
    } catch (error: any) {
      console.error('updateVenueAdminAccount error:', error);
      return { error: error.message };
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
  },

  async registerVenueAdmin(data: any): Promise<{ success: boolean; userId?: string; venueId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/venue-admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('registerVenueAdmin error:', error);
      return { success: false, error: error.message };
    }
  },

  async register(data: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('register error:', error);
      return { success: false, error: error.message };
    }
  },

  async getUser(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/users?id=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error('User not found');
      return await response.json();
    } catch (error) {
      console.error('getUser error:', error);
      return null;
    }
  },

  async updateUser(data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('updateUser error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  async getUserStats(id: string, nickname?: string): Promise<any> {
    try {
      let url = `${API_BASE}/user-stats?id=${encodeURIComponent(id)}`;
      if (nickname) url += `&nickname=${encodeURIComponent(nickname)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Stats not found');
      return await response.json();
    } catch (error) {
      console.error('getUserStats error:', error);
      return null;
    }
  },

  async login(data: any): Promise<{ success: boolean; user?: any; venueId?: string; ccaId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  async superLogin(password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin: true, password }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('superLogin error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  async changeSuperAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/super/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) return { success: true };
      return { success: false, error: data.error || 'Failed to change password' };
    } catch (error: any) {
      console.error('changeSuperAdminPassword error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  async getUsersByIds(ids: string[]): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    try {
      const response = await fetch(`${API_BASE}/users?ids=${encodeURIComponent(ids.join(','))}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('getUsersByIds error:', error);
      return [];
    }
  },

  // Board Configs
  async getBoardConfigs(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/board-configs`);
      if (!response.ok) throw new Error('Failed to fetch board configs');
      return await response.json();
    } catch (error) {
      console.error('getBoardConfigs error:', error);
      return [];
    }
  },

  async updateBoardConfig(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/board-configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('updateBoardConfig error:', error);
      return false;
    }
  },

  async deleteBoardConfig(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/board-configs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('deleteBoardConfig error:', error);
      return false;
    }
  },

  // Service Tab Functions
  async getUserActivities(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/user-activities?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Activities not found');
      return await response.json();
    } catch (error) {
      console.error('getUserActivities error:', error);
      return [];
    }
  },

  async getInquiries(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/user-inquiries?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Inquiries not found');
      return await response.json();
    } catch (error) {
      console.error('getInquiries error:', error);
      return [];
    }
  },

  async createInquiry(data: { userId: string; title: string; content: string }): Promise<{ success: boolean; id?: string }> {
    try {
      const response = await fetch(`${API_BASE}/user-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create inquiry');
      return await response.json();
    } catch (error) {
      console.error('createInquiry error:', error);
      return { success: false };
    }
  },

  async getSiteDoc(type: 'guidelines' | 'terms' | 'privacy'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/site-docs?type=${encodeURIComponent(type)}`);
      if (!response.ok) throw new Error('Document not found');
      return await response.json();
    } catch (error) {
      console.error('getSiteDoc error:', error);
      return { content: '내용을 불러올 수 없습니다.' };
    }
  },

  async getUserPointLogs(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/user-points?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Point logs not found');
      return await response.json();
    } catch (error) {
      console.error('getUserPointLogs error:', error);
      return [];
    }
  },

  // Admin User Management
  // Admin User Management
  async getAdminUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/super/users`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch admin users');
    }
    return await response.json();
  },

  async updateAdminUser(id: string, updates: any): Promise<boolean> {
    const response = await fetch(`${API_BASE}/super/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update user');
    }
    return response.ok;
  },

  async adminResetPassword(userId: string, tempPassword?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/super/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', userId, payload: tempPassword }),
      });
      return await response.json();
    } catch (error) {
      console.error('adminResetPassword error:', error);
      return { success: false };
    }
  },

  // Admin Content Management (Notices, Events, FAQ)
  async getAdminContent(board?: string): Promise<any[]> {
    let url = `${API_BASE}/super/content`;
    if (board) url += `?board=${encodeURIComponent(board)}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch admin content');
    }
    return await response.json();
  },

  async saveAdminContent(data: any): Promise<{ success: boolean; id?: string }> {
    const response = await fetch(`${API_BASE}/super/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save admin content');
    }
    return await response.json();
  },

  async updateAdminContent(id: string, updates: any): Promise<boolean> {
    const response = await fetch(`${API_BASE}/super/content`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update admin content');
    }
    return response.ok;
  },

  async deleteAdminContent(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/super/content?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete admin content');
    }
    return response.ok;
  },

  async updateAdminSiteDoc(type: string, content: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/site-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update site doc');
    }
    return response.ok;
  },

  // Venue Notices (업체 공지사항)
  async getVenueNotices(venueId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/venue-notices?venueId=${encodeURIComponent(venueId)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('getVenueNotices error:', error);
      return [];
    }
  },

  async createVenueNotice(data: { venue_id: string; title: string; content: string; is_pinned?: boolean }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/venue-notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('createVenueNotice error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateVenueNotice(data: { id: string; title: string; content: string; is_pinned?: boolean }): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/venue-notices`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('updateVenueNotice error:', error);
      return { success: false };
    }
  },

  async deleteVenueNotice(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/venue-notices?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('deleteVenueNotice error:', error);
      return false;
    }
  },

  // CCA 지명 요청 (CCA Nomination Requests)
  async getCCARequests(params: { ccaId?: string; venueId?: string }): Promise<any[]> {
    try {
      const query = params.ccaId
        ? `ccaId=${encodeURIComponent(params.ccaId)}`
        : `venueId=${encodeURIComponent(params.venueId || '')}`;
      const response = await fetch(`${API_BASE}/cca-requests?${query}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('getCCARequests error:', error);
      return [];
    }
  },

  async createCCARequest(data: {
    cca_id: string;
    venue_id: string;
    cca_name?: string;
    venue_name?: string;
    customer_name: string;
    customer_contact?: string;
    customer_note?: string;
    preferred_date?: string;
    preferred_time?: string;
    group_size?: number;
    user_id?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('createCCARequest error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateCCARequestStatus(id: string, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/cca-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      return response.ok;
    } catch (error) {
      console.error('updateCCARequestStatus error:', error);
      return false;
    }
  },

  // ═══════════════════════════════════════════
  // 통합 메시지 (Messages)
  // ═══════════════════════════════════════════

  async getMessages(params: { receiverId?: string; receiverType?: string; senderId?: string; senderType?: string; limit?: number }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params.receiverId) query.set('receiverId', params.receiverId);
      if (params.receiverType) query.set('receiverType', params.receiverType);
      if (params.senderId) query.set('senderId', params.senderId);
      if (params.senderType) query.set('senderType', params.senderType);
      if (params.limit) query.set('limit', params.limit.toString());
      const response = await fetch(`${API_BASE}/messages?${query.toString()}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('getMessages error:', error);
      return [];
    }
  },

  async sendMessage(data: {
    sender_id: string;
    sender_type: string;
    sender_name?: string;
    receiver_id: string;
    receiver_type: string;
    receiver_name?: string;
    subject?: string;
    content: string;
    parent_id?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('sendMessage error:', error);
      return { success: false, error: error.message };
    }
  },

  async replyMessage(id: string, replyText: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reply_text: replyText }),
      });
      return response.ok;
    } catch (error) {
      console.error('replyMessage error:', error);
      return false;
    }
  },

  async markMessageRead(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: true }),
      });
      return response.ok;
    } catch (error) {
      console.error('markMessageRead error:', error);
      return false;
    }
  },

  async deleteMessage(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/messages?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('deleteMessage error:', error);
      return false;
    }
  },

  async searchMessageRecipients(query: string, type: string = 'all'): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/message-search?q=${encodeURIComponent(query)}&type=${type}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('searchMessageRecipients error:', error);
      return [];
    }
  },

  // ═══════════════════════════════════════════
  // 비밀대화 (Secret DM) - MVP
  // ═══════════════════════════════════════════
  async getSecretConversations(userId: string, role?: 'user' | 'cca'): Promise<{ role: 'user' | 'cca'; conversations: any[] }> {
    try {
      const query = new URLSearchParams({ userId });
      if (role) query.set('role', role);
      const response = await fetch(`${API_BASE}/secret/conversations?${query.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch secret conversations');
      return await response.json();
    } catch (error: any) {
      console.error('getSecretConversations error:', error);
      return { role: role || 'user', conversations: [] };
    }
  },

  async createSecretConversation(fanId: string, ccaId: string): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/secret/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fanId, ccaId }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('createSecretConversation error:', error);
      return { success: false, error: error.message };
    }
  },

  async getSecretMessages(conversationId: string, viewerRole: 'user' | 'cca', markRead: boolean = false): Promise<{ messages: any[] }> {
    try {
      const query = new URLSearchParams({
        conversationId,
        viewerRole,
        markRead: markRead ? '1' : '0',
      });
      const response = await fetch(`${API_BASE}/secret/messages?${query.toString()}`);
      if (!response.ok) return { messages: [] };
      return await response.json();
    } catch (error) {
      console.error('getSecretMessages error:', error);
      return { messages: [] };
    }
  },

  async sendSecretMessage(data: {
    conversationId?: string;
    fanId: string;
    ccaId: string;
    senderRole: 'user' | 'cca';
    senderId: string;
    content: string;
    isPaid?: boolean;
    pricePoints?: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/secret/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('sendSecretMessage error:', error);
      return { success: false, error: error.message };
    }
  },

  async blockSecretFan(ccaId: string, fanId: string, action: 'block' | 'unblock' = 'block'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/secret/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccaId, fanId, action }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('blockSecretFan error:', error);
      return { success: false, error: error.message };
    }
  },

  // ═══════════════════════════════════════════
  // CCA 좋아요 (CCA Likes)
  // ═══════════════════════════════════════════

  async getCCALikes(ccaId: string, userId?: string): Promise<{ count: number; liked: boolean }> {
    try {
      let url = `${API_BASE}/cca-likes?ccaId=${encodeURIComponent(ccaId)}`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url);
      if (!response.ok) return { count: 0, liked: false };
      return await response.json();
    } catch (error) {
      console.error('getCCALikes error:', error);
      return { count: 0, liked: false };
    }
  },

  async toggleCCALike(ccaId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    try {
      const response = await fetch(`${API_BASE}/cca-likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cca_id: ccaId, user_id: userId }),
      });
      if (!response.ok) return { liked: false, count: 0 };
      return await response.json();
    } catch (error) {
      console.error('toggleCCALike error:', error);
      return { liked: false, count: 0 };
    }
  },

  // ═══════════════════════════════════════════
  // Super Admin Dashboard
  // ═══════════════════════════════════════════
  async getSuperDashboardStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/super/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return await response.json();
    } catch (error) {
      console.error('getSuperDashboardStats error:', error);
      return {
        venuesCount: 0, venuesToday: 0,
        ccasCount: 0, ccasToday: 0,
        usersCount: 0, usersToday: 0,
        reservationsCount: 0, reservationsToday: 0,
        recentPosts: [], recentUsers: []
      };
    }
  },

  // ═══════════════════════════════════════════
  // CCA Applications & Job Pool System
  // ═══════════════════════════════════════════

  async submitCCAApplication(data: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-applications?action=apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('submitCCAApplication error:', error);
      return { success: false, error: error.message };
    }
  },

  async getCCAApplications(status?: string): Promise<any[]> {
    try {
      let url = `${API_BASE}/cca-applications?action=listAll`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('getCCAApplications error:', error);
      return [];
    }
  },

  async sendJobOffer(data: { applicationId: string; venueId: string; venueName?: string; message?: string }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-applications?action=sendOffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('sendJobOffer error:', error);
      return { success: false, error: error.message };
    }
  },

  async checkApplicantStatus(name: string, pin: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/cca-applications?action=applicantStatus&name=${encodeURIComponent(name)}&pin=${encodeURIComponent(pin)}`);
      return await response.json();
    } catch (error: any) {
      console.error('checkApplicantStatus error:', error);
      return { error: error.message };
    }
  },

  async acceptJobOffer(offerId: string, name?: string, pin?: string): Promise<{ success: boolean; ccaId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-applications?action=acceptOffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, name, pin }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('acceptJobOffer error:', error);
      return { success: false, error: error.message };
    }
  },

  async rejectJobOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-applications?action=rejectOffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('rejectJobOffer error:', error);
      return { success: false, error: error.message };
    }
  },

  async directAssignApplicant(applicationId: string, venueId: string): Promise<{ success: boolean; ccaId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-applications?action=directAssign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, venueId }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('directAssignApplicant error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteCCAApplication(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/cca-applications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error: any) {
      console.error('deleteCCAApplication error:', error);
      return { success: false, error: error.message };
    }
  },

  // ─── SNS Feed APIs ──────────────────────────────────────

  async getFeed(page: number = 1, limit: number = 20, userId?: string): Promise<any> {
    try {
      let url = `${API_BASE}/gallery?feed=true&page=${page}&limit=${limit}`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch feed');
      return await response.json();
    } catch (error) {
      console.error('getFeed error:', error);
      return { items: [], page: 1, limit: 20, total: 0, hasMore: false };
    }
  },

  async getGalleryItem(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/gallery/${id}`);
      if (!response.ok) throw new Error('Failed to fetch gallery item');
      return await response.json();
    } catch (error) {
      console.error('getGalleryItem error:', error);
      return null;
    }
  },

  async deleteGalleryPost(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/gallery/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete gallery post');
      return await response.json();
    } catch (error) {
      console.error('deleteGalleryPost error:', error);
      return { success: false };
    }
  },

  async reportGalleryPost(galleryId: string, reporterId: string, reason: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/gallery-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId, reporterId, reason }),
      });
      if (!response.ok) throw new Error('Failed to submit gallery report');
      return await response.json();
    } catch (error) {
      console.error('reportGalleryPost error:', error);
      return { success: false };
    }
  },

  async getGalleryReports(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/gallery-reports`);
      if (!response.ok) throw new Error('Failed to fetch gallery reports');
      return await response.json();
    } catch (error) {
      console.error('getGalleryReports error:', error);
      return [];
    }
  },

  async dismissGalleryReport(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/gallery-reports?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to dismiss gallery report');
      return await response.json();
    } catch (error) {
      console.error('dismissGalleryReport error:', error);
      return { success: false };
    }
  },

  // Gallery Item Likes
  async getGalleryLikes(galleryId: string, visitorId?: string): Promise<{ count: number; liked: boolean }> {
    try {
      let url = `${API_BASE}/gallery-likes?galleryId=${encodeURIComponent(galleryId)}`;
      if (visitorId) url += `&visitorId=${encodeURIComponent(visitorId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch gallery likes');
      return await response.json();
    } catch (error) {
      console.error('getGalleryLikes error:', error);
      return { count: 0, liked: false };
    }
  },

  async toggleGalleryLike(galleryId: string, visitorId: string): Promise<{ count: number; liked: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/gallery-likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId, visitorId }),
      });
      if (!response.ok) throw new Error('Failed to toggle gallery like');
      return await response.json();
    } catch (error) {
      console.error('toggleGalleryLike error:', error);
      return { count: 0, liked: false };
    }
  },

  // Gallery Comments
  async getGalleryComments(galleryId: string, options?: { limit?: number }): Promise<any[]> {
    try {
      let url = `${API_BASE}/gallery-comments?galleryId=${encodeURIComponent(galleryId)}`;
      if (options?.limit && options.limit > 0) url += `&limit=${encodeURIComponent(String(options.limit))}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch gallery comments');
      return await response.json();
    } catch (error) {
      console.error('getGalleryComments error:', error);
      return [];
    }
  },

  async createGalleryComment(data: { galleryId: string; authorName: string; authorId?: string; authorImage?: string; content: string }): Promise<{ success: boolean; id?: string; commentsCount?: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/gallery-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return { success: false, error: result.error || 'Failed to create gallery comment' };
      return result;
    } catch (error: any) {
      console.error('createGalleryComment error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteGalleryComment(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/gallery-comments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('deleteGalleryComment error:', error);
      return false;
    }
  },

  // Gallery Comment Votes
  async getGalleryCommentVotes(galleryId: string, userId: string): Promise<any[]> {
    try {
      const url = `${API_BASE}/gallery-comment-votes?galleryId=${encodeURIComponent(galleryId)}&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch comment votes');
      return await response.json();
    } catch (error) {
      console.error('getGalleryCommentVotes error:', error);
      return [];
    }
  },

  async toggleGalleryCommentVote(commentId: string, userId: string, voteType: 'like' | 'dislike'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/gallery-comment-votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId, voteType }),
      });
      if (!response.ok) throw new Error('Failed to toggle comment vote');
      return await response.json();
    } catch (error) {
      console.error('toggleGalleryCommentVote error:', error);
      return { success: false };
    }
  },


  // ═══════════════════════════════════════════
  // User Subscriptions
  // ═══════════════════════════════════════════
  async getSubscriptions(subscriberId: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/subscriptions?subscriberId=${encodeURIComponent(subscriberId)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.subscribedIds || [];
    } catch (error) {
      console.error('getSubscriptions error:', error);
      return [];
    }
  },

  async getUserSubscribers(targetId: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/subscriptions?targetId=${encodeURIComponent(targetId)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.subscriberIds || [];
    } catch (error) {
      console.error('getUserSubscribers error:', error);
      return [];
    }
  },

  async checkSubscription(subscriberId: string, targetId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/subscriptions?subscriberId=${encodeURIComponent(subscriberId)}&targetId=${encodeURIComponent(targetId)}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.isSubscribed;
    } catch (error) {
      console.error('checkSubscription error:', error);
      return false;
    }
  },

  async toggleSubscription(subscriberId: string, targetId: string): Promise<{ success: boolean; isSubscribed: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId, targetId }),
      });
      if (!response.ok) throw new Error('Failed to toggle subscription');
      return await response.json();
    } catch (error) {
      console.error('toggleSubscription error:', error);
      return { success: false, isSubscribed: false };
    }
  },

  // ═══════════════════════════════════════════
  // User Follows (유저 간 팔로우)
  // ═══════════════════════════════════════════
  async getUserFollowing(followerId: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/user-follows?followerId=${encodeURIComponent(followerId)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.followingIds || [];
    } catch (error) {
      console.error('getUserFollowing error:', error);
      return [];
    }
  },

  async checkUserFollow(followerId: string, followingId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/user-follows?followerId=${encodeURIComponent(followerId)}&followingId=${encodeURIComponent(followingId)}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.isFollowing;
    } catch (error) {
      console.error('checkUserFollow error:', error);
      return false;
    }
  },

  async toggleUserFollow(followerId: string, followingId: string): Promise<{ success: boolean; isFollowing: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/user-follows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId, followingId }),
      });
      if (!response.ok) throw new Error('Failed to toggle user follow');
      return await response.json();
    } catch (error) {
      console.error('toggleUserFollow error:', error);
      return { success: false, isFollowing: false };
    }
  },

  async getUserFollowers(followingId: string): Promise<{ followerIds: string[]; count: number }> {
    try {
      const response = await fetch(`${API_BASE}/user-follows?followingId=${encodeURIComponent(followingId)}&mode=followers`);
      if (!response.ok) return { followerIds: [], count: 0 };
      return await response.json();
    } catch (error) {
      console.error('getUserFollowers error:', error);
      return { followerIds: [], count: 0 };
    }
  },

  async checkCCAFollow(userId: string, ccaId: string): Promise<{ isFollowing: boolean; followedIds: string[] }> {
    const followingIds = await this.getUserFollowing(userId);
    return { 
      isFollowing: ccaId ? followingIds.includes(ccaId) : false,
      followedIds: followingIds
    };
  },

  async toggleCCAFollow(userId: string, ccaId: string): Promise<{ success: boolean; isFollowing: boolean }> {
    return this.toggleUserFollow(userId, ccaId);
  },

  // ═══════════════════════════════════════════
  // User Notifications
  // ═══════════════════════════════════════════
  async getNotifications(userId: string, type?: string): Promise<any[]> {
    try {
      let url = `${API_BASE}/user-notifications?userId=${encodeURIComponent(userId)}`;
      if (type) url += `&type=${encodeURIComponent(type)}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('getNotifications error:', error);
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/user-notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: 1 }),
      });
      return response.ok;
    } catch (error) {
      console.error('markNotificationRead error:', error);
      return false;
    }
  },

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/user-notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, all: true, is_read: 1 }),
      });
      return response.ok;
    } catch (error) {
      console.error('markAllNotificationsRead error:', error);
      return false;
    }
  },

  async getRankings(limit: number = 5): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/ranking?limit=${limit}`);
      console.log('Rankings API response status:', response.status);
      console.log('Rankings API response ok:', response.ok);
      if (!response.ok) {
        const text = await response.text();
        console.error('Rankings API error response:', text);
        throw new Error('Failed to fetch rankings');
      }
      return await response.json();
    } catch (error) {
      console.error('getRankings error:', error);
      return { success: false, rankings: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getNewCCAs(limit: number = 10, days: number = 30): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/new-ccas?limit=${limit}&days=${days}`);
      console.log('New CCAs API response status:', response.status);
      console.log('New CCAs API response ok:', response.ok);
      if (!response.ok) {
        const text = await response.text();
        console.error('New CCAs API error response:', text);
        throw new Error('Failed to fetch new CCAs');
      }
      return await response.json();
    } catch (error) {
      console.error('getNewCCAs error:', error);
      return { success: false, ccas: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async sendTip(userId: string, ccaId: string, amount: number, description?: string): Promise<{ success: boolean; remainingPoints: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ccaId, amount, description }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send tip');
      }
      return { success: true, remainingPoints: data.remainingPoints };
    } catch (error: any) {
      console.error('sendTip error:', error);
      return { success: false, remainingPoints: 0, error: error.message };
    }
  },

  async unlockGalleryItem(userId: string, galleryId: string, price: number): Promise<{ success: boolean; remainingPoints: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/gallery-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, galleryId, price }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlock gallery item');
      }
      return { success: true, remainingPoints: data.remainingPoints };
    } catch (error: any) {
      console.error('unlockGalleryItem error:', error);
      return { success: false, remainingPoints: 0, error: error.message };
    }
  },

  async getUnlockedGalleryItems(userId: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/gallery-unlock?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Failed to fetch unlocked gallery items');
      const data = await response.json();
      return data.unlockedIds || [];
    } catch (error) {
      console.error('getUnlockedGalleryItems error:', error);
      return [];
    }
  }
};
