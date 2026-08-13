import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Calendar,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  ExternalLink,
  Settings,
  BarChart3,
  HardDrive,
  Lock,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchUserImages, deleteImage, formatDirectUrl } from '../services/api';
import { ImageItem } from '../types';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';

export const Profile: React.FC = () => {
  const { currentUser, userProfile, getToken } = useAuth();
  const { showToast } = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Profilim ve İstatistikler — PicHost.io';
    if (currentUser) {
      loadProfileImages();
    }
  }, [currentUser]);

  const loadProfileImages = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userImgs = await fetchUserImages(token);
        setImages(userImgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title?: string) => {
    if (!window.confirm(`"${title || 'Bu görsel'}" adlı resmi silmek istediğinize emin misiniz?`)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteImage(id, token);
      setImages((prev) => prev.filter((img) => img.id !== id));
      showToast('Görsel başarıyla silindi.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Silme başarısız.', 'error');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-slate-400">Profilinize erişmek için giriş yapmalısınız.</p>
        <Link
          to="/giris"
          className="inline-block px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  const totalViews = images.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalDownloads = images.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
  const totalBytes = images.reduce((acc, curr) => acc + (curr.bytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  // Format distribution
  const formatCounts: Record<string, number> = {};
  images.forEach((img) => {
    const fmt = (img.format || 'jpg').toUpperCase();
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
  });

  // Top performing images
  const topImages = [...images].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const maxViews = topImages[0]?.views || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <img
            src={
              userProfile?.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                userProfile?.displayName || 'K'
              )}&background=0284c7&color=fff`
            }
            alt="Avatar"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-sky-500/50 shadow-xl"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white">
              {userProfile?.displayName || currentUser.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-slate-400">{currentUser.email}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Kayıt Tarihi:{' '}
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString('tr-TR')
                  : '—'}
              </span>
            </p>
          </div>
        </div>

        <Link
          to="/ayarlar"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
        >
          <Settings className="w-4 h-4 text-sky-400" />
          <span>Profil Ayarları</span>
        </Link>
      </div>

      {/* Profile Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{images.length}</p>
            <p className="text-xs text-slate-400">Toplam Yüklenen Resim</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Toplam Görüntülenme</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalDownloads.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Toplam İndirilme</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalMB} MB</p>
            <p className="text-xs text-slate-400">Toplam Depolama Alanı</p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Visualizer */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Images Bar Chart */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">En Çok Görüntülenen Resimler</h3>
              </div>
              <span className="text-xs text-slate-400">İlk 5 Görsel</span>
            </div>

            <div className="space-y-4 pt-2">
              {topImages.map((img) => {
                const percent = Math.max(5, Math.round(((img.views || 0) / maxViews) * 100));
                return (
                  <div key={img.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                        {img.title || 'İsimsiz'}
                      </span>
                      <span className="font-mono text-sky-400 font-bold">
                        {img.views || 0} Görüntülenme
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Distribution Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Dosya Biçimleri DAĞILIMI</h3>
            </div>

            <div className="space-y-3">
              {Object.entries(formatCounts).map(([fmt, count]) => {
                const percentage = Math.round((count / images.length) * 100);
                return (
                  <div key={fmt} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                      <span className="text-xs font-bold text-white">{fmt}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-200">{count} adet</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">(%{percentage})</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Resimlerinizi WEBP formatına dönüştürerek %80 depolama tasarrufu sağlayabilirsiniz.</span>
            </div>
          </div>
        </div>
      )}

      {/* User Uploads Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Yüklediğim Görseller</h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div
                key={img.id}
                className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
              >
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    src={formatDirectUrl(img.thumbnail_url || img.url)}
                    alt={img.title || 'Resim'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {img.passwordProtected && (
                    <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-md">
                      <Lock className="w-3 h-3" />
                      <span>Şifreli</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-center justify-center gap-2">
                    <Link
                      to={`/i/${img.id}`}
                      className="p-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                      title="Detay"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(img.id, img.title)}
                      className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <p className="text-sm font-bold text-white truncate">{img.title || 'İsimsiz'}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {img.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {img.downloads || 0}
                    </span>
                    <span>{(img.bytes / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Henüz resim yüklemediniz"
            description="Resim yükleyerek kütüphanenizi oluşturabilirsiniz."
            actionText="İlk Resmini Yükle"
            actionLink="/yukle"
          />
        )}
      </div>
    </div>
  );
};
