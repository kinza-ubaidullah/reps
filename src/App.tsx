
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Layout/Navbar';
import { ChatWidget } from './components/Chat/ChatWidget';
import { ShippingCalculator } from './pages/ShippingCalculator';
import { LinkConverter } from './pages/LinkConverter';
import { Search } from './pages/Search';
import { Tracking } from './pages/Tracking';
import { QCPhotos } from './pages/QCPhotos';
import { Home } from './pages/Home';
import { Community } from './pages/Community';
import { Sellers } from './pages/Sellers';
import { Profile } from './pages/Profile';
import { Wishlist } from './pages/Wishlist';
import { Admin } from './pages/Admin';
import { AuthModal } from './components/Auth/AuthModal';
import { User, Rank } from './types';
import { api } from './services/apiClient';
import { WishlistProvider } from './context/WishlistContext';
import { Loader2 } from 'lucide-react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== '/products') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
};

const Preloader = () => (
  <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center">
    <div className="relative">
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
        <path d="M20 28H80" stroke="#D98E04" strokeWidth="8" strokeLinecap="round" />
        <path d="M35 28L25 85" stroke="#D98E04" strokeWidth="8" strokeLinecap="round" />
        <path d="M65 28L75 85" stroke="#D98E04" strokeWidth="8" strokeLinecap="round" />
        <path d="M30 55H70" stroke="#D98E04" strokeWidth="8" strokeLinecap="round" />
        <path d="M72 18C78 18 82 22 78 30C74 38 65 42 50 42" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 42C35 42 22 46 22 56C22 66 32 72 50 72" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 72C68 72 74 82 70 92" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
        <circle cx="75" cy="20" r="2" fill="#EAB308" />
      </svg>
      <div className="absolute -inset-8 border-2 border-primary/20 rounded-full"></div>
      <div className="absolute -inset-8 border-t-2 border-primary rounded-full animate-spin"></div>
    </div>
    <div className="mt-8 flex flex-col items-center gap-2">
      <h2 className="text-2xl font-bold text-white tracking-widest">ANY<span className="text-primary">REPS</span></h2>
      <div className="flex items-center gap-2 text-[#666] text-xs font-bold uppercase tracking-wider">
        <Loader2 size={12} className="animate-spin" />
        Authenticating Pulse...
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const authStatus = urlParams.get('auth');

    if (token && authStatus === 'success') {
      api.setToken(token);
      // Fetch user data
      api.get('/auth/me')
        .then((userData) => {
          setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar_url,
            banner: userData.banner_url,
            rank: userData.rank as Rank,
            reputation: userData.reputation,
            joinDate: userData.created_at,
            description: userData.description
          });
          setIsAuthOpen(false);
          setSessionLoading(false);
          // Clean URL
          window.history.replaceState({}, document.title, '/');
        })
        .catch((err) => {
          console.error('OAuth callback error:', err);
          api.logout();
          setIsAuthOpen(true);
          setSessionLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (api.isLoggedIn()) {
        try {
          const userData = await api.get('/auth/me');
          setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar_url,
            banner: userData.banner_url,
            rank: userData.rank as Rank,
            reputation: userData.reputation,
            joinDate: userData.created_at,
            description: userData.description
          });
        } catch (err) {
          api.logout();
          setIsAuthOpen(true);
        }
      } else {
        setIsAuthOpen(true);
      }
      setSessionLoading(false);
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAuthOpen(true);
    window.location.hash = '/';
  };

  const handleLogin = (userData: any) => {
    setUser({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar_url,
      banner: userData.banner_url,
      rank: userData.rank as Rank,
      reputation: userData.reputation,
      joinDate: userData.created_at,
      description: userData.description
    });
    setIsAuthOpen(false);
  };

  if (!appReady || (sessionLoading && !user && api.isLoggedIn())) {
    return <Preloader />;
  }

  return (
    <WishlistProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-white font-sans">
        <ScrollToTop />
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-700 ${!user ? 'blur-2xl scale-110' : 'blur-0 scale-100'}`}>
          <Navbar user={user} onLoginClick={() => setIsAuthOpen(true)} onLogout={handleLogout} />
          <main className="flex-1 overflow-y-auto scroll-smooth relative no-scrollbar bg-[#050505]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Home />} />
              <Route path="/calculator" element={<ShippingCalculator />} />
              <Route path="/converter" element={<LinkConverter />} />
              <Route path="/search" element={<Search />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/qc" element={<QCPhotos />} />
              <Route path="/community/*" element={<Community />} />
              <Route path="/sellers" element={<Sellers />} />
              <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/" />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ChatWidget user={user} onLoginRequest={() => setIsAuthOpen(true)} />
        </div>
        {(isAuthOpen || !user) && (
          <AuthModal
            onClose={() => !user ? null : setIsAuthOpen(false)}
            onLogin={handleLogin}
            isForced={!user}
          />
        )}
      </div>
    </WishlistProvider>
  );
};

export default App;
