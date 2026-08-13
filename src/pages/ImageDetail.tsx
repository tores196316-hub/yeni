import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download,
  Eye,
  Calendar,
  HardDrive,
  Maximize2,
  Share2,
  AlertTriangle,
  Trash2,
  QrCode,
  User,
  Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchImageById, incrementDownload, deleteImage } from '../services/api';
import { ImageItem } from '../types';
import { CopyInput } from '../components/CopyInput';
import { ReportModal } from '../components/ReportModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ImageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, isAdmin, getToken } = useAuth();
  const { showToast } = useToast();

  const [image, setImage] = useState<ImageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchImageById(id)
        .then((data) => {
          setImage(data);
          document.title = `${data.title || 'Resim Detayı'} — PicHost.io`;
        })
        .catch((err) => {
          showToast(err.message || 'Resim bulunamadı.', 'error');
          navigate('/galeri');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Resim detayları yükleniyor...</p>
      </div>
    );
  }

  if (!image) return null;

  const isOwner = currentUser && image.userId === currentUser.uid;
  const canDelete = isOwner || isAdmin;
  const pageUrl = window.location.href;

  const handleDownload = async () => {
    try {
      await incrementDownload(image.id);
      setImage((prev) => (prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null));

      // Fetch blob and force download
      const response = await fetch(image.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = image.title || `image-${image.id}.${image.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      showToast('İndirme başlatıldı.', 'success');
    } catch {
      showToast('İndirme sırasında hata oluştu. Doğrudan bağlantı açılıyor...', 'info');
      window.open(image.url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu resmi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    try {
      const token = (await getToken()) || undefined;
      if (!token) throw new Error('Oturum bilgisi bulunamadı.');
      await deleteImage(image.id, token);
      showToast('Resim başarıyla silindi.', 'success');
      navigate('/galeri');
    } catch (err: any) {
      showToast(err.message || 'Silme işlemi başarısız.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Info / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">{image.title || 'İsimsiz Görsel'}</h1>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Yükleyen: {image.userDisplayName || 'Misafir Kullanıcı'}</span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{new Date(image.createdAt).toLocaleDateString('tr-TR')}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>İndir</span>
          </button>

          <button
            onClick={() => setQrModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="QR Kod Göster"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
            title="Bildir / Şikayet Et"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {canDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white font-semibold text-sm transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sil</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Preview */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-3xl overflow-hidden p-4 md:p-8 flex items-center justify-center shadow-2xl relative">
        <a href={image.url} target="_blank" rel="noreferrer" className="group relative block max-w-full">
          <img
            src={image.url}
            alt={image.title || 'Resim'}
            className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white font-semibold gap-2">
            <Maximize2 className="w-6 h-6" />
            <span>Tam Boyut Aç</span>
          </div>
        </a>
      </div>

      {/* Metadata Metrics & Share Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400" />
            <span>Görsel Bilgileri</span>
          </h3>

          <div className="space-y-3 text-sm text-slate-300 divide-y divide-slate-800">
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Çözünürlük:</span>
              <span className="font-mono font-semibold text-white">
                {image.width} × {image.height} px
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Dosya Boyutu:</span>
              <span className="font-mono font-semibold text-white">
                {(image.bytes / (1024 * 1024)).toFixed(2)} MB ({image.bytes.toLocaleString()} B)
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Format:</span>
              <span className="font-mono font-semibold text-sky-400 uppercase">
                {image.format}
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Görüntülenme:</span>
              <span className="font-mono font-semibold text-white flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                {image.views || 0}
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">İndirilme:</span>
              <span className="font-mono font-semibold text-white flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-slate-500" />
                {image.downloads || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Share Codes */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>Paylaşım Bağlantıları ve Kodları</span>
          </h3>

          <div className="space-y-4">
            <CopyInput label="Doğrudan Resim Linki (Direct URL)" value={image.url} />
            <CopyInput label="Resim Detay Sayfası URL" value={pageUrl} />
            <CopyInput
              label="Markdown Kodu"
              value={`![${image.title || 'Resim'}](${image.url})`}
            />
            <CopyInput
              label="BBCode (Forumlar İçin)"
              value={`[img]${image.url}[/img]`}
            />
            <CopyInput
              label="HTML Gömme Kodu"
              value={`<img src="${image.url}" alt="${image.title || 'Resim'}" />`}
            />
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white">Resim QR Kodu</h3>
            <div className="p-4 bg-white rounded-xl inline-block shadow-inner">
              <QRCodeSVG value={pageUrl} size={180} />
            </div>
            <p className="text-xs text-slate-400">Mobil cihazınızla taratarak sayfaya hızlıca erişin.</p>
            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        imageId={image.id}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
};
