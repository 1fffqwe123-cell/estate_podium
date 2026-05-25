import React from 'react';
import { useTheme } from './ThemeContext';
import { Sun, Moon, LogOut, LayoutDashboard, PlusCircle, Building2, HelpCircle } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ user, onLogout, activeTab, setActiveTab }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-200 premium-blur-card border-b border-opacity-10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo in Arabic Arabic / gold theme */}
        <div 
          onClick={() => setActiveTab('home')} 
          className="flex items-center gap-3 cursor-pointer group"
          id="nav_brand_logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c5a059] to-[#ebd7a7] flex items-center justify-center text-gray-950 shadow-lg shadow-[#c5a059]/10 group-hover:scale-105 transition-transform duration-200">
            <Building2 className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col text-right">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white dark:text-white light:text-gray-900 flex items-center gap-1.5">
              المنصة العقارية 
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30">العراق</span>
            </span>
            <span className="text-[10px] text-[#c5a059] font-medium tracking-wide">ESTATE PODIUM</span>
          </div>
        </div>

        {/* Primary Navigation items - PUBLIC MENU (ALWAYS SHOWN) */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            id="nav_btn_home"
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'home'
                ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/15'
                : 'text-gray-300 hover:text-white hover:bg-white/5 dark:text-gray-300 light:text-gray-700 light:hover:text-gray-900 light:hover:bg-gray-100'
            }`}
          >
            الرئيسية
          </button>

          <button
            id="nav_btn_browse"
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'browse'
                ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/15'
                : 'text-gray-300 hover:text-white hover:bg-white/5 dark:text-gray-300 light:text-gray-700 light:hover:text-gray-900 light:hover:bg-gray-100'
            }`}
          >
            تصفح العقارات
          </button>
          
          <button
            id="nav_btn_request"
            onClick={() => setActiveTab('request-system')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'request-system'
                ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/15'
                : 'text-gray-300 hover:text-white hover:bg-white/5 dark:text-gray-300 light:text-gray-700 light:hover:text-gray-900 light:hover:bg-gray-100'
            }`}
          >
            طلب عقار مخصص
          </button>

          <button
            id="nav_btn_about"
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'about'
                ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/15'
                : 'text-gray-300 hover:text-white hover:bg-white/5 dark:text-gray-300 light:text-gray-700 light:hover:text-gray-900 light:hover:bg-gray-100'
            }`}
          >
            حول المنصة
          </button>
        </nav>

        {/* Right side utility / user actions */}
        <div className="flex items-center gap-3">
          {/* Day/Night Theme Button */}
          <button
            onClick={toggleTheme}
            id="nav_btn_theme"
            className="p-2.5 rounded-lg border border-gray-800 bg-gray-900/60 text-[#c5a059] hover:bg-gray-800 hover:text-white light:bg-gray-100 light:border-gray-200 light:text-[#a17f40] light:hover:bg-gray-200 transition-colors"
            title="تبديل المظهر"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user && user.username ? (
            <div className="flex items-center gap-3" id="nav_user_profile">
              <button
                id="nav_btn_dashboard_link"
                onClick={() => setActiveTab('dashboard')}
                className={`hidden md:inline-flex px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'dashboard' || activeTab === 'login'
                    ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/15'
                    : 'text-gray-300 hover:text-white hover:bg-white/5 dark:text-gray-300 light:text-gray-700 light:hover:text-gray-900 light:hover:bg-gray-100'
                }`}
              >
                لوحة التحكم
              </button>

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-[#c5a059] font-semibold">
                  {user.role === 'owner' ? 'المالك العام' : 'شريك معتمد'}
                </span>
                <span className="text-sm font-bold text-gray-200 light:text-gray-800">
                  {user.role === 'owner' ? user.username : (user.agencyName || user.username)}
                </span>
              </div>

              {/* Responsive Quick Navigation to Control Board */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex sm:hidden p-2.5 rounded-lg transition-colors ${
                  activeTab === 'dashboard' || activeTab === 'login'
                    ? 'bg-[#c5a059] text-gray-950'
                    : 'bg-gray-900 text-gray-300 light:bg-gray-100 light:text-gray-600'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              <button
                onClick={onLogout}
                id="nav_btn_logout"
                className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-xs font-bold">تسجيل الخروج</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="nav_btn_quick_login"
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 font-bold text-xs sm:text-sm shadow-md shadow-[#c5a059]/10 transition-all duration-200"
              >
                دخول الوكلاء والأدمن
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Top Navigation Subbar - Public Links + Auth links */}
      <div className="flex md:hidden items-center justify-around border-t border-gray-800 border-opacity-30 p-2.5 bg-[#12161f] light:bg-[#f1f5f9] overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'home' || activeTab === 'browse' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30' : 'text-gray-400 light:text-gray-600'
          }`}
        >
          الرئيسية
        </button>
        <button
          onClick={() => setActiveTab('request-system')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'request-system' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30' : 'text-gray-400 light:text-gray-600'
          }`}
        >
          طلب عقار مخصص
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'about' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30' : 'text-gray-400 light:text-gray-600'
          }`}
        >
          حول المنصة
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'dashboard' || activeTab === 'login' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30' : 'text-gray-400 light:text-gray-600'
          }`}
        >
          {user && user.username ? 'لوحة التحكم' : 'دخول'}
        </button>
      </div>
    </header>
  );
}
