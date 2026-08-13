import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { reportImage } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ReportModalProps {
  imageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ imageId, isOpen, onClose }) => {
  const [reason, setReason] = useState('Telif hakkı ihlali (DMCA)');
  const [customDetails, setCustomDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullReason = customDetails ? `${reason} - ${customDetails}` : reason;
      await reportImage(imageId, fullReason);
      showToast('Şikayetiniz yöneticilere iletildi. Teşekkür ederiz.', 'success');
      onClose();
    } catch {
      showToast('Şikayet gönderilemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Görseli Bildir</h3>
            <p className="text-xs text-slate-400">İhlal gerekçenizi belirtin.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bildirim Nedeni
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="Telif hakkı ihlali (DMCA)">Telif hakkı ihlali (DMCA)</option>
              <option value="Uygunsuz / Yetişkin içerik">Uygunsuz / Yetişkin içerik</option>
              <option value="Yasalara aykırı içerik">Yasalara aykırı içerik</option>
              <option value="Kişisel verilerin gizliliği">Kişisel verilerin gizliliği</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ek Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={3}
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              placeholder="Gerekçe detaylarını yazabilirsiniz..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
