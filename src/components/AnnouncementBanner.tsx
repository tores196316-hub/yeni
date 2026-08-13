import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { fetchAnnouncements } from '../services/api';
import { Announcement } from '../types';

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [closedIds, setClosedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements().then((data) => {
      setAnnouncements(data.filter((a) => a.active));
    }).catch(() => {});
  }, []);

  const activeAnnouncements = announcements.filter((a) => !closedIds.includes(a.id));

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white px-4 py-2 text-sm shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span className="font-semibold">{activeAnnouncements[0].title}:</span>
          <span className="truncate">{activeAnnouncements[0].content}</span>
        </div>
        <button
          onClick={() => setClosedIds((prev) => [...prev, activeAnnouncements[0].id])}
          className="hover:bg-white/20 p-1 rounded-full transition-colors shrink-0"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
