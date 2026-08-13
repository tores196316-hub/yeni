import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface CopyInputProps {
  label: string;
  value: string;
}

export const CopyInput: React.FC<CopyInputProps> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast(`${label} panoya kopyalandı!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Kopyalama başarısız oldu.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={value}
          className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono select-all truncate"
        />
        <button
          type="button"
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-sky-600 hover:bg-sky-500 text-white active:scale-95'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
