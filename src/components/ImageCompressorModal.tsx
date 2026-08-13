import React, { useState, useRef } from 'react';
import { X, Sliders, Download, Upload, Zap, Check, FileImage, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageCompressorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompressedUpload?: (file: File) => void;
  initialFile?: File | null;
}

export function ImageCompressorModal({
  isOpen,
  onClose,
  onCompressedUpload,
  initialFile,
}: ImageCompressorModalProps) {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialFile ? URL.createObjectURL(initialFile) : null
  );
  const [format, setFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [quality, setQuality] = useState<number>(80); // 1-100
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [compressedResult, setCompressedResult] = useState<{
    url: string;
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && initialFile) {
      setFile(initialFile);
      setPreviewUrl(URL.createObjectURL(initialFile));
      setCompressedResult(null);
    } else if (isOpen && !initialFile && !file) {
      setFile(null);
      setPreviewUrl(null);
      setCompressedResult(null);
    }
  }, [isOpen, initialFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setCompressedResult(null);
    }
  };

  const handleCompress = async () => {
    if (!file || !previewUrl) return;

    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Fill white background for JPEG
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const q = quality / 100;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }

          const originalSize = file.size;
          const compressedSize = blob.size;
          const savedPercentage = Math.max(
            0,
            Math.round(((originalSize - compressedSize) / originalSize) * 100)
          );

          const resultUrl = URL.createObjectURL(blob);
          setCompressedResult({
            url: resultUrl,
            blob,
            originalSize,
            compressedSize,
            savedPercentage,
          });
          setIsProcessing(false);
        },
        format,
        q
      );
    } catch (err) {
      console.error('Compression error:', err);
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (!compressedResult) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = compressedResult.url;
    a.download = `compressed-pichost.${ext}`;
    a.click();
  };

  const handleDirectUpload = () => {
    if (!compressedResult || !onCompressedUpload) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const compressedFile = new File([compressedResult.blob], `compressed-${Date.now()}.${ext}`, {
      type: format,
    });
    onCompressedUpload(compressedFile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Resim Sıkıştırma & Format Dönüştürücü</h3>
              <p className="text-xs text-slate-400">Görsellerinizin boyutunu %90'a kadar düşürün</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-sky-500 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-14 h-14 bg-slate-800 group-hover:bg-sky-600/20 text-slate-400 group-hover:text-sky-400 rounded-2xl flex items-center justify-center mx-auto transition-colors">
                <FileImage className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Sıkıştırmak istediğiniz resmi seçin</p>
                <p className="text-xs text-slate-500">JPG, PNG, WEBP veya HEIC formatları desteklenir</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>ÖNİZLEME</span>
                  <span>Orijinal: {formatBytes(file.size)}</span>
                </div>
                <div className="aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                  <img
                    src={compressedResult?.url || previewUrl!}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  {compressedResult && (
                    <span className="absolute top-2 right-2 bg-emerald-500/90 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md">
                      -%{compressedResult.savedPercentage} Küçük
                    </span>
                  )}
                </div>

                {compressedResult && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-xs text-emerald-300 font-semibold">
                      <span>Yeni Boyut:</span>
                      <span>{formatBytes(compressedResult.compressedSize)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${100 - compressedResult.savedPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Compression Controls */}
              <div className="space-y-5 bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>HEDEF FORMAT</span>
                    <span className="text-sky-400 uppercase font-mono">{format.split('/')[1]}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'WEBP (Önerilen)', val: 'image/webp' },
                      { label: 'JPG / JPEG', val: 'image/jpeg' },
                      { label: 'PNG', val: 'image/png' },
                    ].map((f) => (
                      <button
                        key={f.val}
                        onClick={() => {
                          setFormat(f.val as any);
                          setCompressedResult(null);
                        }}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                          format === f.val
                            ? 'bg-sky-600 border-sky-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>KALİTE (Sıkıştırma Oranı)</span>
                    <span className="text-sky-400 font-mono">%{quality}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={(e) => {
                      setQuality(Number(e.target.value));
                      setCompressedResult(null);
                    }}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Yüksek Sıkıştırma (Küçük Boyut)</span>
                    <span>Maksimum Kalite</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex justify-between">
                    <span>MAKSİMUM GENİŞLİK (Genislik Ölçekle)</span>
                    <span className="text-slate-400 font-mono">{maxWidth}px</span>
                  </label>
                  <select
                    value={maxWidth}
                    onChange={(e) => {
                      setMaxWidth(Number(e.target.value));
                      setCompressedResult(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-sky-500"
                  >
                    <option value={3840}>4K (3840px - Orijinal Yakın)</option>
                    <option value={1920}>Full HD (1920px - Önerilen)</option>
                    <option value={1280}>HD (1280px - Web Uyumlu)</option>
                    <option value={800}>Mobil (800px - Çok Hızlı)</option>
                  </select>
                </div>

                <button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? 'Sıkıştırılıyor...' : 'Sıkıştırmayı Başlat'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {compressedResult && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={handleDownload}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Cihaza İndir</span>
            </button>

            {onCompressedUpload && (
              <button
                onClick={handleDirectUpload}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>PicHost'a Yükle</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
