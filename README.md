# 🚀 PicHost.io — Full-Stack Profesyonel Görsel Yükleme ve Paylaşım Platformu

PicHost.io, kullanıcıların görsellerini hızlı, güvenli ve yüksek performans ile yükleyebildiği, yönetebildiği ve paylaşım kodlarını (Direct URL, Page URL, Markdown, BBCode, HTML, QR Kod) alabildiği production-ready bir resim hosting platformudur.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

### Frontend
- **React 19** + **TypeScript**
- **Vite** (Geliştirme ve Derleme)
- **Tailwind CSS v4**
- **React Router DOM v7** (Ayrı route yapılandırması)
- **Framer Motion** (Mikro etkileşimler)
- **Lucide React** (Modern simgeler)
- **QRCode.react** (Dinamik QR kod üretimi)

### Backend
- **Node.js** & **Express.js** (TypeScript)
- **Firebase Firestore** (Gerçek Veritabanı)
- **Firebase Authentication** (E-posta/Şifre & Google Girişi)
- **Cloudinary SDK** (Gerçek CDN Görsel Depolama)
- **Multer** (Dosya yükleme & MIME tipi/uzantı doğrulaması)
- **Helmet, CORS & Express Rate Limit** (Güvenlik Katmanı)

---

## 🔑 Environment Variables (.env)

Aşağıdaki değişkenleri `.env` veya Railway Environment Paneline ekleyin:

```env
PORT=3000
BASE_URL="https://pichost.up.railway.app"

# Cloudinary Gerçek Entegrasyonu
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Dosya Yükleme Limitleri
MAX_FILE_SIZE_MB=10

# Admin E-posta Tanımlaması
ADMIN_EMAIL="admin@pichost.com"

# Firebase Yapılandırması
FIREBASE_PROJECT_ID="gen-lang-client-0179187692"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
```

---

## 📂 Proje Sayfaları ve Yönlendirmeleri (Routes)

- `/` — Ana Sayfa (Hero, Tanıtım, Özellikler, 3 Adımda Paylaşım, Son Yüklemeler)
- `/yukle` — Resim Yükleme Sayfası (Drag & Drop, Dosya Seçme, Ctrl+V Pano Yapıştırma, Gerçek Progress %0-%100, Paylaşım Kodları)
- `/galeri` — Genel Görsel Galerisi (Filtreleme: En Yeni, En Çok Görüntülenen, En Çok İndirilen, Arama)
- `/i/:id` — Görsel Detay Sayfası (Tam Boyut Görsel, Detaylı Metrikler, Gerçek İndirme Sayacı, QR Kod, DMCA Bildirimi)
- `/giris` — Kullanıcı Girişi (E-posta & Google)
- `/kayit` — Kullanıcı Kaydı
- `/profil` — Kullanıcı Profili (Kullanıcı istatistikleri ve yüklediği resimleri silme yetkisi)
- `/ayarlar` — Profil ve Hesap Ayarları
- `/admin` — Yönetici Kontrol Paneli (İstatistikler, Kullanıcı Engelleme/Ban, Resim Silme, Sistem Duyurusu Yayınlama)
- `/blog` & `/blog/:slug` — Görsel Teknolojileri Blogu
- `/premium` — Premium Üyelik Karşılaştırma Sayfası
- `/hakkimizda`, `/yardim`, `/sss`, `/iletisim`, `/gizlilik`, `/sartlar`, `/dmca` — Kurumsal & Yasal Sayfalar

---

## 🚂 Railway Deployment Kurulum Talimatları

1. Projeyi GitHub reponuza push edin.
2. [Railway.app](https://railway.app) üzerinde yeni bir proje oluşturun ve reponuzu bağlayın.
3. **Variables** sekmesinde `.env.example` içerisindeki tüm değişkenleri tanımlayın.
4. Build komutu varsayılan olarak `npm run build` ve start komutu `npm start` olarak çalışacaktır:
   - Build: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
   - Start: `node dist/server.cjs`
5. Deploy işlemi tamamlandığında Railway size verilen `https://xxx.up.railway.app` URL'sini canlıya alacaktır.

---

## 🛡️ Admin Yetkisi Oluşturma

Bir kullanıcı hesabına admin yetkisi vermek için:
1. `ADMIN_EMAIL` değişkenini `.env` içerisinde belirleyin (örn: `admin@pichost.com`).
2. Bu e-posta adresi ile giriş yapılan tüm hesaplar otomatik olarak Yönetici Paneline (`/admin`) tam erişim sağlar.
3. Alternatif olarak Firestore `users/{uid}` belgesindeki `role` alanını `"admin"` olarak güncelleyebilirsiniz.
