import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Crop, Wand2, Type, Download, Upload, EyeOff, Sliders, Check, FileImage } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  file?: File | null;
  onEditedUpload?: (file: File) => void;
}

export function ImageEditorModal({
  isOpen,
  onClose,
  imageUrl,
  file,
  onEditedUpload,
}: ImageEditorModalProps) {
  const [currentFile, setCurrentFile] = useState<File | null>(file || null);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0); // Sansür / Blur
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'sepia' | 'vintage'>('none');
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [watermarkPos, setWatermarkPos] = useState<'bottom-right' | 'center' | 'top-left'>('bottom-right');

  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'text'>('adjust');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (file) {
      setCurrentFile(file);
    }
  }, [isOpen, file]);

  useEffect(() => {
    if (!isOpen) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (currentFile) {
      img.src = URL.createObjectURL(currentFile);
    } else if (imageUrl) {
      img.src = imageUrl;
    } else {
      setSourceImg(null);
      return;
    }

    img.onload = () => {
      setSourceImg(img);
    };
  }, [isOpen, currentFile, imageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (!sourceImg || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Rotation dimensions
    const isRotatedVertical = rotation % 180 !== 0;
    canvas.width = isRotatedVertical ? sourceImg.height : sourceImg.width;
    canvas.height = isRotatedVertical ? sourceImg.width : sourceImg.height;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Rotation Transform
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply Filter & Adjustment string
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;
    if (filter === 'grayscale') filterString += ' grayscale(100%)';
    if (filter === 'sepia') filterString += ' sepia(100%)';
    if (filter === 'vintage') filterString += ' sepia(50%) hue-rotate(-30deg) saturate(140%)';

    ctx.filter = filterString;
    ctx.drawImage(sourceImg, -sourceImg.width / 2, -sourceImg.height / 2);
    ctx.restore();

    // Draw Watermark / Text Overlay
    if (watermarkText.trim()) {
      ctx.save();
      const fontSize = Math.max(16, Math.round(canvas.width / 30));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;

      const padding = 20;
      let x = padding;
      let y = padding + fontSize;

      if (watermarkPos === 'bottom-right') {
        const textWidth = ctx.measureText(watermarkText).width;
        x = canvas.width - textWidth - padding;
        y = canvas.height - padding;
      } else if (watermarkPos === 'center') {
        const textWidth = ctx.measureText(watermarkText).width;
        x = (canvas.width - textWidth) / 2;
        y = canvas.height / 2;
      }

      ctx.fillText(watermarkText, x, y);
      ctx.restore();
    }
  }, [sourceImg, rotation, brightness, contrast, blur, filter, watermarkText, watermarkPos]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setBlur(0);
    setFilter('none');
    setWatermarkText('');
  };

  const getEditedBlob = (): Promise<Blob> => {
    return new Promise((resolve) => {
      canvasRef.current?.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
  };

  const handleDownload = async () => {
    const blob = await getEditedBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pichost-edited-${Date.now()}.png`;
    a.click();
  };

  const handleUpload = async () => {
    if (!onEditedUpload) return;
    const blob = await getEditedBlob();
    const editedFile = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });
    onEditedUpload(editedFile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Hızlı Resim Düzenleyici</h3>
              <p className="text-xs text-slate-400">Döndür, Filtrele, Sansürle / Blur ve Filigran Ekle</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Sıfırla
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!sourceImg ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4 group my-4"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-16 h-16 bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto transition-colors shadow-lg">
                <FileImage className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-200 text-base">Düzenlemek istediğiniz resmi seçin veya sürükleyin</p>
                <p className="text-xs text-slate-400">JPG, PNG, WEBP veya GIF desteklenir</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Canvas Preview */}
              <div className="md:col-span-2 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[280px] max-h-[420px] overflow-hidden relative group">
                <canvas ref={canvasRef} className="max-w-full max-h-[360px] object-contain rounded-lg shadow-lg" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 left-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-semibold px-3 py-1.5 rounded-lg shadow-md transition-all cursor-pointer backdrop-blur-md"
                >
                  Resmi Değiştir
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

          {/* Control Panel */}
          <div className="space-y-5 bg-slate-950/50 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'adjust', label: 'Ayar', icon: Sliders },
                { id: 'filters', label: 'Filtre', icon: Wand2 },
                { id: 'text', label: 'Yazı', icon: Type },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Controls */}
            <div className="space-y-4 flex-1">
              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  <button
                    onClick={handleRotate}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4 text-sky-400" />
                    <span>90° Sağa Döndür</span>
                  </button>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Parlaklık</span>
                      <span className="font-mono text-sky-400">%{brightness}</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Kontrast</span>
                      <span className="font-mono text-sky-400">%{contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sansür / Bulanıklaştırma (Blur)</span>
                      </span>
                      <span className="font-mono text-amber-400">{blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={blur}
                      onChange={(e) => setBlur(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Orijinal' },
                    { id: 'grayscale', label: 'Siyah Beyaz' },
                    { id: 'sepia', label: 'Nostaljik (Sepia)' },
                    { id: 'vintage', label: 'Vintage' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id as any)}
                      className={`p-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        filter === f.id
                          ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Filigran / Yazı Ekle</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Örn: pichost.com / Gizli"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Yazı Konumu</label>
                    <select
                      value={watermarkPos}
                      onChange={(e) => setWatermarkPos(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-sky-500"
                    >
                      <option value="bottom-right">Sağ Alt Köşe</option>
                      <option value="center">Tam Ortada</option>
                      <option value="top-left">Sol Üst Köşe</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDownload}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>İndir</span>
          </button>

          {onEditedUpload && (
            <button
              onClick={handleUpload}
              className="py-2.5 px-5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Yükle ve Paylaş</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
