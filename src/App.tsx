import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PropertyDetails from './pages/PropertyDetails';
import RequestSystem from './pages/RequestSystem';
import AuthDash from './pages/AuthDash';
import About from './pages/About';
import { ThemeProvider } from './components/ThemeContext';
import { Building2, ShieldCheck, Mail, MapPin, Phone, HelpCircle } from 'lucide-react';
import { safeApiFetch } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // A global function to handle route changes and update browser History API
  const navigateTo = (tab: string, customPath?: string) => {
    let path = customPath;
    if (!path) {
      if (tab === 'home') path = '/';
      else if (tab === 'request-system') path = '/request-system';
      else if (tab === 'about') path = '/about';
      else if (tab === 'dashboard' || tab === 'login') {
        const currentUser = user;
        if (!currentUser) {
          path = '/login';
        } else {
          path = currentUser.role === 'owner' ? '/admin' : '/agency';
        }
      } else if (tab === 'property-details') {
        path = selectedPropertyId ? `/property/${selectedPropertyId}` : '/';
      }
    }

    if (path) {
      window.history.pushState(null, '', path);
    }

    if (tab === 'login' || tab === 'dashboard') {
      const currentUser = user;
      if (!currentUser) {
        setActiveTab('login');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setActiveTab(tab);
    }
  };

  // Check state on boot and identify exact routing conditions (real D1 database + JWT based)
  useEffect(() => {
    const checkSession = async () => {
      let loggedInUser = null;
      try {
        const res = await safeApiFetch('/api/auth/me');
        if (res.success && res.data?.user) {
          loggedInUser = res.data.user;
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('فشل في فحص مصادقة الحساب عبر السرفر.', err);
      } finally {
        const path = window.location.pathname;
        if (!loggedInUser) {
          if (path === '/admin' || path === '/agency' || path === '/dashboard') {
            window.history.replaceState(null, '', '/login');
            setActiveTab('login');
          } else if (path === '/login') {
            setActiveTab('login');
          } else if (path === '/request-system' || path === '/requests') {
            setActiveTab('request-system');
          } else if (path === '/about') {
            setActiveTab('about');
          } else if (path.startsWith('/property/')) {
            const id = parseInt(path.split('/').pop() || '');
            if (!isNaN(id)) {
              setSelectedPropertyId(id);
              setActiveTab('property-details');
            } else {
              setActiveTab('home');
            }
          } else {
            setActiveTab('home');
          }
        } else {
          if (path === '/login') {
            const nextPath = loggedInUser.role === 'owner' ? '/admin' : '/agency';
            window.history.replaceState(null, '', nextPath);
            setActiveTab('dashboard');
          } else if (path === '/admin') {
            if (loggedInUser.role !== 'owner') {
              window.history.replaceState(null, '', '/login');
              setActiveTab('login');
            } else {
              setActiveTab('dashboard');
            }
          } else if (path === '/agency') {
            if (loggedInUser.role !== 'agency') {
              window.history.replaceState(null, '', '/login');
              setActiveTab('login');
            } else {
              setActiveTab('dashboard');
            }
          } else if (path === '/dashboard') {
            setActiveTab('dashboard');
          } else if (path === '/request-system' || path === '/requests') {
            setActiveTab('request-system');
          } else if (path === '/about') {
            setActiveTab('about');
          } else if (path.startsWith('/property/')) {
            const id = parseInt(path.split('/').pop() || '');
            if (!isNaN(id)) {
              setSelectedPropertyId(id);
              setActiveTab('property-details');
            } else {
              setActiveTab('home');
            }
          } else {
            setActiveTab('home');
          }
        }
        setInitialized(true);
      }
    };

    checkSession();
  }, []);

  // Listen to popstate browser changes
  useEffect(() => {
    if (!initialized) return;

    const handleNavigation = async () => {
      const path = window.location.pathname;
      let currentUser = null;
      try {
        const res = await safeApiFetch('/api/auth/me');
        if (res.success && res.data?.user) {
          currentUser = res.data.user;
          setUser(res.data.user);
        }
      } catch (err) {
        console.error(err);
      }

      if (!currentUser) {
        if (path === '/admin' || path === '/agency' || path === '/dashboard') {
          window.history.replaceState(null, '', '/login');
          setActiveTab('login');
        } else if (path === '/login') {
          setActiveTab('login');
        } else if (path === '/request-system' || path === '/requests') {
          setActiveTab('request-system');
        } else if (path === '/about') {
          setActiveTab('about');
        } else if (path.startsWith('/property/')) {
          const id = parseInt(path.split('/').pop() || '');
          if (!isNaN(id)) {
            setSelectedPropertyId(id);
            setActiveTab('property-details');
          } else {
            setActiveTab('home');
          }
        } else {
          setActiveTab('home');
        }
      } else {
        if (path === '/login') {
          const nextPath = currentUser.role === 'owner' ? '/admin' : '/agency';
          window.history.replaceState(null, '', nextPath);
          setActiveTab('dashboard');
        } else if (path === '/admin') {
          if (currentUser.role !== 'owner') {
            window.history.replaceState(null, '', '/login');
            setActiveTab('login');
          } else {
            setActiveTab('dashboard');
          }
        } else if (path === '/agency') {
          if (currentUser.role !== 'agency') {
            window.history.replaceState(null, '', '/login');
            setActiveTab('login');
          } else {
            setActiveTab('dashboard');
          }
        } else if (path === '/dashboard') {
          setActiveTab('dashboard');
        } else if (path === '/request-system' || path === '/requests') {
          setActiveTab('request-system');
        } else if (path === '/about') {
          setActiveTab('about');
        } else if (path.startsWith('/property/')) {
          const id = parseInt(path.split('/').pop() || '');
          if (!isNaN(id)) {
            setSelectedPropertyId(id);
            setActiveTab('property-details');
          } else {
            setActiveTab('home');
          }
        } else {
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [initialized, user]);

  const handleLogout = async () => {
    try {
      await safeApiFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.history.pushState(null, '', '/');
      setActiveTab('home');
      setSelectedPropertyId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    const nextPath = loggedInUser.role === 'owner' ? '/admin' : '/agency';
    window.history.replaceState(null, '', nextPath);
    setActiveTab('dashboard');
  };

  const handleSelectProperty = (id: number) => {
    setSelectedPropertyId(id);
    window.history.pushState(null, '', `/property/${id}`);
    setActiveTab('property-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#ebd7a7] text-sm font-semibold">
        <div className="text-center space-y-3">
          <Building2 className="w-12 h-12 text-[#c5a059] mx-auto animate-bounce" />
          <p>جاري تحميل المنصة العقارية الأرقى بالعراق...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        
        {/* Navigation Head */}
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          activeTab={activeTab === 'login' ? 'dashboard' : activeTab} 
          setActiveTab={(tab) => navigateTo(tab)} 
        />

        {/* Primary Page Canvas */}
        <main className="flex-grow transition-colors duration-200">
          {activeTab === 'home' && (
            <Home 
              onSelectProperty={handleSelectProperty} 
              setActiveTab={(tab) => navigateTo(tab)} 
            />
          )}

          {activeTab === 'property-details' && selectedPropertyId !== null && (
            <PropertyDetails 
              propertyId={selectedPropertyId} 
              onBack={() => {
                navigateTo('home');
                setSelectedPropertyId(null);
              }} 
              onSelectProperty={handleSelectProperty}
            />
          )}

          {activeTab === 'request-system' && (
            <RequestSystem 
              setActiveTab={(tab) => navigateTo(tab)} 
            />
          )}

          {activeTab === 'about' && (
            <About />
          )}

          {(activeTab === 'dashboard' || activeTab === 'login') && (
            <AuthDash 
              user={user} 
              onLoginSuccess={handleLoginSuccess} 
              setActiveTab={(tab) => navigateTo(tab)}
            />
          )}
        </main>

        {/* Premium Platform Footer in Arabic */}
        <footer className="bg-gray-950 text-gray-400 border-t border-gray-900 border-opacity-65 py-12 md:py-16 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              
              {/* Co. Profile */}
              <div className="space-y-4 md:col-span-2 text-right">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#c5a059] flex items-center justify-center text-gray-950 font-black">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-base block">المنصة العقارية - Estate Podium</span>
                    <span className="text-[10px] text-[#c5a059] tracking-wide font-medium block">الممتلكات الفاخرة المعتمدة ببقرص</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed font-light">
                  المنتدى المرجعي والمنصة الأوسع للبحث وعنوعنة الممتلكات والفلل والشقق والأراضي التجارية بجميع مدن العراق. بيئة تواصل موثوقة ومثالية للمشترين والمستثمرين والوكلاء الفاعلين.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#ebd7a7] pt-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#c5a059]" />
                  <span>جميع البيانات والنشاطات مفحوصة ومؤمنة بالكامل في العراق.</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-4 text-right">
                <h4 className="text-white text-sm font-bold">أقسام المنصة السريعة</h4>
                <ul className="space-y-2.5 text-xs">
                  <li>
                    <button onClick={() => { navigateTo('home'); setSelectedPropertyId(null); }} className="hover:text-white transition-colors cursor-pointer text-right">
                      تصفح الفلل والشقق المعروضة
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { navigateTo('request-system'); setSelectedPropertyId(null); }} className="hover:text-white transition-colors cursor-pointer text-right">
                      طلب ممتلك خاص (إرسال للمكاتب)
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { navigateTo('dashboard'); setSelectedPropertyId(null); }} className="hover:text-white transition-colors cursor-pointer text-right">
                      بوابة الشركاء وملاك المكاتب
                    </button>
                  </li>
                </ul>
              </div>

              {/* Support & Contacts */}
              <div className="space-y-4 text-right">
                <h4 className="text-white text-sm font-bold">إسناد وتواصل</h4>
                <ul className="space-y-2.5 text-xs text-gray-500 font-light">
                  <li className="flex items-center gap-2 justify-end">
                    <span>بغداد، الكرادة، عمارة الجادرية</span>
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </li>
                  <li className="flex items-center gap-2 justify-end">
                    <span dir="ltr">+964 770 123 4567</span>
                    <Phone className="w-4 h-4 text-gray-600" />
                  </li>
                  <li className="flex items-center gap-2 justify-end">
                    <span>support@estate-podium.com</span>
                    <Mail className="w-4 h-4 text-gray-600" />
                  </li>
                </ul>
              </div>

            </div>

            <div className="border-t border-gray-900 pt-8 mt-10 text-center text-[11px] text-gray-600">
              © {new Date().getFullYear()} المنصة العقارية - Estate Podium. كافة الحقوق محفوظة قانونياً للمطور وللمكاتب العقارية المعتمدة لدى جمهورية العراق.
            </div>
          </div>
        </footer>

      </div>
    </ThemeProvider>
  );
}
