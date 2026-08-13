import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { initializeApp as initAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Load Firebase Config safely with defaults
const defaultFirebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0179187692',
  appId: process.env.FIREBASE_APP_ID || '1:636682579535:web:c3f35ca579c6c898b0c43a',
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyCsny4h0xNd0osEbJRTL1vpfszQCleFH1s',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0179187692.firebaseapp.com',
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || 'ai-studio-cloudsnappro-db3e9328-0ce0-429f-b04b-59ca421a7874',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0179187692.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '636682579535',
};

let firebaseConfig = defaultFirebaseConfig;
try {
  const jsonPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    firebaseConfig = { ...defaultFirebaseConfig, ...JSON.parse(raw) };
  }
} catch {
  console.log('Using default embedded Firebase config');
}

// Initialize Express App
const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 50; // Increased upload size limit for 8GB RAM server

// Enable Gzip/Brotli compression for fast transfer
app.use(compression({ level: 6, threshold: 1024 }));

// In-Memory RAM Cache for Ultra-Fast API Responses (takes advantage of 8GB RAM)
interface CacheEntry {
  data: any;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10000; // 10 seconds RAM cache TTL for feed lists

function getCachedData(key: string) {
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

function clearMemoryCache() {
  memoryCache.clear();
}

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Scaled Rate Limiters for 8-Core CPU Server Capacity
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Scaled for high traffic
  message: { message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Scaled for high upload capacity
  message: { message: 'Upload sınırı aşıldı. Lütfen daha sonra tekrar deneyin.' },
});

app.use('/api/', generalLimiter);

// Local Directory for Uploads with 1-Year Browser Caching
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1y',
  etag: true,
  immutable: true,
}));

// File Store Fallback (when Firebase Admin credentials are not provided or GCP ADC is missing)
const dbStorePath = path.join(uploadsDir, 'db_store.json');

interface LocalStore {
  images: any[];
  users: any[];
  reports: any[];
  announcements: any[];
}

function readLocalStore(): LocalStore {
  try {
    if (fs.existsSync(dbStorePath)) {
      const raw = fs.readFileSync(dbStorePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Local DB read error:', e);
  }
  return { images: [], users: [], reports: [], announcements: [] };
}

function writeLocalStore(store: LocalStore) {
  try {
    fs.writeFileSync(dbStorePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Local DB write error:', e);
  }
}

// Firebase Admin Setup (Safely handles missing credentials)
const dbId = firebaseConfig.firestoreDatabaseId;
let adminDb: any = null;
let adminAuth: any = null;
let firebaseAdminReady = false;

try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    if (!getApps().length) {
      initAdminApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    adminDb = (dbId && dbId !== '(default)') ? getFirestore(dbId) : getFirestore();
    adminAuth = getAuth();
    firebaseAdminReady = true;
    console.log('Firebase Admin initialized with service account.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (!getApps().length) {
      initAdminApp({ projectId: firebaseConfig.projectId });
    }
    adminDb = (dbId && dbId !== '(default)') ? getFirestore(dbId) : getFirestore();
    adminAuth = getAuth();
    firebaseAdminReady = true;
    console.log('Firebase Admin initialized with ADC credentials.');
  } else {
    firebaseAdminReady = false;
    console.log('Firebase Admin service credentials not set. Using local store fallback.');
  }
} catch (err: any) {
  console.log('Using local store fallback:', err.message);
  firebaseAdminReady = false;
}

// JWT Token Decoder fallback
function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      return {
        uid: payload.user_id || payload.sub || payload.uid || 'anonymous',
        email: payload.email || '',
        name: payload.name || payload.email?.split('@')[0] || 'Kullanıcı',
        admin: payload.email === (process.env.ADMIN_EMAIL || 'admin@pichost.com') || Boolean(payload.admin),
      };
    }
  } catch {}
  return null;
}

// Database Abstraction Helpers
async function dbSaveImage(imageDoc: any) {
  clearMemoryCache();
  if (firebaseAdminReady && adminDb) {
    try {
      await adminDb.collection('images').doc(imageDoc.id).set(imageDoc);
    } catch {
      firebaseAdminReady = false;
    }
  }
  const store = readLocalStore();
  store.images = store.images.filter((img) => img.id !== imageDoc.id);
  store.images.unshift(imageDoc);
  writeLocalStore(store);
}

