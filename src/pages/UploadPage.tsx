import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clipboard,
  ExternalLink,
  Plus,
  Zap,
  Wand2,
  Lock,
  EyeOff,
} from 'lucide-react';
import { uploadImageXHR, formatDirectUrl } from '../services/api';
import { ImageItem, UploadProgress } from '../types';
import { CopyInput } from '../components/CopyInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ImageCompressorModal } from '../components/ImageCompressorModal';
import { ImageEditorModal } from '../components/ImageEditorModal';

const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const MAX_SIZE_MB = 10;

export const UploadPage: React.FC = () => {
  const { getToken } = useAuth();
  const { showToast } = useToast();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [uploadPassword, setUploadPassword] = useState('');
  
  // Modals & Workflow state
  const [isCompressorOpen, setIsCompressorOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [uploadWorkflow, setUploadWorkflow] = useState<'direct' | 'edit' | 'compress'>('direct');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorInputRef = useRef<HTMLInputElement>(null);
  const compressorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Resim Yükle — PicHost.io';

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files).filter((f) =>
          f.type.startsWith('image/')
        );
        if (files.length > 0) {
          handleFilesSelected(files);
          showToast('Panodaki resim algılandı ve eklendi.', 'info');
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type.toLowerCase())) {
      return `Geçersiz dosya türü (${file.name}). Yalnızca JPG, PNG, WEBP, GIF ve AVIF desteklenmektedir.`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Dosya boyutu çok büyük (${(file.size / (1024 * 1024)).toFixed(
        1
      )} MB). Maksimum limit: ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const startUpload = async (index: number, fileItem: UploadProgress) => {
    setUploads((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, status: 'uploading', progress: 0, error: undefined } : item
      )
    );

    try {
      const token = (await getToken()) || undefined;
      const result = await uploadImageXHR(
        fileItem.file,
        fileItem.file.name,
        token,
        (percent) => {
          setUploads((prev) =>
            prev.map((item, i) => (i === index ? { ...item, progress: percent } : item))
          );
        },
        {
          passwordProtected: passwordProtect,
          password: uploadPassword,
        }
      );

      setUploads((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, status: 'completed', progress: 100, result }
            : item
        )
      );
      showToast(`${fileItem.file.name} başarıyla yüklendi!`, 'success');
    } catch (err: any) {
      setUploads((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                status: 'error',
                error: err.message || 'Yükleme sırasında beklenmeyen bir hata oluştu.',
              }
            : item
        )
      );
      showToast(`Hata: ${err.message || 'Yükleme başarısız oldu.'}`, 'error');
    }
  };

  const handleEditFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      showToast(err, 'error');
      return;
    }
    setModalFile(file);
    setIsEditorOpen(true);
    showToast('Resim Düzenleyici açıldı.', 'info');
  };

  const handleCompressFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      showToast(err, 'error');
      return;
    }
    setModalFile(file);
    setIsCompressorOpen(true);
    showToast('Resim Sıkıştırıcı açıldı.', 'info');
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;

    if (uploadWorkflow === 'edit') {
      handleEditFile(files[0]);
      return;
    }

    if (uploadWorkflow === 'compress') {
      handleCompressFile(files[0]);
      return;
    }

    const newUploads: UploadProgress[] = [];

    files.forEach((file) => {
      const err = validateFile(file);
      if (err) {
        showToast(err, 'error');
        newUploads.push({
          file,
          progress: 0,
          status: 'error',
          error: err,
        });
      } else {
        newUploads.push({
          file,
          progress: 0,
          status: 'pending',
        });
      }
    });

    const currentLen = uploads.length;
    setUploads((prev) => [...prev, ...newUploads]);

    // Automatically trigger upload for valid pending ones
    newUploads.forEach((item, idx) => {
      if (item.status === 'pending') {
        startUpload(currentLen + idx, item);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hidden File Inputs for specific actions */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={editorInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleEditFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
      <input
        ref={compressorInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleCompressFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white tracking-tight">Hızlı Resim Yükleme</h1>
        <p className="text-sm text-slate-400">
          Görsellerinizi sürükleyip bırakın, seçin veya klavyeden yapıştırın (Ctrl+V).
        </p>
      </div>

      {/* Upload Workflow Mode Selector */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl">
        <span className="text-xs font-bold text-slate-300 px-3">Yükleme Modu:</span>
        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
          {[
            { id: 'direct', label: '⚡ Doğrudan Yükle', desc: 'Anında sunucuya yükler' },
            { id: 'edit', label: '🪄 Önce Düzenle', desc: 'Döndür, filtrele veya sansürle' },
            { id: 'compress', label: '📉 Önce Sıkıştır', desc: 'Boyutu küçültüp yükle' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setUploadWorkflow(mode.id as any)}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                uploadWorkflow === mode.id
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Tools Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => compressorInputRef.current?.click()}
          className="p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-2xl transition-all flex items-center justify-between group cursor-pointer shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-white group-hover:text-sky-400 transition-colors">
                Resim Sıkıştırma & Format Dönüştürücü
              </p>
              <p className="text-xs text-slate-400">Resim seçin, WEBP veya JPG yapıp küçültün</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            Resim Seç & Sıkıştır
          </span>
        </button>

        <button
          onClick={() => editorInputRef.current?.click()}
          className="p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl transition-all flex items-center justify-between group cursor-pointer shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wand2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                Hızlı Resim Düzenleyici
              </p>
              <p className="text-xs text-slate-400">Resim seçin, döndürün, sansürleyin veya filigran ekleyin</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Resim Seç & Düzenle
          </span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-all ${
          isDragging
            ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-sky-500/50 hover:bg-slate-900'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
            <UploadCloud className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-white">
              Dosyaları buraya sürükleyin veya aşağıdaki butonlardan seçin
            </p>
            <p className="text-xs text-slate-400">
              Maksimum Dosya Boyutu: <span className="font-semibold text-slate-200">{MAX_SIZE_MB} MB</span> • Desteklenenler: JPG, PNG, WEBP, GIF, AVIF
            </p>
          </div>

          {/* Action Buttons Inside Dropzone */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Görsel Seç & Yükle</span>
            </button>

            <button
              onClick={() => editorInputRef.current?.click()}
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-indigo-400" />
              <span>Seç & Düzenle</span>
            </button>

            <button
              onClick={() => compressorInputRef.current?.click()}
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-xl border border-sky-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-sky-400" />
              <span>Seç & Sıkıştır</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">
            <Clipboard className="w-3.5 h-3.5 text-sky-400" />
            <span>Panodan yapıştırma aktif (Ctrl + V)</span>
          </div>
        </div>
      </div>

      {/* Upload Settings / Security Options */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Güvenlik & Gizlilik Ayarları</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={passwordProtect}
              onChange={(e) => setPasswordProtect(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            <span className="ml-2 text-xs font-semibold text-slate-300">Resmi Şifre ile Koru</span>
          </label>
        </div>

        {passwordProtect && (
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={uploadPassword}
                onChange={(e) => setUploadPassword(e.target.value)}
                placeholder="Resmi görüntülemek için gerekli şifreyi girin..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Şifreyi bilmeyen ziyaretçiler bu görseli görüntüleyemez.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImageCompressorModal
        isOpen={isCompressorOpen}
        initialFile={modalFile}
        onClose={() => {
          setIsCompressorOpen(false);
          setModalFile(null);
        }}
        onCompressedUpload={(compressedFile) => {
          setIsCompressorOpen(false);
          setModalFile(null);
          // Directly upload the compressed file
          const currentLen = uploads.length;
          const newProgress: UploadProgress = {
            file: compressedFile,
            progress: 0,
            status: 'pending',
          };
          setUploads((prev) => [...prev, newProgress]);
          startUpload(currentLen, newProgress);
        }}
      />

      <ImageEditorModal
        isOpen={isEditorOpen}
        file={modalFile}
        onClose={() => {
          setIsEditorOpen(false);
          setModalFile(null);
        }}
        onEditedUpload={(editedFile) => {
          setIsEditorOpen(false);
          setModalFile(null);
          // Directly upload the edited file
          const currentLen = uploads.length;
          const newProgress: UploadProgress = {
            file: editedFile,
            progress: 0,
            status: 'pending',
          };
          setUploads((prev) => [...prev, newProgress]);
          startUpload(currentLen, newProgress);
        }}
      />
      {uploads.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Yüklenen Dosyalar ({uploads.length})</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Daha Fazla Resim Ekle</span>
            </button>
          </div>

          <div className="space-y-4">
            {uploads.map((item, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-white truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {item.status === 'uploading' && (
                      <span className="text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
                        %{item.progress} Yükleniyor...
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>✓ Yüklendi</span>
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>❌ Başarısız</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Error message & Retry */}
                {item.status === 'error' && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-200">
                    <span>{item.error}</span>
                    <button
                      onClick={() => startUpload(index, item)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 shrink-0 transition-colors ml-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Tekrar Denet</span>
                    </button>
                  </div>
                )}

                {/* Completed Image Links & Preview */}
                {item.status === 'completed' && item.result && (() => {
                  const directUrl = formatDirectUrl(item.result.url);
                  const thumbUrl = formatDirectUrl(item.result.thumbnail_url || item.result.url);
                  return (
                    <div className="pt-2 space-y-4 border-t border-slate-800/80">
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <img
                          src={thumbUrl}
                          alt="Önizleme"
                          className="w-28 h-28 object-cover rounded-xl border border-slate-700 bg-slate-950 shrink-0"
                        />
                        <div className="flex-1 space-y-2 w-full">
                          <a
                            href={directUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"
                          >
                            <span>Resmi Yeni Sekmede Aç</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <div className="grid grid-cols-1 gap-2">
                            <CopyInput
                              label="Doğrudan Resim Linki (Direct URL)"
                              value={directUrl}
                            />
                            <CopyInput
                              label="Resim Sayfası URL"
                              value={`${window.location.origin}/i/${item.result.id}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <CopyInput
                          label="Markdown Kodu"
                          value={`![${item.result.title || 'Resim'}](${directUrl})`}
                        />
                        <CopyInput
                          label="BBCode (Forum)"
                          value={`[img]${directUrl}[/img]`}
                        />
                        <CopyInput
                          label="HTML Kodu"
                          value={`<img src="${directUrl}" alt="${item.result.title || 'Resim'}" />`}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
