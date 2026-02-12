
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
      <img src="/assets/images/logo.png" alt="AnyReps Loader" className="w-20 h-20 object-contain animate-pulse" />
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

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for OAuth callback params
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const authStatus = urlParams.get('auth');

      if (token && authStatus === 'success') {
        console.log("OAuth Success: Setting token");
        api.setToken(token);
        // Clean URL immediately
        window.history.replaceState({}, document.title, '/');
      }

      // 2. Validate Token (whether from OAuth or LocalStorage)
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
          setIsAuthOpen(false);
        } catch (err) {
          console.error("Auth Validation Failed:", err);
          api.logout();
          setIsAuthOpen(true);
        }
      } else {
        setIsAuthOpen(false); // Do not force open immediately
      }
      setSessionLoading(false);
    };

    initAuth();
  }, []);

  // DELAYED LOGIN POPUP
  useEffect(() => {
    // Only start timer if app is ready and not loading session
    if (appReady && !sessionLoading && !user && !api.isLoggedIn()) {
      const timer = setTimeout(() => {
        setIsAuthOpen(true);
      }, 10000); // 10 seconds delay after loader screen
      return () => clearTimeout(timer);
    }
  }, [user, appReady, sessionLoading]);

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
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#050505]">
          <Navbar user={user} onLoginClick={() => setIsAuthOpen(true)} onLogout={handleLogout} />
          <main className="flex-1 overflow-y-auto scroll-smooth relative no-scrollbar bg-[#050505]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Home />} />
              <Route path="/calculator" element={<ShippingCalculator />} />
              <Route path="/converter" element={<LinkConverter />} />
              <Route path="/search" element={<Search user={user} />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/qc" element={<QCPhotos />} />
              <Route path="/community/*" element={<Community user={user} />} />
              <Route path="/sellers" element={<Sellers user={user} />} />
              <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/" />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/admin" element={user?.rank === Rank.ADMIN ? <Admin /> : <Navigate to="/" replace />} />
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