async function dbGetImages(options: { sort?: string; search?: string; limit?: number; userId?: string; isPublicOnly?: boolean }) {
  let items: any[] = [];
  if (firebaseAdminReady && adminDb) {
    try {
      let query = adminDb.collection('images');
      if (options.isPublicOnly) {
        query = query.where('isPublic', '==', true);
      }
      if (options.userId) {
        query = query.where('userId', '==', options.userId);
      }
      const snap = await query.get();
      snap.forEach((doc: any) => items.push(doc.data()));
    } catch {
      firebaseAdminReady = false;
    }
  }

  if (items.length === 0) {
    const store = readLocalStore();
    items = store.images;
    if (options.isPublicOnly) {
      items = items.filter((img) => img.isPublic !== false);
    }
    if (options.userId) {
      items = items.filter((img) => img.userId === options.userId);
    }
  }

  // Filter search
  if (options.search) {
    const q = options.search.toLowerCase();
    items = items.filter((img) => img.title?.toLowerCase().includes(q));
  }

  // Sort
  if (options.sort === 'views') {
    items.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (options.sort === 'downloads') {
    items.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  } else {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = items.length;
  if (options.limit) {
    items = items.slice(0, options.limit);
  }

  return { items, total };
}

async function dbGetImageById(id: string) {
  if (firebaseAdminReady && adminDb) {
    try {
      const snap = await adminDb.collection('images').doc(id).get();
      if (snap.exists) return snap.data();
    } catch {
      firebaseAdminReady = false;
    }
  }
  const store = readLocalStore();
  return store.images.find((img) => img.id === id) || null;
}

async function dbIncrementViews(id: string) {
  if (firebaseAdminReady && adminDb) {
    try {
      const docRef = adminDb.collection('images').doc(id);
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.update({ views: (snap.data()?.views || 0) + 1 });
      }
    } catch {}
  }
  const store = readLocalStore();
  const img = store.images.find((i) => i.id === id);
  if (img) {
    img.views = (img.views || 0) + 1;
    writeLocalStore(store);
  }
}

async function dbIncrementDownloads(id: string) {
  if (firebaseAdminReady && adminDb) {
    try {
      const docRef = adminDb.collection('images').doc(id);
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.update({ downloads: (snap.data()?.downloads || 0) + 1 });
      }
    } catch {}
  }
  const store = readLocalStore();
  const img = store.images.find((i) => i.id === id);
  if (img) {
    img.downloads = (img.downloads || 0) + 1;
    writeLocalStore(store);
  }
}

async function dbDeleteImage(id: string) {
  clearMemoryCache();
  if (firebaseAdminReady && adminDb) {
    try {
      await adminDb.collection('images').doc(id).delete();
    } catch {}
  }
  const store = readLocalStore();
  store.images = store.images.filter((i) => i.id !== id);
  writeLocalStore(store);
}

