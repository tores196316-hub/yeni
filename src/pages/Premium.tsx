import React, { useEffect } from 'react';
import { Crown, Check, Zap, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Premium: React.FC = () => {
  const { showToast } = useToast();

  useEffect(() => {
    document.title = 'Premium Üyelik — PicHost.io';
  }, []);

  const handleSelectPlan = (planName: string) => {
    showToast(`${planName} paketi seçildi. Ödeme altyapısı yakında devreye alınacaktır.`, 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Crown className="w-4 h-4" />
          <span>Sınırsız Özgürlük</span>
        </div>
        <h1 className="text-4xl font-black text-white">PicHost Premium</h1>
        <p className="text-slate-400 text-sm">
          Yüksek dosya boyutu limitleri, reklamsız deneyim ve öncelikli CDN erişimi ile iş akışınızı hızlandırın.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Ücretsiz Plan</h3>
            <div className="text-3xl font-black text-white">
              0 ₺ <span className="text-xs font-normal text-slate-400">/ sonsuza kadar</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Maksimum 10 MB Görsel Yükleme</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Günlük 50 Resim Limiti</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Standart Cloudinary CDN Hızı</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 text-sm font-semibold cursor-not-allowed"
          >
            Mevcut Planınız
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-sky-950/60 to-slate-900 border-2 border-sky-500/50 rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            Popüler
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Pro Plan</span>
            </h3>
            <div className="text-3xl font-black text-white">
              49 ₺ <span className="text-xs font-normal text-slate-400">/ ay</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sky-400" />
                <span>Maksimum 50 MB Görsel Yükleme</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sky-400" />
                <span>Sınırsız Günlük Upload</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sky-400" />
                <span>Öncelikli CDN Sunucuları</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sky-400" />
                <span>Özel Profil Rozeti & Reklamsız Deneyim</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('Pro')}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-600/20 transition-all hover:scale-105"
          >
            Pro'ya Yükselt
          </button>
        </div>
      </div>
    </div>
  );
};
