import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AnnouncementBanner } from './components/AnnouncementBanner';

// Pages
import { Home } from './pages/Home';
import { UploadPage } from './pages/UploadPage';
import { Gallery } from './pages/Gallery';
import { ImageDetail } from './pages/ImageDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { SettingsPage } from './pages/Settings';
import { AdminPage } from './pages/Admin';
import {
  AboutPage,
  HelpPage,
  FaqPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  DmcaPage,
} from './pages/InfoPages';
import { Blog, BlogPost } from './pages/Blog';
import { Premium } from './pages/Premium';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white antialiased">
            <AnnouncementBanner />
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/yukle" element={<UploadPage />} />
                <Route path="/galeri" element={<Gallery />} />
                <Route path="/i/:id" element={<ImageDetail />} />
                <Route path="/resim/:id" element={<ImageDetail />} />
                <Route path="/giris" element={<Login />} />
                <Route path="/kayit" element={<Register />} />
                <Route path="/profil" element={<Profile />} />
                <Route path="/ayarlar" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* Info & Legal */}
                <Route path="/hakkimizda" element={<AboutPage />} />
                <Route path="/yardim" element={<HelpPage />} />
                <Route path="/sss" element={<FaqPage />} />
                <Route path="/iletisim" element={<ContactPage />} />
                <Route path="/gizlilik" element={<PrivacyPage />} />
                <Route path="/sartlar" element={<TermsPage />} />
                <Route path="/dmca" element={<DmcaPage />} />

                {/* Blog & Premium */}
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/premium" element={<Premium />} />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