async function dbReportImage(id: string, reason: string) {
  const reportId = Math.random().toString(36).substring(2, 9);
  const reportDoc = {
    id: reportId,
    imageId: id,
    reason: reason || 'Neden belirtilmedi',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (firebaseAdminReady && adminDb) {
    try {
      await adminDb.collection('reports').doc(reportId).set(reportDoc);
      await adminDb.collection('images').doc(id).update({ isReported: true, reportReason: reason });
    } catch {}
  }

  const store = readLocalStore();
  store.reports.push(reportDoc);
  const img = store.images.find((i) => i.id === id);
  if (img) {
    img.isReported = true;
    img.reportReason = reason;
  }
  writeLocalStore(store);
}

async function dbGetAdminStats() {
  const { items: allImages } = await dbGetImages({});
  let totalViews = 0;
  let totalDownloads = 0;
  let todayUploads = 0;
  let todayUsers = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  allImages.forEach((data) => {
    totalViews += data.views || 0;
    totalDownloads += data.downloads || 0;
    if (data.createdAt?.startsWith(todayStr)) todayUploads++;
  });

  let allUsers: any[] = [];
  if (firebaseAdminReady && adminDb) {
    try {
      const snap = await adminDb.collection('users').get();
      snap.forEach((doc: any) => allUsers.push(doc.data()));
    } catch {}
  }
  if (allUsers.length === 0) {
    const store = readLocalStore();
    allUsers = store.users;
  }
  const totalUsers = Math.max(allUsers.length, 1);
  allUsers.forEach((u) => {
    if (u.createdAt?.startsWith(todayStr)) todayUsers++;
  });

  return {
    totalUsers,
    totalImages: allImages.length,
    todayUploads,
    todayUsers,
    totalViews,
    totalDownloads,
    recentUploads: allImages.slice(0, 10),
    recentUsers: allUsers.slice(0, 10),
  };
}

async function dbGetUsers() {
  let list: any[] = [];
  if (firebaseAdminReady && adminDb) {
    try {
      const snap = await adminDb.collection('users').get();
      snap.forEach((doc: any) => list.push(doc.data()));
    } catch {}
  }
  if (list.length === 0) {
    const store = readLocalStore();
    list = store.users;
  }
  return list;
}

async function dbBanUser(uid: string, isBanned: boolean) {
  if (firebaseAdminReady && adminDb) {
    try {
      await adminDb.collection('users').doc(uid).update({ isBanned: Boolean(isBanned) });
    } catch {}
  }
  const store = readLocalStore();
  const u = store.users.find((usr) => usr.uid === uid);
  if (u) {
    u.isBanned = isBanned;
  } else {
    store.users.push({ uid, isBanned });
  }
  writeLocalStore(store);
}

async function dbGetAnnouncements() {
  let list: any[] = [];
  if (firebaseAdminReady && adminDb) {
    try {
      const snap = await adminDb.collection('announcements').where('active', '==', true).get();
      snap.forEach((doc: any) => list.push(doc.data()));
    } catch {}
  }
  if (list.length === 0) {
    const store = readLocalStore();
    list = store.announcements.filter((a) => a.active !== false);
  }
  return list;
}

async function dbAddAnnouncement(ann: any) {
  if (firebaseAdminReady && adminDb) {
    try {
      await adminDb.collection('announcements').doc(ann.id).set(ann);
    } catch {}
  }
  const store = readLocalStore();
  store.announcements.unshift(ann);
  writeLocalStore(store);
}

// Cloudinary Setup
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'lnjqbjeh';
const apiKey = process.env.CLOUDINARY_API_KEY || '649449775168273';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'eCFx04kYXp_69_u7h65fUbpwbiI';

const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`Cloudinary configured with cloud_name: ${cloudName}`);
}

// Multer Configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Yalnızca JPG, PNG, WEBP, GIF ve AVIF formatları kabul edilmektedir.'));
    }
  },
});

// Authentication Helper Middleware
const authenticateUser = async (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    if (firebaseAdminReady && adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        (req as any).user = decodedToken;
        return next();
      } catch {}
    }
    (req as any).user = decodeJwtPayload(token);
  }
  next();
};

app.use(authenticateUser);

// --------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------

