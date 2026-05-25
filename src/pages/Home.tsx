import React, { useState, useEffect, useCallback } from 'react';
import { Property, PROPERTY_CATEGORIES, IRAQ_PROVINCES } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Search, SlidersHorizontal, RefreshCw, Layers, X, PlusCircle, BookmarkCheck } from 'lucide-react';
import { safeApiFetch } from '../utils';

interface HomeProps {
  onSelectProperty: (id: number) => void;
  setActiveTab: (tab: string) => void;
}

export default function Home({ onSelectProperty, setActiveTab }: HomeProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters State
  const [activeType, setActiveType] = useState<'all' | 'sale' | 'rent'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [cityInput, setCityInput] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minArea, setMinArea] = useState<string>('');
  const [maxArea, setMaxArea] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<string>('all');

  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Pagination / Load more
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Core property fetcher (fetching via the secure sqlite database backend)
  const fetchProperties = useCallback(async (isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const currentPage = isLoadMore ? page + 1 : 1;

    try {
      const params = new URLSearchParams();
      if (activeType !== 'all') params.append('type', activeType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedProvince !== 'all') params.append('province', selectedProvince);
      if (cityInput.trim() !== '') params.append('city', cityInput.trim());
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minArea) params.append('minArea', minArea);
      if (maxArea) params.append('maxArea', maxArea);
      if (bedrooms !== 'all') params.append('bedrooms', bedrooms);
      
      params.append('page', currentPage.toString());
      params.append('limit', '6');

      const res = await safeApiFetch(`/api/properties?${params.toString()}`);
      if (!res.success || !res.data) {
        throw new Error(res.error || 'فشل جلب العقارات من المخدم.');
      }

      const data = res.data;
      
      if (isLoadMore) {
        setProperties(prev => [...prev, ...data.properties]);
        setPage(currentPage);
      } else {
        setProperties(data.properties || []);
        setPage(1);
      }

      setHasMore(data.hasMore);
      setTotalCount(data.total);
      setError(null);
    } catch (err: any) {
      setError('حدث خطأ في تحميل البيانات المحفوظة من السيرفر.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [
    activeType,
    selectedCategory,
    selectedProvince,
    cityInput,
    minPrice,
    maxPrice,
    bedrooms,
    minArea,
    maxArea,
    page
  ]);

  // Initial and reactive fetch
  useEffect(() => {
    fetchProperties(false);
  }, [activeType, selectedCategory, selectedProvince, bedrooms]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties(false);
  };

  const handleResetFilters = () => {
    setActiveType('all');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setCityInput('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setBedrooms('all');
    // Fetch immediately
    setTimeout(() => {
      fetchProperties(false);
    }, 50);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Spotlight Section */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0c10] to-[#050608] border-b border-gray-800 border-opacity-30">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=50')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c5a059]/10 text-[#ebd7a7] border border-[#c5a059]/30 mb-6 animate-pulse">
            <BookmarkCheck className="w-4 h-4 text-[#ebd7a7]" />
            <span className="text-xs font-bold leading-none">ملاذ العقارات الفاخرة والاستثمار في العراق</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.2] max-w-4xl mx-auto">
            ابحث عن ممتلكاتك العقارية في <span className="bg-gradient-to-r from-[#c5a059] via-[#ebd7a7] to-[#ebd7a7] bg-clip-text text-transparent">المنصة العقارية</span> الأرقى
          </h1>
          
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            بوابتك الخاصة والمباشرة للبحث وإدراج العقارات في جميع محافظات العراق. نوفر لك تواصل مباشر بالوكالات المتميزة والآمنة دون عمولات مخفية.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              id="hero_btn_explore"
              onClick={() => {
                const scrollTarget = document.getElementById('search-grid-anchor');
                scrollTarget?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 font-bold transition-all duration-300 shadow-xl shadow-[#c5a059]/15"
            >
              تصفح الإعلانات الآن
            </button>
            <button
              id="hero_btn_add_req"
              onClick={() => setActiveTab('request-system')}
              className="px-8 py-4 rounded-xl border border-gray-700 bg-gray-950/60 hover:bg-gray-900 text-gray-300 hover:text-white transition-all duration-300"
            >
              أنا باحث: أرسل طلباً للمكاتب
            </button>
          </div>
        </div>
      </section>

      {/* Anchor point to snap smooth scroll */}
      <span id="search-grid-anchor" />

      {/* 2. Quick Category Filter Bar */}
      <section className="py-8 bg-[#0b0d11]/80 light:bg-gray-100 border-b border-gray-900/50 light:border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <h2 className="text-sm font-bold text-gray-400 dark:text-gray-400 light:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#c5a059]" />
              الفرز السريع بحسب التصنيف:
            </h2>
            
            <div className="flex flex-wrap gap-2.5 justify-center sm:justify-end w-full sm:w-auto">
              {/* All categories button */}
              <button
                id="cat-all"
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10'
                    : 'bg-gray-900 border border-gray-800 text-gray-300 hover:text-white light:bg-white light:border-gray-200 light:text-gray-600'
                }`}
              >
                كل العقارات
              </button>

              {PROPERTY_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  id={`cat-${cat.value}`}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat.value
                      ? 'bg-[#c5a059] text-gray-950 shadow-md shadow-[#c5a059]/10'
                      : 'bg-gray-900 border border-gray-800 text-gray-300 hover:text-white light:bg-white light:border-gray-200 light:text-gray-600'
                  }`}
                >
                  {cat.label.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Filtering Panel & Main Grid Layout */}
      <section className="py-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* A. Sidebar Search and Advanced Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 premium-blur-card rounded-2xl p-6 border border-gray-800/60 shadow-lg">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/80">
                <h3 className="font-extrabold text-[#ebd7a7] text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#c5a059]" />
                  تخصيص الفلاتر وإجراء البحث
                </h3>
                <button
                  onClick={handleResetFilters}
                  className="p-1 px-2 text-[11px] rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-1"
                  title="مسح وتصفير كل المحددات"
                >
                  <RefreshCw className="w-3 h-3" />
                  رست
                </button>
              </div>

              <form onSubmit={handleApplyFilters} className="space-y-5">
                {/* Sale / Rent Switch */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2">نوع العرض العقاري</label>
                  <div className="grid grid-cols-3 gap-1 bg-gray-950/80 p-1.5 rounded-xl border border-gray-800/80 light:bg-gray-100 light:border-gray-200">
                    <button
                      type="button"
                      onClick={() => setActiveType('all')}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        activeType === 'all' 
                          ? 'bg-[#c5a059] text-gray-950' 
                          : 'text-gray-400 hover:text-white light:text-gray-600'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveType('sale')}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        activeType === 'sale' 
                          ? 'bg-[#c5a059] text-gray-950' 
                          : 'text-gray-400 hover:text-white light:text-gray-600'
                      }`}
                    >
                      للبيع
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveType('rent')}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        activeType === 'rent' 
                          ? 'bg-[#c5a059] text-gray-950' 
                          : 'text-gray-400 hover:text-white light:text-gray-600'
                      }`}
                    >
                      للإيجار
                    </button>
                  </div>
                </div>

                {/* Iraq Province select list */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 light:text-gray-700 mb-2">
                    المحافظة (العراق)
                  </label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg bg-gray-950/80 border border-gray-800 text-sm focus:border-[#c5a059] focus:outline-none focus:ring-1 focus:ring-[#c5a059] light:bg-white light:border-gray-200 text-gray-200 light:text-gray-900"
                  >
                    <option value="all">كل المحافظات (الكل)</option>
                    {IRAQ_PROVINCES.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                {/* City inputs (text input for matching districts, like Al Mansour, Diwaniyah, etc) */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 light:text-gray-700 mb-2">
                    المنطقة / الحي السكني
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="امثلة: الجادرة، الجزائر، حي الصدر..."
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      className="w-full pl-3 pr-9 py-3 rounded-lg bg-gray-950/80 border border-gray-800 text-sm focus:border-[#c5a059] focus:outline-none text-gray-200 light:bg-white light:border-gray-200 light:text-gray-900 placeholder:text-gray-600"
                    />
                    <Search className="absolute right-3 top-3.5 w-4.5 h-4.5 text-gray-500" />
                  </div>
                </div>

                {/* Price range inputs */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 light:text-gray-700 mb-2">
                    الميزانية والسعر (د.ع)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="من د.ع"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-xs focus:border-[#c5a059] focus:outline-none text-gray-300 light:bg-white light:border-gray-200 light:text-gray-900"
                    />
                    <input
                      type="number"
                      placeholder="إلى د.ع"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-xs focus:border-[#c5a059] focus:outline-none text-gray-300 light:bg-white light:border-gray-200 light:text-gray-900"
                    />
                  </div>
                </div>

                {/* Area filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 light:text-gray-700 mb-2">
                    مساحة العقار (م²)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="أقل مساحة"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-xs focus:border-[#c5a059] focus:outline-none text-gray-300 light:bg-white light:border-gray-200 light:text-gray-900"
                    />
                    <input
                      type="number"
                      placeholder="أكبر مساحة"
                      value={maxArea}
                      onChange={(e) => setMaxArea(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-xs focus:border-[#c5a059] focus:outline-none text-gray-300 light:bg-white light:border-gray-200 light:text-gray-900"
                    />
                  </div>
                </div>

                {/* Bedrooms select */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 light:text-gray-700 mb-2">
                    عدد الغرف المطلوبة
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg bg-gray-950/80 border border-gray-800 text-sm focus:border-[#c5a059] focus:outline-none text-gray-300 light:bg-white light:border-gray-200 light:text-gray-900"
                  >
                    <option value="all">أي عدد غرف</option>
                    <option value="1">غرفة نوم 1+ أو صالة</option>
                    <option value="2">غرفتان 2+</option>
                    <option value="3">3 غرف نوم +</option>
                    <option value="4">4 غرف نوم +</option>
                    <option value="5">5 غرف نوم ملكية فأكثر</option>
                  </select>
                </div>

                <button
                  type="submit"
                  id="filter_submit_btn"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#c5a059]/10"
                >
                  <Search className="w-4 h-4" />
                  تصفية ومسح العقارات
                </button>
              </form>
            </div>
          </div>

          {/* B. Listing Grid */}
          <div className="lg:col-span-3">
            {/* Counter bar */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#ebd7a7] light:text-gray-900">العقارات المعروضة للطلب المباشر</h3>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">
                  تم العثور على <span className="text-[#c5a059] font-bold">{totalCount}</span> وحدة سياحية وسكنية في النظام المفتوح.
                </p>
              </div>
            </div>

            {/* Error messaging state */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/20 text-red-400 text-sm text-center mb-6">
                {error}
                <button 
                  onClick={() => fetchProperties(false)} 
                  className="block mx-auto mt-2 text-xs text-[#c5a059] hover:underline"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* Loading Grid Placeholder */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="h-96 bg-gray-900 rounded-2xl border border-gray-800" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              /* Absolutely gorgeous pristine blank state layout */
              <div className="py-20 text-center rounded-2xl border border-dashed border-gray-800 bg-gray-950/20 p-8">
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-gray-600 mx-auto mb-4">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-[#ebd7a7] mb-2">عذراً، لم نجد أي وحدات تطابق شروط بحثك المحددة</h4>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
                  تأكد من تعديل المحافظة أو تقليل الحدود المعينة للأسعار والمساحة لإفساح المجال لعرض خيارات أوسع.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-bold text-white border border-gray-800"
                  >
                    تصفير خيارات الفرز والبحث
                  </button>
                </div>
              </div>
            ) : (
              /* Actual Properties rendering list */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onSelect={onSelectProperty}
                  />
                ))}
              </div>
            )}

            {/* Load more triggers */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => fetchProperties(true)}
                  disabled={loadingMore}
                  className="px-8 py-3.5 rounded-xl border border-gray-800 bg-gray-900/40 hover:bg-[#c5a059] hover:text-gray-950 text-gray-300 font-bold text-sm transition-all duration-300 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري سحب عقارات إضافية...
                    </>
                  ) : (
                    'عرض المزيد من الفلل والشقق (تحميل لا نهائي)'
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
