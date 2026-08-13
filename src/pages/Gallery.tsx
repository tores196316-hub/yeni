import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Flame, Clock, Download, Eye } from 'lucide-react';
import { fetchImages, formatDirectUrl } from '../services/api';
import { ImageItem } from '../types';
import { GallerySkeletonGrid } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

export const Gallery: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'views' | 'downloads'>('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Genel Galeri — PicHost.io';
    loadGalleryData();
  }, [sort]);

  const loadGalleryData = async (searchQuery = search) => {
    setLoading(true);
    try {
      const res = await fetchImages({ sort, search: searchQuery, limit: 32 });
      setImages(res.images);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGalleryData(search);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Resim Galerisi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Topluluk tarafından paylaşılan görselleri keşfedin.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Görsel veya başlık ara..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSort('newest')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            sort === 'newest'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>En Yeni</span>
        </button>

        <button
          onClick={() => setSort('views')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            sort === 'views'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>En Çok Görüntülenen</span>
        </button>

        <button
          onClick={() => setSort('downloads')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            sort === 'downloads'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>En Çok İndirilen</span>
        </button>
      </div>

      {/* Grid Content */}
      {loading ? (
        <GallerySkeletonGrid count={12} />
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <Link
              key={img.id}
              to={`/i/${img.id}`}
              className="group bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl overflow-hidden flex flex-col transition-all shadow-lg hover:shadow-sky-500/5 hover:-translate-y-1"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={formatDirectUrl(img.thumbnail_url || img.url)}
                  alt={img.title || 'Resim'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-slate-300 font-bold uppercase">
                  {img.format}
                </span>
              </div>

              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-sky-400 transition-colors">
                  {img.title || 'İsimsiz Görsel'}
                </h3>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    {img.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    {img.downloads || 0}
                  </span>
                  <span>{(img.bytes / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aradığınız görsel bulunamadı"
          description="Arama kriterlerinizi değiştirebilir veya yeni bir resim yükleyebilirsiniz."
        />
      )}
    </div>
  );
};