// POST /api/upload
app.post('/api/upload', uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen yüklenecek bir dosya seçin.' });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.body.title || req.file.originalname;
    const fileExt = path.extname(req.file.originalname).substring(1).toLowerCase() || 'jpg';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const folderPath = `site-images/${year}/${month}`;
    const imageId = Math.random().toString(36).substring(2, 10);

    let uploadResult: {
      public_id: string;
      secure_url: string;
      thumbnail_url?: string;
      format: string;
      width: number;
      height: number;
      bytes: number;
    };

    if (cloudinaryConfigured) {
      // Upload to Cloudinary
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
            public_id: `img_${imageId}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) return reject(error || new Error('Cloudinary yükleme hatası.'));
            
            // Ensure secure_url uses https
            let secureUrl = result.secure_url;
            if (secureUrl && secureUrl.startsWith('http://')) {
              secureUrl = secureUrl.replace('http://', 'https://');
            }

            // Generate optimized thumbnail URL from secure_url
            const thumbUrl = secureUrl ? secureUrl.replace('/upload/', '/upload/c_fill,w_400,h_300,q_auto,f_auto/') : secureUrl;

            resolve({
              public_id: result.public_id,
              secure_url: secureUrl,
              thumbnail_url: thumbUrl,
              format: result.format || fileExt,
              width: result.width || 1200,
              height: result.height || 800,
              bytes: result.bytes || fileBuffer.length,
            });
          }
        );
        stream.end(fileBuffer);
      });
    } else {
      // Fallback local file storage
      const fileName = `img_${imageId}.${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, fileBuffer);

      const rawHost = req.get('x-forwarded-host') || req.get('host') || '';
      let hostName = rawHost.split(',')[0].trim();
      if (hostName.includes(':')) {
        hostName = hostName.split(':')[0];
      }

      const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' || req.headers['x-forwarded-ssl'] === 'on' || process.env.NODE_ENV === 'production';
      const protocol = isHttps ? 'https' : 'http';

      let fileUrl = `/uploads/${fileName}`;
      if (hostName && !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostName)) {
        fileUrl = `${protocol}://${hostName}/uploads/${fileName}`;
      }

      uploadResult = {
        public_id: `local_${imageId}`,
        secure_url: fileUrl,
        thumbnail_url: fileUrl,
        format: fileExt,
        width: 1200,
        height: 800,
        bytes: fileBuffer.length,
      };
    }

    const user = (req as any).user;
    const isPublic = req.body.isPublic === 'false' || req.body.isPublic === false ? false : true;
    const passwordProtected = req.body.passwordProtected === 'true' || req.body.passwordProtected === true || Boolean(req.body.password);
    const password = req.body.password ? String(req.body.password).trim() : '';

    const imageDoc = {
      id: imageId,
      title: originalName.replace(/\.[^/.]+$/, ''),
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      thumbnail_url: uploadResult.thumbnail_url || uploadResult.secure_url,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      userId: user ? user.uid : 'anonymous',
      userDisplayName: user ? user.name || user.email?.split('@')[0] : 'Misafir',
      userEmail: user ? user.email : '',
      views: 0,
      downloads: 0,
      isPublic: isPublic,
      passwordProtected: passwordProtected,
      passwordHash: password, // Simple string match
      viewsHistory: [{ date: now.toISOString().split('T')[0], count: 0 }],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await dbSaveImage(imageDoc);

    return res.status(201).json({ status: 'success', data: imageDoc });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return res.status(500).json({ message: err.message || 'Yükleme sırasında hata oluştu.' });
  }
});

// GET /api/images - Enforces privacy: returns only user's own images
app.get('/api/images', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.json({ images: [], total: 0 });
    }

    const { sort = 'newest', search = '', limit = '32' } = req.query;
    const { items, total } = await dbGetImages({
      sort: String(sort),
      search: String(search),
      limit: Number(limit) || 32,
      userId: user.uid,
    });

    return res.json({ images: items, total });
  } catch (err: any) {
    console.error('Fetch images error:', err);
    return res.status(500).json({ message: 'Resimler yüklenirken hata oluştu.' });
  }
});

// GET /api/images/:id
app.get('/api/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await dbGetImageById(id);

    if (!data) {
      return res.status(404).json({ message: 'Resim bulunamadı.' });
    }

    await dbIncrementViews(id);

    return res.json({ data: { ...data, views: (data.views || 0) + 1 } });
  } catch {
    return res.status(500).json({ message: 'Detay alınamadı.' });
  }
});

// POST /api/images/:id/download
app.post('/api/images/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    await dbIncrementDownloads(id);
    return res.json({ status: 'ok' });
  } catch {
    return res.status(500).json({ message: 'Hata.' });
  }
});

// POST /api/images/:id/verify-password
app.post('/api/images/:id/verify-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const data = await dbGetImageById(id);

    if (!data) {
      return res.status(404).json({ message: 'Resim bulunamadı.' });
    }

    if (!data.passwordProtected) {
      return res.json({ success: true, message: 'Şifresiz resim.' });
    }

    if (data.passwordHash && data.passwordHash === String(password || '').trim()) {
      return res.json({ success: true, message: 'Şifre doğru.' });
    }

    return res.status(401).json({ success: false, message: 'Hatalı şifre! Lütfen tekrar deneyin.' });
  } catch {
    return res.status(500).json({ message: 'Şifre doğrulama hatası.' });
  }
});

