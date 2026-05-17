// d:\NoSR\Sec Works\AsianConnect\Website\jtvlove.com\services\apiService.ts

const API_BASE_URL = '/api';

export const apiService = {
  async getCCAs(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/ccas`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getCCAs error', e);
      return [];
    }
  },

  async getSiteSettings(): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('getSiteSettings error', e);
      return null;
    }
  },
  // ... (other API methods)

  async uploadImage(file: File, type: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        // IMPORTANT: Do NOT explicitly set 'Content-Type' header for FormData.
        // The browser will automatically set it to 'multipart/form-data'
        // with the correct boundary.
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData.error);
        return null;
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  },

  // ... (other API methods)
};