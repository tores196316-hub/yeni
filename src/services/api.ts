import { ImageItem, AdminStats, UserProfile, Announcement } from '../types';

const API_BASE = '/api';

export const uploadImageXHR = (
  file: File,
  title?: string,
  token?: string,
  onProgress?: (percent: number) => void,
  options?: { passwordProtected?: boolean; password?: string; isPublic?: boolean }
): Promise<ImageItem> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    if (options?.passwordProtected) formData.append('passwordProtected', 'true');
    if (options?.password) formData.append('password', options.password);
    if (options?.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));

    xhr.open('POST', `${API_BASE}/upload`);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.data);
        } catch (e) {
          reject(new Error('Sunucudan geçersiz yanıt alındı.'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.message || 'Yükleme başarısız oldu.'));
        } catch {
          reject(new Error(`Yükleme hatası (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Ağ bağlantısı hatası oluştu.'));
    };

    xhr.send(formData);
  });
};

export const fetchImages = async (params?: { sort?: string; search?: string; limit?: number; page?: number }): Promise<{ images: ImageItem[]; total: number }> => {
  const query = new URLSearchParams();
  if (params?.sort) query.append('sort', params.sort);
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.page) query.append('page', params.page.toString());

  const res = await fetch(`${API_BASE}/images?${query.toString()}`);
  if (!res.ok) throw new Error('Resimler yüklenirken hata oluştu.');
  return await res.json();
};

export const fetchImageById = async (id: string): Promise<ImageItem> => {
  const res = await fetch(`${API_BASE}/images/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Resim bulunamadı.');
    throw new Error('Resim detayları alınamadı.');
  }
  const json = await res.json();
  return json.data;
};

export const deleteImage = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/images/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Silme işlemi başarısız.' }));
    throw new Error(err.message || 'Resim silinemedi.');
  }
};

export const reportImage = async (id: string, reason: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/images/${id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Şikayet gönderilemedi.');
};

export const incrementDownload = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/images/${id}/download`, { method: 'POST' });
};

export const verifyImagePassword = async (id: string, password: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE}/images/${id}/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Şifre doğrulama başarısız.');
  }
  return true;
};

export const fetchUserImages = async (token: string): Promise<ImageItem[]> => {
  const res = await fetch(`${API_BASE}/user/images`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Kullanıcı resimleri yüklenemedi.');
  const json = await res.json();
  return json.data;
};

export const fetchAdminStats = async (token: string): Promise<AdminStats> => {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Admin istatistikleri alınamadı.');
  const json = await res.json();
  return json.data;
};

export const fetchAdminUsers = async (token: string, search?: string): Promise<UserProfile[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/admin/users${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Kullanıcı listesi alınamadı.');
  const json = await res.json();
  return json.data;
};

export const toggleBanUser = async (uid: string, ban: boolean, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/users/${uid}/ban`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isBanned: ban }),
  });
  if (!res.ok) throw new Error('Kullanıcı durumu değiştirilemedi.');
};

export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  const res = await fetch(`${API_BASE}/announcements`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
};

export const createAnnouncement = async (
  announcement: { title: string; content: string; type: string; active: boolean },
  token: string
): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/announcement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(announcement),
  });
  if (!res.ok) throw new Error('Duyuru oluşturulamadı.');
};
