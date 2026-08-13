import React from 'react';
import { Link } from 'react-router-dom';
import { ImageOff, UploadCloud } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Henüz resim bulunmuyor',
  description = 'İlk görselinizi yükleyerek hemen paylaşmaya başlayabilirsiniz.',
  actionText = 'Resim Yükle',
  actionLink = '/yukle',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl max-w-md mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <ImageOff className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6">{description}</p>
      {actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-sky-600/20"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{actionText}</span>
        </Link>
      )}
    </div>
  );
};
