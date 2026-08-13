import React, { useEffect } from 'react';
import { Mail, HelpCircle, ShieldCheck, FileText, Info, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Hakkımızda — PicHost.io';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Hakkımızda</h1>
          <p className="text-sm text-slate-400">PicHost.io görsel hosting ve bulut paylaşım altyapısı.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 text-slate-300 leading-relaxed text-sm">
        <p>
          PicHost.io, bireysel kullanıcıların ve dijital içerik üreticilerinin görsellerini yüksek performans, sıfır veri kaybı ve maksimum hız ile internet ortamında paylaşabilmesi amacıyla geliştirilmiş profesyonel bir resim hosting platformudur.
        </p>
        <p>
          Küresel CDN ağımız (Cloudinary) ve esnek veritabanı altyapımız (Firebase Firestore) sayesinde yüklenen resimler milisaniyeler içinde optimize edilir ve kesintisiz sunulur.
        </p>
      </div>
    </div>
  );
};

export const HelpPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Yardım Merkezi — PicHost.io';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Yardım Merkezi</h1>
          <p className="text-sm text-slate-400">Sık karşılaşılan sorular ve kullanım rehberi.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 text-slate-300 text-sm">
        <h3 className="font-bold text-white text-base">Resim yüklerken nelere dikkat etmeliyim?</h3>
        <p>Maksimum dosya boyutu 10 MB'tır. Desteklenen formatlar: JPG, JPEG, PNG, WEBP, GIF ve AVIF.</p>

        <h3 className="font-bold text-white text-base pt-4 border-t border-slate-800">
          Resimler ne kadar süre saklanır?
        </h3>
        <p>Telif hakkı veya kullanım şartları ihlali bulunmayan tüm resimler kalıcı olarak saklanır.</p>
      </div>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Sıkça Sorulan Sorular — PicHost.io';
  }, []);

  const faqs = [
    {
      q: 'Üye olmadan resim yükleyebilir miyim?',
      a: 'Evet, üye olmadan da hızlıca resim yükleyebilir ve doğrudan erişim bağlantılarını alabilirsiniz.',
    },
    {
      q: 'Forumlara resim eklemek için hangi kodu kullanmalıyım?',
      a: 'Resim yükleme sonrası sağlanan "BBCode" alanındaki bağlantıyı doğrudan forum mesajınıza yapıştırabilirsiniz.',
    },
    {
      q: 'Resmimi nasıl silebilirim?',
      a: 'Üye girişi yaparak yüklediğiniz resimleri Profilim sayfasından dilediğiniz an tek tıkla silebilirsiniz.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-black text-white">Sıkça Sorulan Sorular</h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
            <h3 className="font-bold text-white text-base">{faq.q}</h3>
            <p className="text-sm text-slate-400">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  useEffect(() => {
    document.title = 'İletişim — PicHost.io';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Mesajınız başarıyla iletildi. En kısa sürede dönüş yapacağız.', 'success');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Bize Ulaşın</h1>
          <p className="text-sm text-slate-400">Görüş, öneri ve destek talepleriniz için form doldurun.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Adınız Soyadınız</label>
          <input
            type="text"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">E-posta Adresiniz</label>
          <input
            type="email"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Mesajınız</label>
          <textarea
            rows={4}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Mesajı Gönder</span>
        </button>
      </form>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Gizlilik Politikası — PicHost.io';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-black text-white">Gizlilik Politikası</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 text-slate-300 text-sm leading-relaxed">
        <p>PicHost.io kullanıcı verilerinin gizliliğine ve güvenliğine en üst düzeyde önem verir.</p>
        <p>Platformumuzda hesap oluştururken sağladığınız e-posta adresleri ve yüklediğiniz görseller üçüncü şahıslarla asla paylaşılmaz.</p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Kullanım Şartları — PicHost.io';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-black text-white">Kullanım Şartları</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 text-slate-300 text-sm leading-relaxed">
        <p>PicHost.io servislerini kullanarak aşağıdaki kurallara uyacağınızı kabul edersiniz:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Yasalara aykırı, şiddet içeren veya telif hakkı ihlali barındıran içerikler yüklenemez.</li>
          <li>Kural ihlali tespit edilen içerikler derhal kaldırılır ve ilgili hesap askıya alınabilir.</li>
        </ul>
      </div>
    </div>
  );
};

export const DmcaPage: React.FC = () => {
  useEffect(() => {
    document.title = 'DMCA Bildirimi — PicHost.io';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-black text-white">DMCA / Telif Bildirimi</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 text-slate-300 text-sm leading-relaxed">
        <p>Telif hakkı sahibi olduğunuz bir görselin platformumuzda izinsiz paylaşıldığını düşünüyorsanız, resmi DMCA ihlal bildiriminiz için resim detay sayfasındaki "Bildir" butonunu kullanabilir veya dmca@pichost.com adresinden bizimle iletişime geçebilirsiniz.</p>
      </div>
    </div>
  );
};