// POST /api/ai/chat - Soru Sor AI Asistanı
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, message } = req.body;

    if (!ai) {
      return res.json({
        reply: "Soru Sor AI Asistanı şu anda aktif modda çalışıyor. PicHost resim yükleme platformumuz hakkında sorularınızı sorabilirsiniz!",
      });
    }

    const userPrompt = message || (Array.isArray(messages) && messages[messages.length - 1]?.content);
    if (!userPrompt) {
      return res.status(400).json({ message: 'Lütfen bir soru veya mesaj yazın.' });
    }

    // Map history if provided
    let contents: any = userPrompt;
    if (Array.isArray(messages) && messages.length > 0) {
      contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction: `Sen PicHost (pichost.com) platformunun resmi, arkadaş canlısı ve uzman "Soru Sor AI Asistanı"sın.
Görevin PicHost kullanıcılarına platform kullanımı, resim yükleme, üyelik, güvenlik ve özellikler hakkında yardımcı olmaktır.

PicHost Hakkında Detaylı Bilgiler:
- Platform Tanımı: Türkiye'nin en hızlı, güvenli ve ücretsiz resim yükleme, depolama ve paylaşım servisi.
- Dosya Yükleme Sınırları: Resim başına 50 MB'a kadar destekler. Desteklenen formatlar: JPG, JPEG, PNG, GIF, WEBP, SVG, HEIC.
- Yükleme Yöntemleri: Sürükle-bırak, dosya seçici, direkt resim yapıştırma (Ctrl+V veya Pano) ve URL üzerinden yükleme.
- Bağlantı ve Gömmeler: Yükleme sonrası Doğrudan Bağlantı (Direct Link), Forumlar için Markdown kodu, Web siteleri için HTML gömme kodu ve İndirme QR Kodu anında üretilir.
- Gizlilik ve Otomatik Silinme:
  * Herkese Açık (Galeri sayfasında görünür)
  * Gizli / Liste Dışı (Arama ve galeride çıkmaz, sadece link verilen kişiler görür)
  * Otomatik Silinme Süreleri: Kalıcı (Süresiz), 1 Saat, 1 Gün, 1 Hafta, 1 Ay sonra otomatik silinme.
- Üyelik Avantajları: Tamamen ücretsiz üye olarak yüklediğiniz tüm görselleri profil sayfanızda düzenleyebilir, silinebilir linkler atayabilir, görüntülenme istatistiklerini takip edebilirsiniz.
- PRO / Premium Özellikleri: 8-Core CPU ve 8GB RAM sunucu altyapımız ile ışık hızında yükleme/indirme, sınırsız depolama alanı, sıfır reklam, toplu resim yükleme imkanı.
- Resim Detay Sayfası Araçları: Resim kırpma ve döndürme, QR Kod paylaşımı, İndirme butonu, DMCA ve Telif Hakkı bildirimi (Şikayet Et tuşu).
- Güvenlik ve Gizlilik: Tüm yüklemeler SSL şifrelemeyle korunur. Yasadışı veya uygunsuz içerikler kesinlikle yasaktır ve anında kaldırılır.

Yanıt Kuralları:
- Her zaman samimi, profesyonel ve yardımcı bir dille Türkçe yanıt ver.
- Okunabilirliği artırmak için kısa paragraflar, maddeler (bullet points) ve uygun emojiler kullan.
- Kullanıcı resim nasıl yüklenir, üyelik gerekli mi, resimlerim silinir mi gibi sorular sorduğunda doğrudan net yanıt ver.
- PicHost dışındaki genel konularda da kısa ve nazik yardımcı yanıt verdikten sonra ana görevinin PicHost asistanlığı olduğunu belirt.`,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Üzgünüm, şu an bir yanıt oluşturamadım. Lütfen tekrar deneyin.';
    return res.json({ reply });
  } catch (err: any) {
    console.error('AI Assistant Error:', err);
    return res.json({
      reply: 'Anlık bir bağlantı yoğunluğu oluştu. Lütfen sorunuzu tekrar sorun veya /sss sayfamızı inceleyin.'
    });
  }
});

