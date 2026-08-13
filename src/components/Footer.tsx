import React from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white">PicHost.io</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Profesyonel, yüksek hızlı ve güvenilir resim yükleme ve CDN paylaşım altyapısı. Görsellerinizi Cloudinary ve Firestore güvencesiyle saklayın.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-2.5 py-1.5 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Cloudinary CDN Aktif</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Hızlı Erişim
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/yukle" className="hover:text-sky-400 transition-colors">
                  Resim Yükle
                </Link>
              </li>
              <li>
                <Link to="/galeri" className="hover:text-sky-400 transition-colors">
                  Genel Galeri
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-sky-400 transition-colors">
                  Teknoloji Blogu
                </Link>
              </li>
              <li>
                <Link to="/premium" className="hover:text-sky-400 transition-colors">
                  Premium Üyelik
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Destek & Yardım
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/hakkimizda" className="hover:text-sky-400 transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/yardim" className="hover:text-sky-400 transition-colors">
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link to="/sss" className="hover:text-sky-400 transition-colors">
                  Sıkça Sorulan Sorular (SSS)
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="hover:text-sky-400 transition-colors">
                  Bize Ulaşın
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Yasal & Politika
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/gizlilik" className="hover:text-sky-400 transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/sartlar" className="hover:text-sky-400 transition-colors">
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-sky-400 transition-colors">
                  DMCA / Telif Bildirimi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PicHost.io. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-1">
            <span>Türkiye için tutkuyla geliştirildi</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};
