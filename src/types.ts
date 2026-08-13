export interface ImageItem {
  id: string;
  title?: string;
  public_id: string;
  url: string;
  thumbnail_url?: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  userId?: string;
  userDisplayName?: string;
  userEmail?: string;
  views: number;
  downloads: number;
  isPublic: boolean;
  passwordProtected?: boolean;
  passwordHash?: string;
  viewsHistory?: { date: string; count: number }[];
  isReported?: boolean;
  reportReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  isBanned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ImageReport {
  id: string;
  imageId: string;
  imageTitle?: string;
  imageUrl?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalImages: number;
  todayUploads: number;
  todayUsers: number;
  totalViews: number;
  totalDownloads: number;
  cloudinaryUsage?: {
    plan: string;
    maxStorageMb: number;
    usedStorageMb: number;
    transformationsUsed: number;
    bandwidthUsedMb: number;
  };
  recentUploads: ImageItem[];
  recentUsers: UserProfile[];
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: ImageItem;
}