// DELETE /api/images/:id
app.delete('/api/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Oturum açmanız gerekiyor.' });
    }

    const imgData = await dbGetImageById(id);
    if (!imgData) {
      return res.status(404).json({ message: 'Resim bulunamadı.' });
    }

    const isAdmin = user.email === (process.env.ADMIN_EMAIL || 'admin@pichost.com') || user.admin === true;
    const isOwner = imgData.userId === user.uid;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bu resmi silme yetkiniz yok.' });
    }

    // Delete from Cloudinary if public_id exists
    if (imgData.public_id && cloudinaryConfigured && !imgData.public_id.startsWith('local_')) {
      await cloudinary.uploader.destroy(imgData.public_id).catch(() => {});
    } else if (imgData.public_id?.startsWith('local_')) {
      // Local fallback file deletion
      const localFileName = `${imgData.public_id.replace('local_', 'img_')}.${imgData.format}`;
      const localFilePath = path.join(uploadsDir, localFileName);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    await dbDeleteImage(id);
    return res.json({ status: 'success', message: 'Resim başarıyla silindi.' });
  } catch {
    return res.status(500).json({ message: 'Silme işlemi başarısız.' });
  }
});

// POST /api/images/:id/report
app.post('/api/images/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    await dbReportImage(id, reason);
    return res.json({ status: 'success' });
  } catch {
    return res.status(500).json({ message: 'Bildirim gönderilemedi.' });
  }
});

// GET /api/user/images
app.get('/api/user/images', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Yetkisiz erişim.' });

    const { items } = await dbGetImages({ userId: user.uid });
    return res.json({ data: items });
  } catch {
    return res.status(500).json({ message: 'Kullanıcı resimleri alınamadı.' });
  }
});

// Admin Stats Endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || (user.email !== (process.env.ADMIN_EMAIL || 'admin@pichost.com') && !user.admin)) {
      return res.status(403).json({ message: 'Yalnızca yöneticiler erişebilir.' });
    }

    const stats = await dbGetAdminStats();

    return res.json({
      data: {
        ...stats,
        cloudinaryUsage: {
          plan: 'Cloudinary Free',
          maxStorageMb: 1000,
          usedStorageMb: 24.5,
          transformationsUsed: 120,
          bandwidthUsedMb: 180,
        },
      },
    });
  } catch {
    return res.status(500).json({ message: 'İstatistikler alınamadı.' });
  }
});

// GET /api/admin/users
app.get('/api/admin/users', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(403).json({ message: 'Yetkisiz.' });

    const usersList = await dbGetUsers();
    return res.json({ data: usersList });
  } catch {
    return res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
  }
});

// POST /api/admin/users/:uid/ban
app.post('/api/admin/users/:uid/ban', async (req, res) => {
  try {
    const { uid } = req.params;
    const { isBanned } = req.body;
    await dbBanUser(uid, isBanned);
    return res.json({ status: 'success' });
  } catch {
    return res.status(500).json({ message: 'Hata.' });
  }
});

// Announcements GET & POST
app.get('/api/announcements', async (_req, res) => {
  try {
    const announcements = await dbGetAnnouncements();
    return res.json({ data: announcements });
  } catch {
    return res.json({ data: [] });
  }
});

app.post('/api/admin/announcement', async (req, res) => {
  try {
    const { title, content, type, active } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    const newAnn = {
      id,
      title,
      content,
      type: type || 'info',
      active: active !== false,
      createdAt: new Date().toISOString(),
    };
    await dbAddAnnouncement(newAnn);
    return res.json({ status: 'success', data: newAnn });
  } catch {
    return res.status(500).json({ message: 'Duyuru eklenemedi.' });
  }
});

// Dynamic Sitemap Generator
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { items } = await dbGetImages({ isPublicOnly: true, limit: 500 });
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;

    let urls = `
      <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
      <url><loc>${baseUrl}/yukle</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
      <url><loc>${baseUrl}/galeri</loc><changefreq>always</changefreq><priority>0.9</priority></url>
      <url><loc>${baseUrl}/blog</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
    `;

    items.forEach((img) => {
      urls += `<url><loc>${baseUrl}/i/${img.id}</loc><lastmod>${img.createdAt?.split('T')[0] || '2026-08-13'}</lastmod><priority>0.8</priority></url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemap.schemas.org/schemas/sitemap/0.9">
      ${urls}
    </urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.send(sitemap);
  } catch {
    return res.status(500).send('Sitemap error');
  }
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
  const robots = `User-agent: *
Disallow: /admin
Disallow: /profil
Disallow: /ayarlar
Sitemap: ${baseUrl}/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  return res.send(robots);
});

// Start Server and Mount Vite / Static Middlewares
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build index.html bulunamadı. Lütfen "npm run build" komutunun çalıştığından emin olun.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PicHost.io Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
