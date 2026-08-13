import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';

export const blogPosts = [
  {
    slug: 'webp-ve-avif-formatlari-neden-tercih-edilmeli',
    title: 'WebP ve AVIF Formatları Neden Tercih Edilmeli?',
    excerpt: 'Modern web standartlarında görsellerinizin hızını ve kalitesini yükselten WebP ve AVIF teknolojilerinin avantajları.',
    date: '2026-08-10',
    readTime: '4 dk',
    content: `WebP ve AVIF, geleneksel JPEG ve PNG formatlarına kıyasla çok daha yüksek sıkıştırma oranları sunan yeni nesil görsel formatlarıdır.

1. Yüksek Sıkıştırma Verimliliği: WebP, görsel kalitesinden ödün vermeden dosya boyutlarını %30 ila %50 oranında küçültebilir.
2. Sayfa Yükleme Hızı (Core Web Vitals): Daha küçük görsel boyutları doğrudan Google SEO skorlarınızı olumlu etkiler.
3. Şeffaflık ve Animasyon Desteği: WebP hem PNG gibi şeffaflığı hem de GIF gibi hareketli görselleri destekler.

PicHost.io üzerinde yüklediğiniz tüm görseller otomatik olarak bu modern format standartlarında optimize edilmektedir.`,
  },
  {
    slug: 'gorsel-seo-optimizasyonu-rehberi',
    title: 'Arama Motorları İçin Görsel SEO Optimizasyonu Rehberi',
    excerpt: 'Web sitenizdeki görsellerin Google Arama ve Görseller sonuçlarında üst sıralarda yer alması için altın kurallar.',
    date: '2026-08-05',
    readTime: '6 dk',
    content: `Görsel SEO, arama motorlarının web sitenizdeki resimleri doğru anlamlandırması ve indekslemesi sürecidir.

- Anlamlı Dosya Adları Kullanın: photo123.jpg yerine red-shoes.jpg gibi tanımlayıcı isimler tercih edin.
- Doğru Alt Etiketi (Alt Text): Görselin ne içerdiğini açıklayan kısa cümleler ekleyin.
- Hızlı CDN Servisleri Tercih Edin: Görsellerin kesintisiz sunumu kullanıcı deneyimini zirveye çıkarır.`,
  },
];

export const Blog: React.FC = () => {
  useEffect(() => {
    document.title = 'Teknoloji ve Görsel Rehberi Blogu — PicHost.io';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">PicHost Blog</h1>
          <p className="text-sm text-slate-400">Görsel teknolojileri, SEO ve performans rehberleri.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blogPosts.map((post) => (
          <article
            key={post.slug}
            className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-lg hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>{new Date(post.date).toLocaleDateString('tr-TR')}</span>
                <span>•</span>
                <span>{post.readTime} okuma</span>
              </div>
              <h2 className="text-xl font-bold text-white hover:text-sky-400 transition-colors">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">{post.excerpt}</p>
            </div>

            <Link
              to={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 pt-2"
            >
              <span>Devamını Oku</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — PicHost Blog`;
    }
  }, [post]);

  if (!post) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-slate-400">Yazı bulunamadı.</p>
        <Link to="/blog" className="text-sky-400 font-bold">
          Bloga Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link to="/blog" className="inline-flex items-center gap-1 text-xs font-bold text-sky-400">
        <ArrowLeft className="w-4 h-4" />
        <span>Tüm Yazılara Dön</span>
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>{new Date(post.date).toLocaleDateString('tr-TR')}</span>
          <span>•</span>
          <span>{post.readTime} okuma</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{post.title}</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 text-slate-300 text-sm leading-relaxed whitespace-pre-line">
        {post.content}
      </div>
    </div>
  );
};
