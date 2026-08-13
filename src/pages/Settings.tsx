import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Shield, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../lib/firebase';

export const SettingsPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || currentUser?.displayName || ''
  );
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentUser) {
        await updateProfile(currentUser, { displayName });
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          displayName,
          updatedAt: new Date().toISOString(),
        });
        showToast('Profil bilgileriniz güncellendi.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Güncelleme başarısız.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Hesap Ayarları</h1>
        <p className="text-sm text-slate-400 mt-1">Profil ve güvenlik tercihlerinizi düzenleyin.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Görünen Ad / Ad Soyad
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              E-posta Adresi (Değiştirilemez)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={currentUser.email || ''}
                className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kullanıcı Rolü
            </label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <Shield className="w-4 h-4 text-sky-400" />
              <span className="text-slate-300 uppercase font-bold">
                {userProfile?.role || 'user'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm text-white shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
