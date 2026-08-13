import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Zap,
  ShieldCheck,
  Share2,
  Image as ImageIcon,
  ArrowRight,
  Layers,
  Flame,
} from 'lucide-react';
import { fetchImages } from '../services/api';
import { ImageItem } from '../types';

export const Home: React.FC = () => {
  const [recentImages, setRecentImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'PicHost.io — Hızlı, Güvenli Resim Yükleme ve Görsel Hosting Platformu';
    fetchImages({ limit: 8, sort: 'newest' })
      .then((res) => {
        setRecentImages(res.images);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sky-400 text-xs font-semibold tracking-wide">
            <Zap className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>Cloudinary CDN & Firestore Altyapısı</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Resimlerini <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">Hızlı ve Güvenli</span> Paylaş
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Görsellerinizi saniyeler içinde yükleyin, doğrudan erişim bağlantılarınızı (Direct URL, Markdown, BBCode, HTML) anında alın.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/yukle"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-base shadow-xl shadow-sky-600/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Resim Yükle</span>
            </Link>
            <a
              href="#nasil-calisir"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              <span>Nasıl Çalışır?</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Supported Formats Pill */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Desteklenen Formatlar:</span>
            {['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'AVIF'].map((fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-300"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Neden PicHost.io Kullanmalısınız?
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Maksimum hız, gelişmiş paylaşım kodları ve yüksek güvenilirlik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Işık Hızında Cloudinary CDN</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Yüklediğiniz her görsel küresel Cloudinary CDN ağına aktarılır. Dünyanın her yerinden milisaniyeler içinde kesintisiz yüklenir.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Çoklu Bağlantı Formatları</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Forumlara, sitelere ve sosyal medyaya uyumlu Direct URL, Markdown, BBCode ve HTML kodları tek tıkla kopyalamaya hazırdır.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Güvenli Veri Yönetimi</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Resim bilgileriniz Firebase Firestore veritabanında güvenle tutulur. İstediğiniz an resimlerinizi yönetebilir veya silebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="nasil-calisir" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 md:p-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">3 Adımda Resim Paylaşımı</h2>
            <p className="text-sm text-slate-400 mt-2">Karmaşık üyelik şartları olmadan anında başlayın.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-sky-600/20">
                1
              </div>
              <h3 className="text-base font-bold text-white">Dosyayı Seç veya Bırak</h3>
              <p className="text-xs text-slate-400">
                Bilgisayarınızdan, telefonunuzdan seçin veya panodan (Ctrl+V) resminizi direkt yapıştırın.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                2
              </div>
              <h3 className="text-base font-bold text-white">Bulut Yüklemesi</h3>
              <p className="text-xs text-slate-400">
                Görseliniz güvenle Cloudinary sunucularına aktarılır ve optimize edilir.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                3
              </div>
              <h3 className="text-base font-bold text-white">Linkini Kopyala</h3>
              <p className="text-xs text-slate-400">
                Oluşturulan doğrudan resim adresini veya web sayfasını dilediğiniz platformda paylaşın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Public Uploads Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Son Yüklenen Görseller</h2>
          </div>
          <Link
            to="/galeri"
            className="text-xs sm:text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>Tüm Galeriyi Gör</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentImages.map((img) => (
              <Link
                key={img.id}
                to={`/i/${img.id}`}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-square block hover:border-sky-500/50 transition-all shadow-md"
              >
                <img
                  src={img.thumbnail_url || img.url}
                  alt={img.title || 'Yüklenen Görsel'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-xs font-semibold text-white truncate">
                    {img.title || 'İsimsiz Resim'}
                  </p>
                  <p className="text-[10px] text-slate-300 font-mono uppercase">
                    {img.format} • {(img.bytes / 1024).toFixed(0)} KB
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            Henüz herkese açık resim yüklenmedi.
          </div>
        )}
      </section>
    </div>
  );
};
