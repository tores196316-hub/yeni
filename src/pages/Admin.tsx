import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Image as ImageIcon,
  Eye,
  Download,
  AlertTriangle,
  Megaphone,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  HardDrive,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStats,
  fetchAdminUsers,
  toggleBanUser,
  deleteImage,
  createAnnouncement,
} from '../services/api';
import { AdminStats, UserProfile, ImageItem } from '../types';
import { useToast } from '../context/ToastContext';

export const AdminPage: React.FC = () => {
  const { isAdmin, getToken } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'images' | 'announcements'>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('info');

  useEffect(() => {
    document.title = 'Yönetici Paneli — PicHost.io';
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        const statsData = await fetchAdminStats(token);
        setStats(statsData);
        const usersData = await fetchAdminUsers(token);
        setUsers(usersData);
      }
    } catch (err: any) {
      showToast(err.message || 'Admin verileri yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (uid: string, currentBanned: boolean) => {
    try {
      const token = await getToken();
      if (!token) return;
      await toggleBanUser(uid, !currentBanned, token);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, isBanned: !currentBanned } : u))
      );
      showToast(
        !currentBanned ? 'Kullanıcı engellendi (Banned).' : 'Kullanıcının engeli kaldırıldı.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'İşlem başarısız.', 'error');
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('Bu görseli kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteImage(id, token);
      if (stats) {
        setStats({
          ...stats,
          recentUploads: stats.recentUploads.filter((img) => img.id !== id),
          totalImages: Math.max(0, stats.totalImages - 1),
        });
      }
      showToast('Görsel silindi.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Silme başarısız.', 'error');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) return;
      await createAnnouncement(
        { title: annTitle, content: annContent, type: annType, active: true },
        token
      );
      showToast('Duyuru başarıyla yayınlandı!', 'success');
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      showToast(err.message || 'Duyuru oluşturulamadı.', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-400">Bu sayfayı yalnızca yönetici hesapları görüntüleyebilir.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Yönetici Paneli</span>
          </div>
          <h1 className="text-3xl font-black text-white">Sistem Kontrol Merkezi</h1>
        </div>

        {/* Admin Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>İstatistikler</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'users'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kullanıcılar</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'images'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Resimler</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'announcements'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Duyurular</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Veriler yükleniyor...</div>
      ) : (
        <>
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Toplam Kullanıcı</p>
                  <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
                  <p className="text-[11px] text-emerald-400">+Bugün: {stats.todayUsers}</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Toplam Resim</p>
                  <p className="text-3xl font-black text-white">{stats.totalImages}</p>
                  <p className="text-[11px] text-sky-400">+Bugün: {stats.todayUploads}</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Görüntülenme</p>
                  <p className="text-3xl font-black text-white">{stats.totalViews.toLocaleString()}</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase">İndirme Sayısı</p>
                  <p className="text-3xl font-black text-white">{stats.totalDownloads.toLocaleString()}</p>
                </div>
              </div>

              {/* Cloudinary Usage Card */}
              {stats.cloudinaryUsage && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sky-400 font-bold">
                    <HardDrive className="w-5 h-5" />
                    <span>Cloudinary Depolama Durumu ({stats.cloudinaryUsage.plan})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-slate-400">Kullanılan Alan:</p>
                      <p className="text-base font-bold text-white mt-1">
                        {stats.cloudinaryUsage.usedStorageMb.toFixed(2)} MB / {stats.cloudinaryUsage.maxStorageMb} MB
                      </p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-slate-400">Transformations:</p>
                      <p className="text-base font-bold text-white mt-1">
                        {stats.cloudinaryUsage.transformationsUsed}
                      </p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-slate-400">Bant Genişliği:</p>
                      <p className="text-base font-bold text-white mt-1">
                        {stats.cloudinaryUsage.bandwidthUsedMb.toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Uploads Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Son Yüklenen Resimler</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
                      <tr>
                        <th className="p-3">Önizleme</th>
                        <th className="p-3">Başlık</th>
                        <th className="p-3">Boyut</th>
                        <th className="p-3">Tarih</th>
                        <th className="p-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {stats.recentUploads.map((img) => (
                        <tr key={img.id} className="hover:bg-slate-800/40">
                          <td className="p-3">
                            <img
                              src={img.thumbnail_url || img.url}
                              alt=""
                              className="w-10 h-10 object-cover rounded-lg bg-slate-950"
                            />
                          </td>
                          <td className="p-3 font-semibold text-white max-w-[200px] truncate">
                            {img.title || 'İsimsiz'}
                          </td>
                          <td className="p-3 font-mono">{(img.bytes / 1024).toFixed(0)} KB</td>
                          <td className="p-3">
                            {new Date(img.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <a
                              href={`/i/${img.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-slate-700"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="p-1.5 rounded-lg bg-rose-950 text-rose-400 hover:bg-rose-900"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-white">Kullanıcı Yönetimi</h3>
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="E-posta veya isim ara..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="p-3">Kullanıcı</th>
                      <th className="p-3">E-posta</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users
                      .filter(
                        (u) =>
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.displayName?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">
                            {u.displayName || 'Kullanıcı'}
                          </td>
                          <td className="p-3 font-mono">{u.email}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            {u.isBanned ? (
                              <span className="text-rose-400 font-bold">Banlı</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Aktif</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleBanToggle(u.uid, !!u.isBanned)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto ${
                                u.isBanned
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white'
                              }`}
                            >
                              {u.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              <span>{u.isBanned ? 'Ban Kaldır' : 'Banla'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* IMAGES TAB */}
          {activeTab === 'images' && stats && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-white">Tüm Görsel İçerikleri</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.recentUploads.map((img) => (
                  <div
                    key={img.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-2 space-y-2"
                  >
                    <img
                      src={img.thumbnail_url || img.url}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs font-bold text-white truncate">{img.title || 'İsimsiz'}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>{(img.bytes / 1024).toFixed(0)} KB</span>
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="text-rose-400 hover:text-rose-300 font-bold"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-400" />
                <span>Sistem Duyurusu Oluştur</span>
              </h3>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duyuru Başlığı
                  </label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Örn: Sistem Bakım Çalışması"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duyuru İçeriği
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Duyuru mesajınız..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duyuru Tipi
                  </label>
                  <select
                    value={annType}
                    onChange={(e) => setAnnType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="info">Bilgilendirme (Mavi)</option>
                    <option value="warning">Uyarı (Sarı)</option>
                    <option value="success">Başarı (Yeşil)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/20"
                >
                  Duyuruyu Yayınla
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
