import React, { useState, useEffect } from 'react';
import { IRAQ_PROVINCES, PROPERTY_CATEGORIES, Property, PropertyRequest, Agency } from '../types';
import { formatPrice, formatArea, formatDate, safeApiFetch } from '../utils';
import { 
  Building2, Users, FileText, BarChart3, PlusCircle, Trash2, Edit3, KeyRound, 
  MapPin, Phone, MessageCircle, ShieldCheck, MailWarning, Upload, AlertCircle, RefreshCw, Eye
} from 'lucide-react';

interface AuthDashProps {
  user: any;
  onLoginSuccess: (user: any) => void;
  setActiveTab: (tab: string) => void;
}

export default function AuthDash({ user, onLoginSuccess, setActiveTab }: AuthDashProps) {
  // Authentication Forms State
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginRole, setLoginRole] = useState<'owner' | 'agency'>('agency');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Active Panel Tracker inside Dashboard
  const [activePanel, setActivePanel] = useState<string>('analytics');

  // Owner Mode data states
  const [agencies, setAgencies] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  // Agency Mode data states
  const [agencyProperties, setAgencyProperties] = useState<Property[]>([]);
  
  // Shared Mode database requests (rbac provincial views)
  const [requests, setRequests] = useState<PropertyRequest[]>([]);

  // Global Loaders
  const [panelLoading, setPanelLoading] = useState<boolean>(false);

  // Credential Modification states
  const [chgUsername, setChgUsername] = useState<string>('');
  const [chgPassword, setChgPassword] = useState<string>('');
  const [chgSuccess, setChgSuccess] = useState<string | null>(null);
  const [chgError, setChgError] = useState<string | null>(null);

  // Agency Creation Form states
  const [newAgencyName, setNewAgencyName] = useState<string>('');
  const [newAgencyPhone, setNewAgencyPhone] = useState<string>('');
  const [newAgencyUser, setNewAgencyUser] = useState<string>('');
  const [newAgencyPass, setNewAgencyPass] = useState<string>('');
  const [newAgencyProvinces, setNewAgencyProvinces] = useState<string[]>([]);
  const [agencyFormSuccess, setAgencyFormSuccess] = useState<string | null>(null);
  const [agencyFormError, setAgencyFormError] = useState<string | null>(null);

  // Edit Agency parameters
  const [editingAgency, setEditingAgency] = useState<any | null>(null);

  // Add/Edit Property Form states (Agency only)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState<boolean>(false);
  const [propTitle, setPropTitle] = useState<string>('');
  const [propDesc, setPropDesc] = useState<string>('');
  const [propPrice, setPropPrice] = useState<string>('');
  const [propType, setPropType] = useState<'sale' | 'rent'>('sale');
  const [propCategory, setPropCategory] = useState<string>('Houses');
  const [propCity, setPropCity] = useState<string>('');
  const [propProvince, setPropProvince] = useState<string>('');
  const [propBedrooms, setPropBedrooms] = useState<string>('3');
  const [propArea, setPropArea] = useState<string>('200');
  const [propCoverImage, setPropCoverImage] = useState<string>('');
  const [propGallery, setPropGallery] = useState<string[]>([]);
  
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [propFormSuccess, setPropFormSuccess] = useState<string | null>(null);
  const [propFormError, setPropFormError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // REACTIVE FETCH ACTIONS
  // ---------------------------------------------------------------------------
  // REACTIVE FETCH ACTIONS
  // ---------------------------------------------------------------------------
  // Execute unified loading sequence (using real sqlite database backend APIs)
  const loadDashboardData = async () => {
    if (!user) return;
    setPanelLoading(true);

    try {
      // 1. Fetch Requests (Filtered on server by Province context or role owner)
      const reqRes = await safeApiFetch('/api/requests');
      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data.requests || []);
      } else {
        setRequests([]);
      }

      if (user.role === 'owner') {
        // 2. Fetch Owner Analytics
        const ansRes = await safeApiFetch('/api/owner/analytics');
        if (ansRes.success && ansRes.data) {
          setAnalytics(ansRes.data);
        } else {
          // Fallback empty analytics to ensure the UI renders correctly and never crashes
          setAnalytics({
            propertyCount: 0,
            agencyCount: 0,
            requestCount: 0,
            categories: [],
            types: []
          });
        }

        // 3. Fetch Registered Agencies
        const ageRes = await safeApiFetch('/api/agencies');
        if (ageRes.success && ageRes.data) {
          setAgencies(ageRes.data.agencies || []);
        } else {
          setAgencies([]);
        }

        // 4. Fetch All Properties (Global catalog)
        const prpRes = await safeApiFetch('/api/properties?limit=100');
        if (prpRes.success && prpRes.data) {
          setAllProperties(prpRes.data.properties || []);
        } else {
          setAllProperties([]);
        }
      } else {
        // Agency mode: fetch only own properties
        const prpRes = await safeApiFetch(`/api/properties?agency_id=${user.agencyId}&limit=100`);
        if (prpRes.success && prpRes.data) {
          setAgencyProperties(prpRes.data.properties || []);
        } else {
          setAgencyProperties([]);
        }
      }
    } catch (e) {
      console.error('Error loading backend dashboard:', e);
      // Ensure absolute stability by falling back to safe empty states
      setRequests([]);
      if (user.role === 'owner') {
        setAnalytics({
          propertyCount: 0,
          agencyCount: 0,
          requestCount: 0,
          categories: [],
          types: []
        });
        setAgencies([]);
        setAllProperties([]);
      } else {
        setAgencyProperties([]);
      }
    } finally {
      setPanelLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
      // Route appropriately
      if (user.role === 'owner') {
        setActivePanel('analytics');
      } else {
        setActivePanel('my-properties');
      }
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // AUTH ROUTINES
  // ---------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setAuthError('يرجى تعبئة اسم المستخدم وكلمة المرور للدخول.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await safeApiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res?.success || !res?.data) {
        throw new Error(res?.error || res?.message || 'خطأ في اسم المستخدم أو كلمة المرور.');
      }

      const userToken = res?.data?.token;
      if (userToken) {
        localStorage.setItem('token', userToken);
      }

      const userData = res?.data?.user;
      if (!userData) {
        throw new Error('لم يتم إرجاع بيانات حساب المستخدم من الخادم.');
      }

      onLoginSuccess(userData);
    } catch (err: any) {
      setAuthError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من الحساب وسلامة الشبكة.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setChgSuccess(null);
    setChgError(null);

    if (!chgUsername && !chgPassword) {
      setChgError('يرجى تعبئة حقل واحد على الأقل للتحديث.');
      return;
    }

    try {
      const res = await safeApiFetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUsername: chgUsername || undefined,
          newPassword: chgPassword || undefined
        })
      });

      if (!res.success) {
        throw new Error(res.error || 'فشل التحديث الأمني.');
      }

      setChgSuccess('تم تحديث البيانات الأمنية لحسابك بنجاح.');
      setChgUsername('');
      setChgPassword('');
    } catch (err: any) {
      setChgError(err.message || 'خطأ في معالجة طلب التعديل.');
    }
  };

  // ---------------------------------------------------------------------------
  // OWNER ACTION ROUTINES
  // ---------------------------------------------------------------------------
  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgencyFormSuccess(null);
    setAgencyFormError(null);

    if (newAgencyProvinces.length === 0) {
      setAgencyFormError('يرجى اختيار محافظة واحدة على الأقل لإسنادها للوكالة.');
      return;
    }

    try {
      const res = await safeApiFetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgencyName,
          phone: newAgencyPhone,
          username: newAgencyUser,
          password: newAgencyPass,
          provinces: newAgencyProvinces
        })
      });

      if (!res.success) {
        throw new Error(res.error || 'فشل في تسجيل الوكالة عبر الخادم.');
      }

      setAgencyFormSuccess('تم تسجيل الوكالة بنشاط وربطها بالمحافظات بنجاح.');
      setNewAgencyName('');
      setNewAgencyPhone('');
      setNewAgencyUser('');
      setNewAgencyPass('');
      setNewAgencyProvinces([]);
      loadDashboardData();
    } catch (err: any) {
      setAgencyFormError(err.message || 'فشل تسجيل حساب الوكالة.');
    }
  };

  const handleToggleProvince = (prov: string) => {
    setNewAgencyProvinces(prev => 
      prev.includes(prov) ? prev.filter(p => p !== prov) : [...prev, prov]
    );
  };

  const handleToggleEditProvince = (prov: string) => {
    if (!editingAgency) return;
    const currentProvs = editingAgency.provinces || [];
    const updated = currentProvs.includes(prov) 
      ? currentProvs.filter((p: string) => p !== prov)
      : [...currentProvs, prov];
    
    setEditingAgency({ ...editingAgency, provinces: updated });
  };

  const handleSaveAgencyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency) return;

    try {
      const res = await safeApiFetch(`/api/agencies/${editingAgency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingAgency.name,
          phone: editingAgency.phone,
          subscription_status: editingAgency.subscription_status,
          provinces: editingAgency.provinces
        })
      });

      if (!res.success) {
        throw new Error(res.error || 'فشل حفظ التعديلات بطلب السيرفر.');
      }

      setEditingAgency(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'فشل تعديل بيانات الوكالة.');
    }
  };

  const handleDeleteAgency = async (id: number) => {
    if (!window.confirm('🚨 تحذير: هل أنت متأكد من حذف هذه الوكالة بالكامل؟ سيؤدي ذلك لحذف حسابها وعقاراتها التابعة لها كلياً.')) return;
    
    try {
      const res = await safeApiFetch(`/api/agencies/${id}`, {
        method: 'DELETE'
      });

      if (!res.success) {
        throw new Error(res.error || 'فشل حذف الوكالة.');
      }

      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الوكالة.');
    }
  };

  // ---------------------------------------------------------------------------
  // AGENCY ACTION ROUTINES (R2 Upload + DB Sync)
  // ---------------------------------------------------------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setPropFormError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await safeApiFetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res?.success || !res?.data) {
        throw new Error(res?.error || 'فشل رفع الصور المحددة.');
      }

      const uploadedUrls = res?.data?.urls ?? [];
      if (uploadedUrls.length > 0) {
        if (!propCoverImage) {
          setPropCoverImage(uploadedUrls[0]);
        }
        setPropGallery(prev => [...prev, ...uploadedUrls]);
        setPropFormSuccess('تم رفع وتجهيز صورك بنجاح في السحابة.');
      }
    } catch (err: any) {
      setPropFormError(err.message || 'فشل الرفع.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleOpenAddProperty = () => {
    setEditingProperty(null);
    setPropTitle('');
    setPropDesc('');
    setPropPrice('');
    setPropType('sale');
    setPropCategory('Houses');
    setPropCity('');
    setPropProvince('');
    setPropBedrooms('3');
    setPropArea('200');
    setPropCoverImage('');
    setPropGallery([]);
    setPropFormSuccess(null);
    setPropFormError(null);
    setShowPropertyModal(true);
  };

  const handleOpenEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setPropTitle(prop.title);
    setPropDesc(prop.description);
    setPropPrice(prop.price.toString());
    setPropType(prop.type);
    setPropCategory(prop.category);
    setPropCity(prop.city);
    setPropProvince(prop.province);
    setPropBedrooms(prop.bedrooms.toString());
    setPropArea(prop.area.toString());
    setPropCoverImage(prop.cover_image);
    setPropGallery(prop.images || [prop.cover_image]);
    setPropFormSuccess(null);
    setPropFormError(null);
    setShowPropertyModal(true);
  };

  const handleSavePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropFormSuccess(null);
    setPropFormError(null);

    if (!propTitle || !propDesc || !propPrice || !propCity || !propProvince || !propCoverImage) {
      setPropFormError('يرجى ملء جميع الحقول الإلزامية وعنونة العقار بصورة غلاف.');
      return;
    }

    const payload = {
      title: propTitle,
      description: propDesc,
      price: parseFloat(propPrice),
      type: propType,
      category: propCategory,
      city: propCity,
      province: propProvince,
      bedrooms: parseInt(propBedrooms) || 0,
      area: parseFloat(propArea) || 0,
      cover_image: propCoverImage,
      images: propGallery
    };

    try {
      const url = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties';
      const res = await safeApiFetch(url, {
        method: editingProperty ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.success) {
        throw new Error(res.error || 'حدث خطأ بالخلية المسؤولة عن العقار.');
      }

      setPropFormSuccess(editingProperty ? 'تم تحديث بيانات العقار بنجاح!' : 'تم نشر وإدراج العقار بالبث الرئيسي بنجاح!');
      setTimeout(() => {
        setShowPropertyModal(false);
        loadDashboardData();
      }, 1000);
    } catch (err: any) {
      setPropFormError(err.message || 'خطأ في معالجة طلب العقار حاسوبياً.');
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك بحذف هذا الإعلان العقاري نهائياً؟')) return;

    try {
      const res = await safeApiFetch(`/api/properties/${id}`, {
        method: 'DELETE'
      });

      if (!res.success) {
        throw new Error(res.error || 'فشل حذف العقار.');
      }

      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'خطأ في معالجة طلب الحذف.');
    }
  };

  // Unauthenticated view login interface
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div id="login_card" className="premium-blur-card rounded-2xl p-8 border border-gray-800 shadow-2xl relative">
          
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#c5a059] to-[#ebd7a7] flex items-center justify-center text-gray-950 shadow-xl shadow-[#c5a059]/10">
            <Building2 className="w-10 h-10" />
          </div>

          <div className="text-center mt-10 mb-8 space-y-2">
            <h1 className="text-2xl font-black text-[#ebd7a7]">بوابة النفاذ المشتركة (RBAC)</h1>
            <p className="text-xs text-gray-400">لوحة تحكم موحدة لمالك المنصة ومكاتب العقارات الشريكة</p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/20 text-red-400 text-xs text-center mb-6">
              ⚠️ {authError}
            </div>
          )}

          {/* Unified Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">اسم مستخدم الحساب</label>
              <input
                type="text"
                required
                placeholder="مثال: Alihassan123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 text-sm focus:border-[#c5a059] focus:outline-none text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">كلمة مرور الحساب</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 text-sm focus:border-[#c5a059] focus:outline-none text-white"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              id="submit_login_btn"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 font-extrabold text-sm transition-all focus:outline-none shadow-lg shadow-[#c5a059]/10 cursor-pointer"
            >
              {authLoading ? 'جاري التحقق من الهوية والأمن...' : 'دخول لوحة التحكم الموحدة'}
            </button>
          </form>

          {/* Quick Credential Information for testing */}
          <div className="mt-8 pt-6 border-t border-gray-800/60 text-right space-y-2 text-[11px] text-gray-500">
            <p className="font-semibold text-gray-400">🔑 حسابات النفاذ التلقائية للتثبت والمعاينة:</p>
            <p>• حساب مالك المنصة الرئيسي (Owner):</p>
            <div className="bg-gray-950/60 p-2.5 rounded border border-gray-900 font-mono text-gray-400 select-all">
              Username: <span className="text-[#c5a059] font-bold">Alihassan123</span><br />
              Password: <span className="text-[#c5a059] font-bold">aliali7777</span>
            </div>
            <p>• حساب مكتب تجاري افتراضي (Agency):</p>
            <div className="bg-gray-500/5 p-2 rounded border border-gray-900 font-mono text-gray-400">
              Username: <span className="text-gray-300 font-bold">AlRafidain_Estate</span><br />
              Password: <span className="text-gray-300 font-bold">agency123</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Authenticated View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Dashboard Top layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800/60">
        <div>
          <span className="text-xs font-bold text-[#c5a059] bg-[#c5a059]/10 px-2.5 py-1 rounded-full border border-[#c5a059]/30">
            {user.role === 'owner' ? 'لوحة المالك العام - صانع المنصة' : `بوابة الشركاء - المكاتب والمعارض`}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 flex items-center gap-2">
            أهلاً بك، {user.role === 'owner' ? 'أبو الحسن' : (user.agencyName || user.username)}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {user.role === 'owner' ? 'كامل الصلاحيات الفنية لإدارة النظام العقاري والمحافظات والوكالات المعتمدة.' : 'إدارة ومتابعة عقاراتك وتصويرها، ومطالعة ليدز محافظة اختصاصك.'}
          </p>
        </div>

        {/* Refresh pipeline command button */}
        <button
          onClick={loadDashboardData}
          disabled={panelLoading}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-bold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${panelLoading ? 'animate-spin' : ''}`} />
          تحديث رادار البيانات
        </button>
      </div>

      {/* Main Admin UI split columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDE BAR NAVIGATION MENU */}
        <div className="lg:col-span-1">
          <div className="premium-blur-card rounded-2xl p-4 border border-gray-800/80">
            <nav className="space-y-1.5">
              
              {/* Owner Navigation Links */}
              {user.role === 'owner' && (
                <>
                  <button
                    onClick={() => setActivePanel('analytics')}
                    className={`nav_menu_item w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition-all flex items-center gap-2.5 ${
                      activePanel === 'analytics' ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    تحليلات وإحصاءات عامة
                  </button>

                  <button
                    onClick={() => setActivePanel('agencies')}
                    className={`nav_menu_item w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition-all flex items-center gap-2.5 ${
                      activePanel === 'agencies' ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    وكالات وشركاء المنصة ({(agencies.length)})
                  </button>

                  <button
                    onClick={() => setActivePanel('all-listings')}
                    className={`nav_menu_item w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition-all flex items-center gap-2.5 ${
                      activePanel === 'all-listings' ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    لوحة الإعلانات الكلية ({(allProperties.length)})
                  </button>
                </>
              )}

              {/* Agency Navigation Links */}
              {user.role === 'agency' && (
                <>
                  <button
                    onClick={() => setActivePanel('my-properties')}
                    className={`nav_menu_item w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition-all flex items-center gap-2.5 ${
                      activePanel === 'my-properties' ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    عقاراتي المدرجة بالمنصة ({(agencyProperties.length)})
                  </button>

                  <button
                    onClick={handleOpenAddProperty}
                    className="nav_menu_item w-full py-3 px-4 rounded-xl text-right text-xs font-extrabold text-[#ebd7a7] hover:bg-white/5 flex items-center gap-2.5 border border-[#c5a059]/20"
                  >
                    <PlusCircle className="w-4 h-4 text-[#c5a059]" />
                    إدراج فلل وشقق جديدة
                  </button>
                </>
              )}

              {/* Shared Requests panel link */}
              <button
                onClick={() => setActivePanel('customer-leads')}
                className={`nav_menu_item w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition-all flex items-center gap-2.5 ${
                  activePanel === 'customer-leads' ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10' : 'text-[#ebd7a7] hover:bg-white/5 font-semibold'
                }`}
              >
                <FileText className="w-4 h-4" />
                طلبات المواطنين والزبائن ({(requests.length)})
              </button>

              {/* Change credentials */}
              <button
                onClick={() => setActivePanel('security')}
                className={`nav_menu_item w-full py-3 px-4 rounded-xl text-right text-xs font-bold transition-all flex items-center gap-2.5 ${
                  activePanel === 'security' ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                إعدادات حماية الحساب
              </button>

            </nav>
          </div>
        </div>

        {/* ACTION CONSOLE BOARDS DISPLAY */}
        <div className="lg:col-span-3">
          
          {panelLoading && (
            <div className="p-8 text-center text-xs text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c5a059]" />
              جاري مزامنة قواعد البيانات وقراءة الخادم المستضيف...
            </div>
          )}

          {/* 1. OWNER VIEW: ANALYTICS PANEL */}
          {user.role === 'owner' && activePanel === 'analytics' && analytics && (
            <div className="space-y-6">
              
              {/* Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                <div className="premium-blur-card rounded-2xl p-6 border-r-4 border-r-[#c5a059]">
                  <span className="text-xs text-gray-450 block mb-1">إجمالي العقارات النشطة</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-white">{analytics.propertyCount}</span>
                    <span className="text-xs text-gray-450">إعلان منشور</span>
                  </div>
                </div>

                <div className="premium-blur-card rounded-2xl p-6 border-r-4 border-r-[#c5a059]">
                  <span className="text-xs text-gray-450 block mb-1">المكاتب والوكالات المعتمدة</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-white">{analytics.agencyCount}</span>
                    <span className="text-xs text-gray-450">مكتب مرخص</span>
                  </div>
                </div>

                <div className="premium-blur-card rounded-2xl p-6 border-r-4 border-r-[#ebd7a7]">
                  <span className="text-xs text-gray-450 block mb-1">الطلبات المخصصة للأهالي</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-white">{analytics.requestCount}</span>
                    <span className="text-xs text-gray-450">ليد فعال</span>
                  </div>
                </div>

              </div>

              {/* Bento distributions graphs info list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="premium-blur-card rounded-2xl p-6">
                  <h4 className="font-extrabold text-[#ebd7a7] text-sm mb-4">التوزيع بحسب نوع العقار</h4>
                  <div className="space-y-3.5">
                    {analytics.categories && analytics.categories.map((c: any) => (
                      <div key={c.category} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>
                            {c.category === 'Houses' && 'فلل ومنازل منفردة'}
                            {c.category === 'Apartments' && 'شقق سكنية'}
                            {c.category === 'Land' && 'أراضي وفضاء'}
                            {c.category === 'Commercial' && 'مجمعات ومخازن'}
                          </span>
                          <span className="text-white">{(c.count)}</span>
                        </div>
                        <div className="w-full bg-gray-950 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] h-2 rounded-full" 
                            style={{ width: `${(c.count / (analytics.propertyCount || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="premium-blur-card rounded-2xl p-6">
                  <h4 className="font-extrabold text-[#ebd7a7] text-sm mb-4">التوزيع بحسب نوع التعاقد العقاري</h4>
                  <div className="space-y-3.5">
                    {analytics.types && analytics.types.map((t: any) => (
                      <div key={t.type} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{t.type === 'sale' ? 'بيع طابو ملك صرف' : 'إيجار شهري/سنوي'}</span>
                          <span className="text-white">{(t.count)}</span>
                        </div>
                        <div className="w-full bg-gray-950 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-600 to-amber-200 h-2 rounded-full" 
                            style={{ width: `${(t.count / (analytics.propertyCount || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. OWNER VIEW: MANAGE AGENCIES PANEL (CRUD + LOCATION SPAN ASSIGNMENT) */}
          {user.role === 'owner' && activePanel === 'agencies' && (
            <div className="space-y-8">
              
              {/* Create new Agency Gate Form */}
              <div className="premium-blur-card rounded-2xl p-6 border border-gray-800">
                <h3 className="font-extrabold text-sm text-[#ebd7a7] mb-4 flex items-center gap-1.5">
                  <PlusCircle className="w-5 h-5 text-[#c5a059]" />
                  تسجيل مكتب/وكالة عقارية شريكة جديدة
                </h3>

                {agencyFormSuccess && (
                  <div className="p-3.5 rounded-xl bg-green-950/40 border border-green-500/20 text-green-400 text-xs text-center mb-4">
                    ✓ {agencyFormSuccess}
                  </div>
                )}

                {agencyFormError && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-500 text-xs text-center mb-4">
                    ⚠️ {agencyFormError}
                  </div>
                )}

                <form onSubmit={handleCreateAgency} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">الاسم التجاري للمكتب</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: مكتب بابل للخدمات العقارية"
                        value={newAgencyName}
                        onChange={(e) => setNewAgencyName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">هاتف التواصل الساخن</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: +964 781 222 3344"
                        value={newAgencyPhone}
                        onChange={(e) => setNewAgencyPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">رمز الدخول الفريد (اسم المستخدم)</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: Babel_Estate"
                        value={newAgencyUser}
                        onChange={(e) => setNewAgencyUser(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">كلمة مرور أولية مؤقتة</label>
                      <input
                        type="password"
                        required
                        placeholder="مثال: babel789789"
                        value={newAgencyPass}
                        onChange={(e) => setNewAgencyPass(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>

                  {/* Iraq Provinces Multi-Check Allocation */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      مجموعة محافظات الاختصاص والنشاط (الأهالي بداخلها يرسلون الطلبات للمكتب):
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-gray-950/40 p-3 rounded-xl border border-gray-800">
                      {IRAQ_PROVINCES.map(province => {
                        const isChecked = newAgencyProvinces.includes(province);
                        return (
                          <button
                            type="button"
                            key={province}
                            onClick={() => handleToggleProvince(province)}
                            className={`py-1.5 px-1 rounded-md text-[10px] font-bold text-center border transition-colors cursor-pointer ${
                              isChecked 
                                ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]' 
                                : 'border-gray-800 hover:border-gray-700 text-gray-400'
                            }`}
                          >
                            {province}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 text-xs font-extrabold shadow"
                  >
                    تسجيل المكتب وتفعيل امتيازاته
                  </button>
                </form>
              </div>

              {/* Editing Module Panel Box Overlay */}
              {editingAgency && (
                <div className="p-6 rounded-2xl border-2 border-[#c5a059] bg-gray-950/90 space-y-4">
                  <h4 className="font-extrabold text-[#ebd7a7] text-sm">تعديل معلومات والتحكم بمسؤولية: {editingAgency.name}</h4>
                  
                  <form onSubmit={handleSaveAgencyEdit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editingAgency.name}
                        onChange={(e) => setEditingAgency({...editingAgency, name: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs text-white"
                        placeholder="اسم الوكالة"
                      />
                      <input
                        type="text"
                        value={editingAgency.phone}
                        onChange={(e) => setEditingAgency({...editingAgency, phone: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs text-white"
                        placeholder="الهاتف"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Subscription options */}
                      <select
                        value={editingAgency.subscription_status}
                        onChange={(e) => setEditingAgency({...editingAgency, subscription_status: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs text-white"
                      >
                        <option value="active">اشتراك فعال (مفعل)</option>
                        <option value="inactive">اشتراك معطل / منتهي (لا يمكنه الدخول)</option>
                      </select>
                    </div>

                    {/* Provinces for edit */}
                    <div>
                      <label className="block text-xs font-bold text-gray-405 mb-2">تعديل مسؤوليات المحافظات الديموغرافية:</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-gray-900 p-2.5 rounded-lg">
                        {IRAQ_PROVINCES.map(province => {
                          const isAssigned = (editingAgency.provinces || []).includes(province);
                          return (
                            <button
                              type="button"
                              key={province}
                              onClick={() => handleToggleEditProvince(province)}
                              className={`py-1.5 px-0.5 rounded-md text-[10px] font-bold text-center border ${
                                isAssigned ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]' : 'border-gray-800 text-gray-500'
                              }`}
                            >
                              {province}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-yellow-600 text-gray-950 font-bold text-xs"
                      >
                        حفظ التعديلات الطارئة
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAgency(null)}
                        className="px-4 py-2 rounded-lg bg-gray-900 text-gray-400 text-xs border border-gray-800"
                      >
                        إلغاء التعديل
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Agencies Catalog list with location allocations view */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-white">كتالوج الشركاء العقاريين المنضمين للمنصة</h4>
                
                {agencies.length === 0 ? (
                  <p className="text-xs text-gray-500">لا يوجد وكالات مسجلة بالنظام حالياً.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agencies.map((agency) => (
                      <div key={agency.id} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 shadow-md relative group flex flex-col justify-between">
                        
                        {/* Control buttons */}
                        <div className="absolute top-4 left-4 flex gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingAgency(agency)}
                            className="p-1 px-1.5 rounded bg-gray-850 hover:bg-gray-800 text-[#ebd7a7] border border-gray-800/80 transition-colors"
                            title="تعديل امتيازات المكتب"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgency(agency.id)}
                            className="p-1 px-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-500 border border-red-900/30 transition-colors"
                            title="إلغاء وإبادة المكتب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          {/* Name and status */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${agency.subscription_status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <h5 className="font-extrabold text-sm text-white">{agency.name}</h5>
                          </div>

                          <span className="text-[10px] text-gray-500 block mb-3 font-mono">حساب تسجيل الدخول: @{agency.username} | هاتف: {agency.phone}</span>

                          {/* Province blocks */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-gray-450 block font-semibold">المحافظات المسؤولة عن تلبية طلباتها:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {agency.provinces && agency.provinces.length > 0 ? (
                                agency.provinces.map((p: string) => (
                                  <span key={p} className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c5a059]/10 text-[#ebd7a7] border border-[#c5a059]/15">
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[9px] text-red-400">لم يسند له أي نطاق جغرافي!</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subscription indicators */}
                        <div className="border-t border-gray-800/50 pt-3.5 mt-4 text-[10px] text-gray-500 flex justify-between items-center">
                          <span>تاريخ التأسيس: {formatDate(agency.created_at)}</span>
                          <span className={`${agency.subscription_status === 'active' ? 'text-green-400' : 'text-red-400'} font-bold`}>
                            {agency.subscription_status === 'active' ? '✓ نشط قانونياً' : '🛑 معطل'}
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 3. OWNER VIEW: COMBINED PROPERTY CONTROL CATALOGUE */}
          {user.role === 'owner' && activePanel === 'all-listings' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-[#ebd7a7] text-sm">كتالوج الإعلانات الكلي المنشور لعموم العراق</h3>
              
              {allProperties.length === 0 ? (
                <p className="text-xs text-gray-500">لا يوجد عقارات سكنية نشطة بالمنصة.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/40">
                  <table className="w-full border-collapse text-right text-xs">
                    <thead>
                      <tr className="bg-gray-950 border-b border-gray-800 text-gray-400">
                        <th className="p-3.5">المدينة والوجهة</th>
                        <th className="p-3.5">عنوان العقار</th>
                        <th className="p-3.5">المكتب المسوق</th>
                        <th className="p-3.5">النوع والتصنيف</th>
                        <th className="p-3.5">القيمة والسعر</th>
                        <th className="p-3.5 text-center">أوامر تحكم وطوارئ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {allProperties.map((prop) => (
                        <tr key={prop.id} className="hover:bg-gray-850 transition-colors">
                          <td className="p-3.5 font-bold text-gray-400">{prop.province} - {prop.city}</td>
                          <td className="p-3.5 text-white font-medium">{prop.title}</td>
                          <td className="p-3.5 font-mono text-gray-300">{prop.agency_name}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-gray-900 border border-gray-800 text-gray-300">
                              {prop.type === 'sale' ? 'بيع' : 'إيجار'} / {prop.category === 'Houses' && 'فلل'}
                              {prop.category === 'Apartments' && 'شقة'}
                              {prop.category === 'Land' && 'أرض'}
                              {prop.category === 'Commercial' && 'تجاري'}
                            </span>
                          </td>
                          <td className="p-3.5 text-[#ebd7a7] font-black">{formatPrice(prop.price)}</td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteProperty(prop.id)}
                              className="p-1 px-2 rounded bg-red-950/40 border border-red-900/30 text-red-500 hover:bg-red-900 hover:text-white transition-all"
                            >
                              إلغاء الإعلان 🚮
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. BOTH VIEWS (RBAC LOCKED): VIEW CUSTOMER REQUEST SECTOR */}
          {activePanel === 'customer-leads' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-[#ebd7a7] text-sm">طلبات الإيجار والشراء المقدمة من الأهالي والزبائن</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {user.role === 'owner' 
                    ? 'رؤية شاملة بصفة مالك المنصة لجميع طلبات عموم العراق للرقابة والتوطين.' 
                    : `رؤية مخصصة للوكلاء: يتم قصر عرض هذه الطلبات على الزبائن داخل نطاق محافظات طاقمك فقط لتلبية طلباتهم.`}
                </p>
              </div>

              {requests.length === 0 ? (
                <div className="py-12 bg-gray-950/20 rounded-2xl border border-dashed border-gray-800 text-center text-gray-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                  <p className="text-xs">لم يتقدم أي مواطن بطلب عقاري مخصص في نطاق اختصاصاتك الجغرافية الحالية.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {requests.map((req) => (
                    <div key={req.id} className="premium-blur-card rounded-2xl p-5 border border-gray-800/80 shadow relative flex flex-col sm:flex-row gap-6">
                      
                      {/* Left Side primary core info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.buy_or_rent === 'buy' ? 'bg-[#c5a059] text-gray-950' : 'bg-white text-gray-950'}`}>
                            {req.buy_or_rent === 'buy' ? 'يرغب بالشراء' : 'يرغب بالإيجار'}
                          </span>
                          <span className="text-xs font-bold text-gray-400 mr-2">محافظة: <span className="text-white">{req.province}</span></span>
                          <span className="text-xs font-bold text-gray-400">المنطقة والحي: <span className="text-white">{req.city}</span></span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-gray-200">الزبون: <span className="text-white font-black">{req.full_name}</span></h4>
                          <p className="text-xs text-[#ebd7a7] font-black">الميزانية المرصودة للطلب: {formatPrice(req.budget)}</p>
                        </div>

                        {/* Description content */}
                        <div className="text-xs text-gray-350 bg-gray-950/40 border border-gray-900 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                          {req.description}
                        </div>

                        {/* Customer direct contact CTAs */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          
                          <a
                            href={`tel:${req.phone}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-950 text-[#c5a059] border border-gray-800 hover:text-white hover:bg-gray-800 hover:border-gray-700 transition-colors text-xs font-bold"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            اتصال مباشر: {req.phone}
                          </a>

                          <a
                            href={`https://wa.me/${req.phone.replace(/\s+/g, '').replace('+', '')}?text=${encodeURIComponent(`مرحباً أستاذ ${req.full_name}، تواصلنا معك من المنصة العقارية العراقية بخصوص طلبك العقاري لـ [${req.buy_or_rent === 'buy' ? 'الشراء' : 'الإيجار'} في ${req.province}، ${req.city}]. لدينا خيارات مناسبة نود مشاركتها معك.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-950/60 text-green-400 border border-green-905 hover:bg-green-600 hover:text-white transition-colors text-xs font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            واتساب العميل
                          </a>

                        </div>
                      </div>

                      {/* Right side date metadata */}
                      <span className="text-[10px] text-gray-550 sm:self-end pr-4 text-left block w-full sm:w-auto font-mono">
                        تاريخ إطلاق الطلب: {formatDate(req.created_at || new Date().toISOString())}
                      </span>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. AGENCY VIEW: PROPERTIES CATALOGUE */}
          {user.role === 'agency' && activePanel === 'my-properties' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <h3 className="font-extrabold text-[#ebd7a7] text-sm">عقاراتي المعروضة بالمنصة حالياً</h3>
                <button
                  onClick={handleOpenAddProperty}
                  id="add_property_fast_btn"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  إدراج فلل وشقق جديدة
                </button>
              </div>

              {agencyProperties.length === 0 ? (
                <div className="py-20 text-center rounded-2xl border border-dashed border-gray-800 bg-gray-950/20 p-8">
                  <p className="text-xs text-gray-500 mb-4">لم تقم بإدراج أي إعلانات عقارية للبيع أو الإيجار باسم مكتبك حتى الآن.</p>
                  <button
                    onClick={handleOpenAddProperty}
                    className="px-6 py-2.5 rounded-xl bg-gray-905 border border-gray-800 text-[#ebd7a7] text-xs font-bold hover:bg-gray-800"
                  >
                    إدراج العرض العقاري الأول
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {agencyProperties.map((prop) => (
                    <div key={prop.id} className="p-4 rounded-2xl bg-gray-900 border border-gray-800 relative flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                        <img src={prop.cover_image} alt={prop.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between text-right">
                        <div>
                          <div className="flex items-center justify-between gap-2.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-950 text-gray-400 font-bold border border-gray-850">EP-{(prop.id)}</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleOpenEditProperty(prop)}
                                className="p-1 text-[#c5a059] hover:bg-gray-800 rounded transition-colors"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(prop.id)}
                                className="p-1 text-red-500 hover:bg-gray-805 rounded transition-colors"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <span className="text-xs font-extrabold text-[#ebd7a7] block mt-1.5">{formatPrice(prop.price)}</span>
                          <h4 className="text-xs font-bold text-gray-200 line-clamp-2 mt-1">{prop.title}</h4>
                        </div>

                        <div className="text-[10px] text-gray-500 flex justify-between pt-2 border-t border-gray-805 mt-2">
                          <span>{prop.province} - {prop.city}</span>
                          <span>{formatArea(prop.area)}</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* 6. SHARED ROLE (RBAC): SECURITY AND SETTINGS PASSWORD CHANGING */}
          {activePanel === 'security' && (
            <div className="premium-blur-card rounded-2xl p-6 border border-gray-800 max-w-lg space-y-6">
              
              <div className="pb-3 border-b border-gray-800">
                <h3 className="font-extrabold text-[#ebd7a7] text-sm">أرصفة الأمان: تحديثcredentials الحساب</h3>
                <p className="text-[11px] text-gray-550 mt-1">يجب عدم مشاركة مفاتيح الحساب مع جهات خارجية.</p>
              </div>

              {chgSuccess && (
                <div className="p-3 rounded-xl bg-green-950/40 border border-green-500/20 text-green-400 text-xs text-center">
                  ✓ {chgSuccess}
                </div>
              )}

              {chgError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-450 text-xs text-center">
                  ⚠️ {chgError}
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">اسم المستخدم الجديد (أو اتركه لتغيير كلمة المرور فقط)</label>
                  <input
                    type="text"
                    value={chgUsername}
                    onChange={(e) => setChgUsername(e.target.value)}
                    placeholder="امثلة: Alihassan_Updated"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">رمز المرور الجديد الصارم (أقل حد 6 خانات)</label>
                  <input
                    type="password"
                    value={chgPassword}
                    onChange={(e) => setChgPassword(e.target.value)}
                    placeholder="امثلة: aliali7777"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 text-xs font-extrabold shadow cursor-pointer"
                >
                  تعزيز وحفظ البيانات التحديثية للأمان
                </button>
              </form>

            </div>
          )}

        </div>
      </div>

      {/* -----------------------------------------------------------------------
          7. AGENCY VIEW OVERLAY MODAL: CREATE OR EDIT PROPERTY LISTINGS (R2 Upload)
         ----------------------------------------------------------------------- */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-55 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="premium-blur-card rounded-2xl p-6 sm:p-8 border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative text-right">
            
            <button
              onClick={() => setShowPropertyModal(false)}
              className="absolute top-4 left-4 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="font-extrabold text-[#ebd7a7] text-lg border-b border-gray-800 pb-3 mb-6" id="prop_modal_title">
              {editingProperty ? `تعديل تفاصيل العرض العقاري: EP-${editingProperty.id}` : 'إدراج إعلان عقاري مميز جديد بالمنصة'}
            </h3>

            {propFormSuccess && (
              <div className="p-3.5 rounded-xl bg-green-950/40 border border-green-500/20 text-green-400 text-xs text-center mb-6">
                ✓ {propFormSuccess}
              </div>
            )}

            {propFormError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-500 text-xs text-center mb-6">
                ⚠️ {propFormError}
              </div>
            )}

            <form onSubmit={handleSavePropertySubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">عنوان الإعلان العقاري الجاذب (بالعربية)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بيت طابوق فخم للبيع في وسط الديوانية"
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">التصنيف العقاري</label>
                  <select
                    required
                    value={propCategory}
                    onChange={(e) => setPropCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-gray-300 focus:outline-none focus:border-[#c5a059]"
                  >
                    {PROPERTY_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">الوصف والملحقات والضمان العقاري</label>
                <textarea
                  required
                  rows={4}
                  placeholder="اكتب مواصفات البيت ومحيطه، الشوارع القريبة، الخدمات، هل السعر تفاوضي، نوع السند والمأوى..."
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none focus:border-[#c5a059] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">القيمة الإجمالية المطلوبة (بالدينار العراقي)</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 450000000 (أربعمائة وخمسون مليون دينار)"
                    value={propPrice}
                    onChange={(e) => setPropPrice(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none"
                  />
                </div>

                {/* Offer Option */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">نوع الاتفاق والصفقة</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value as 'sale' | 'rent')}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-gray-300 focus:outline-none"
                  >
                    <option value="sale">معروض للبيع مباشر (Sale)</option>
                    <option value="rent">معروض للإيجار السكني شهرياً (Rent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Province select */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">المحافظة</label>
                  <select
                    required
                    value={propProvince}
                    onChange={(e) => setPropProvince(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-gray-300 focus:outline-none"
                  >
                    <option value="">اختار محافظة العقار...</option>
                    {IRAQ_PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* District City text */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">المدينة أو الحي السكني بالكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حي العروبة، قرب معمل السكر"
                    value={propCity}
                    onChange={(e) => setPropCity(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rooms count */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">عدد غرف النوم الحاضرة</label>
                  <input
                    type="number"
                    placeholder="مثال: 3"
                    value={propBedrooms}
                    onChange={(e) => setPropBedrooms(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none"
                  />
                </div>

                {/* Area size */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">مساحة العقار بالأمتار (م²)</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 200"
                    value={propArea}
                    onChange={(e) => setPropArea(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg bg-gray-950/80 border border-gray-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD MODULE FOR WORKERS R2 SIMULATION */}
              <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-[#c5a059]" />
                  <h4 className="font-extrabold text-[#ebd7a7] text-xs">رفع وتخزين الصور مباشرة في مستودع Cloudflare R2</h4>
                </div>

                <div className="text-[11px] text-gray-400 font-light">
                  - يدعم النظام الفحص التلقائي والتخزين في R2 buckets لتحسين سرعة وأداء اللود اليومي لآلاف العملاء.<br />
                  - اختر حتى 8 صور عالية الدقة دفعة واحدة. سيتم اتخاذ الصورة الأولى المرفوعة كغلاف للمنشور تلقائياً.
                </div>

                {/* Drag / Select uploader input box */}
                <div className="border border-dashed border-gray-800 hover:border-[#c5a059] focus-within:border-[#c5a059] rounded-xl p-6 text-center transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:scale-105" />
                  <p className="text-xs font-bold text-white mb-1">اضغط هنا أو قم بسحب وإسقاط الصور</p>
                  <p className="text-[10px] text-gray-550">تنسيقات صور مقبولة: PNG, JPG, JPEG (صيغة الويب الأمثل)</p>
                </div>

                {uploadingImages && (
                  <p className="text-xs text-yellow-500 font-bold animate-pulse text-center">⏳ جاري تخصيص وضغط الصور وحقنها في داتابيز R2 ميديا...</p>
                )}

                {/* Show current list of R2 URL strings uploaded to form */}
                {propGallery.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-900">
                    <span className="text-[11px] text-gray-400 font-bold block mb-1">البلوب والمعارض الجاهزة للنشر المعتمدة (R2 URLs):</span>
                    <div className="flex flex-wrap gap-2">
                      {propGallery.map((url, i) => (
                        <div key={i} className="relative w-16 h-16 rounded border border-gray-800 overflow-hidden shrink-0 group">
                          <img src={url} alt="R2 preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const filt = propGallery.filter(u => u !== url);
                              setPropGallery(filt);
                              if (propCoverImage === url) {
                                setPropCoverImage(filt[0] || '');
                              }
                            }}
                            className="absolute inset-0 bg-red-950/80 text-red-400 text-[10px] items-center justify-center opacity-0 group-hover:opacity-100 flex transition-opacity"
                          >
                            حذف
                          </button>
                          {propCoverImage === url && (
                            <span className="absolute bottom-0 inset-x-0 bg-[#c5a059] text-gray-950 text-[8px] font-bold text-center">الغلاف</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-850">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 font-extrabold text-sm shadow cursor-pointer"
                >
                  {editingProperty ? 'تحديث وتطبيق التعديلات' : 'نشر العقار وتعميم الإعلان بالبث'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-6 py-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 text-sm font-bold"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
