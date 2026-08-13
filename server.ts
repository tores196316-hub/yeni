import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp as initAdminApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

dotenv.config();

// Initialize Express App
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 10;

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

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Upload sınırı aşıldı. Lütfen daha sonra tekrar deneyin.' },
});

app.use('/api/', generalLimiter);

// Firebase Admin Setup
const dbId = firebaseConfig.firestoreDatabaseId;
if (!getApps().length) {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    initAdminApp({
      credential: cert({
        projectId: firebaseConfig.projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    initAdminApp({
      projectId: firebaseConfig.projectId,
    });
  }
}

const adminDb = (dbId && dbId !== '(default)')
  ? getFirestore(dbId)
  : getFirestore();
const adminAuth = getAuth();

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
  });
  console.log(`Cloudinary configured with cloud_name: ${cloudName}`);
}

// Local Uploads Directory fallback
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ];
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
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      (req as any).user = decodedToken;
    } catch {
      // invalid token
    }
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
            const thumb = cloudinary.url(result.public_id, {
              width: 400,
              height: 300,
              crop: 'fill',
              secure: true,
            });
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              thumbnail_url: thumb,
              format: result.format || fileExt,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
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

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const fileUrl = `${protocol}://${host}/uploads/${fileName}`;

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
      isPublic: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await adminDb.collection('images').doc(imageId).set(imageDoc);

    return res.status(201).json({ status: 'success', data: imageDoc });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return res.status(500).json({ message: err.message || 'Yükleme sırasında hata oluştu.' });
  }
});

// GET /api/images
app.get('/api/images', async (req, res) => {
  try {
    const { sort = 'newest', search = '', limit = '32' } = req.query;
    let query: FirebaseFirestore.Query = adminDb.collection('images').where('isPublic', '==', true);

    const snapshot = await query.get();
    let items: any[] = [];
    snapshot.forEach((doc) => items.push(doc.data()));

    // Search filter
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      items = items.filter((img) => img.title?.toLowerCase().includes(q));
    }

    // Sorting
    if (sort === 'views') {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'downloads') {
      items.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else {
      // newest
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const limitNum = Number(limit) || 32;
    const paginated = items.slice(0, limitNum);

    return res.json({ images: paginated, total: items.length });
  } catch (err: any) {
    console.error('Fetch images error:', err);
    return res.status(500).json({ message: 'Resimler yüklenirken hata oluştu.' });
  }
});

// GET /api/images/:id
app.get('/api/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = adminDb.collection('images').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ message: 'Resim bulunamadı.' });
    }

    const data = snap.data();
    // Increment view count in firestore
    await docRef.update({ views: (data?.views || 0) + 1 });

    return res.json({ data: { ...data, views: (data?.views || 0) + 1 } });
  } catch (err: any) {
    return res.status(500).json({ message: 'Detay alınamadı.' });
  }
});

// POST /api/images/:id/download
app.post('/api/images/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = adminDb.collection('images').doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update({ downloads: (snap.data()?.downloads || 0) + 1 });
    }
    return res.json({ status: 'ok' });
  } catch {
    return res.status(500).json({ message: 'Hata.' });
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

    const docRef = adminDb.collection('images').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ message: 'Resim bulunamadı.' });
    }

    const imgData = snap.data();
    const isAdmin = user.email === 'admin@pichost.com' || user.admin === true;
    const isOwner = imgData?.userId === user.uid;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bu resmi silme yetkiniz yok.' });
    }

    // Delete from Cloudinary if public_id exists
    if (imgData?.public_id && cloudinaryConfigured && !imgData.public_id.startsWith('local_')) {
      await cloudinary.uploader.destroy(imgData.public_id).catch(() => {});
    } else if (imgData?.public_id?.startsWith('local_')) {
      // Local fallback file deletion
      const localFileName = `${imgData.public_id.replace('local_', 'img_')}.${imgData.format}`;
      const localFilePath = path.join(uploadsDir, localFileName);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    await docRef.delete();
    return res.json({ status: 'success', message: 'Resim başarıyla silindi.' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Silme işlemi başarısız.' });
  }
});

// POST /api/images/:id/report
app.post('/api/images/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reportId = Math.random().toString(36).substring(2, 9);

    await adminDb.collection('reports').doc(reportId).set({
      id: reportId,
      imageId: id,
      reason: reason || 'Neden belirtilmedi',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    await adminDb.collection('images').doc(id).update({ isReported: true, reportReason: reason });
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

    const snap = await adminDb.collection('images').where('userId', '==', user.uid).get();
    const images: any[] = [];
    snap.forEach((doc) => images.push(doc.data()));

    images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ data: images });
  } catch {
    return res.status(500).json({ message: 'Kullanıcı resimleri alınamadı.' });
  }
});

// Admin Stats Endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || (user.email !== 'admin@pichost.com' && !user.admin)) {
      return res.status(403).json({ message: 'Yalnızca yöneticiler erişebilir.' });
    }

    const imagesSnap = await adminDb.collection('images').get();
    const usersSnap = await adminDb.collection('users').get();

    let totalViews = 0;
    let totalDownloads = 0;
    let todayUploads = 0;
    let todayUsers = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    const recentUploads: any[] = [];
    imagesSnap.forEach((doc) => {
      const data = doc.data();
      totalViews += data.views || 0;
      totalDownloads += data.downloads || 0;
      if (data.createdAt?.startsWith(todayStr)) todayUploads++;
      recentUploads.push(data);
    });

    const recentUsers: any[] = [];
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt?.startsWith(todayStr)) todayUsers++;
      recentUsers.push(data);
    });

    recentUploads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      data: {
        totalUsers: usersSnap.size,
        totalImages: imagesSnap.size,
        todayUploads,
        todayUsers,
        totalViews,
        totalDownloads,
        cloudinaryUsage: {
          plan: 'Cloudinary Free',
          maxStorageMb: 1000,
          usedStorageMb: 24.5,
          transformationsUsed: 120,
          bandwidthUsedMb: 180,
        },
        recentUploads: recentUploads.slice(0, 10),
        recentUsers: recentUsers.slice(0, 10),
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

    const snap = await adminDb.collection('users').get();
    const usersList: any[] = [];
    snap.forEach((doc) => usersList.push(doc.data()));

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
    await adminDb.collection('users').doc(uid).update({ isBanned: Boolean(isBanned) });
    return res.json({ status: 'success' });
  } catch {
    return res.status(500).json({ message: 'Hata.' });
  }
});

// Announcements GET & POST
app.get('/api/announcements', async (_req, res) => {
  try {
    const snap = await adminDb.collection('announcements').where('active', '==', true).get();
    const announcements: any[] = [];
    snap.forEach((doc) => announcements.push(doc.data()));
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
    await adminDb.collection('announcements').doc(id).set(newAnn);
    return res.json({ status: 'success', data: newAnn });
  } catch {
    return res.status(500).json({ message: 'Duyuru eklenemedi.' });
  }
});

// Dynamic Sitemap Generator
app.get('/sitemap.xml', async (req, res) => {
  try {
    const snap = await adminDb.collection('images').where('isPublic', '==', true).limit(500).get();
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;

    let urls = `
      <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
      <url><loc>${baseUrl}/yukle</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
      <url><loc>${baseUrl}/galeri</loc><changefreq>always</changefreq><priority>0.9</priority></url>
      <url><loc>${baseUrl}/blog</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
    `;

    snap.forEach((doc) => {
      const img = doc.data();
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PicHost.io Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
