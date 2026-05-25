import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { formatPrice, formatArea, formatDate } from '../utils';
import { Phone, MessageCircle, MapPin, Layers, Home, Calendar, ArrowRight, ArrowLeft, Star, Share2 } from 'lucide-react';

interface PropertyDetailsProps {
  propertyId: number;
  onBack: () => void;
  onSelectProperty: (id: number) => void;
}

export default function PropertyDetails({ propertyId, onBack, onSelectProperty }: PropertyDetailsProps) {
  const [data, setData] = useState<{ property: Property; similar: Property[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setLoading(true);

    const loadDetails = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        if (!response.ok) {
          throw new Error('فشل جلب تفاصيل الوحدة المطلوبة من الخادم العقاري.');
        }
        
        const resJson = await response.json();
        setData({
          property: resJson.property,
          similar: resJson.similar || []
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ في جلب بيانات العقار.');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-96 bg-gray-900 rounded-3xl mb-8 border border-gray-800" />
        <div className="h-6 w-2/3 bg-gray-900 mx-auto mb-4 rounded" />
        <div className="h-4 w-1/2 bg-gray-900 mx-auto rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h3 className="text-xl font-bold text-red-400 mb-4">فشل في تحميل تفاصيل العقار</h3>
        <p className="text-gray-400 mb-6">{error || 'العقار غير متوفر حالياً.'}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-[#c5a059] text-gray-950 font-bold"
        >
          العودة للتصفح الرئيسي
        </button>
      </div>
    );
  }

  const { property, similar } = data;
  const gallery = property.images && property.images.length > 0 ? property.images : [property.cover_image];

  // Convert phone to international standard for whatsapp link API
  const rawPhone = property.agency_phone || '+9647701234567';
  const cleanPhoneForWhatsapp = rawPhone.replace(/\s+/g, '').replace('+', '');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back button link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors text-sm font-bold cursor-pointer"
      >
        <ArrowRight className="w-4 h-4 text-[#c5a059]" />
        الرجوع إلى صفحة العقارات الرئيسية
      </button>

      {/* Main Details Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COL 1 & 2: Primary photos and text description */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* A. Premium Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-[400px] sm:h-[480px] w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-900">
              {/* Type Badge */}
              <span className={`absolute top-4 right-4 z-10 px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${
                property.type === 'sale' ? 'bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] text-gray-950' : 'bg-white text-gray-950'
              }`}>
                {property.type === 'sale' ? 'معروض للبيع المباشر' : 'معروض للايجار الشهري'}
              </span>

              {/* Cover view */}
              <img
                src={gallery[activeImageIndex]}
                alt={property.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = property.cover_image;
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/80 via-transparent p-6 text-right">
                <span className="text-yellow-500 font-bold text-xs uppercase tracking-wide">المنصة العقارية • {property.province}</span>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 line-clamp-1">{property.title}</h1>
              </div>
            </div>

            {/* Thumbnail selector row (Mocking R2 Gallery Images) */}
            {gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {gallery.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-24 h-18 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeImageIndex === index 
                        ? 'border-[#c5a059] scale-102 shadow-md shadow-[#c5a059]/10' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="صورة المعرض" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* B. Core Metadata Overview */}
          <div className="premium-blur-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800/60">
              <div>
                <span className="text-xs bg-gray-900 text-[#ebd7a7] px-3 py-1.5 rounded-md border border-[#c5a059]/20 font-bold">
                  {property.category === 'Houses' && 'منزل سكني مستقل / فيلا فاخرة'}
                  {property.category === 'Apartments' && 'شقة سكنية متكاملة'}
                  {property.category === 'Land' && 'أرض سكنية / تجارية'}
                  {property.category === 'Commercial' && 'عقار تجاري ومجمع خدمي'}
                </span>
                <span className="text-xs text-gray-400 mr-2">نشر في {formatDate(property.created_at || new Date().toISOString())}</span>
              </div>

              {/* Sharing button */}
              <button
                onClick={handleShare}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 font-semibold border border-gray-800 transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-[#c5a059]" />
                {copiedLink ? 'تم نسخ رابط العقار!' : 'مشاركة الرابط'}
              </button>
            </div>

            {/* Detailed specs box */}
            <h2 className="text-xl font-extrabold text-[#ebd7a7]">المميزات والمواصفات التفصيلية</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              
              <div className="p-4 bg-gray-950/40 rounded-xl border border-gray-800/40 light:bg-gray-50 light:border-gray-200">
                <span className="text-xs text-gray-400 block mb-1">المساحة الإجمالية</span>
                <div className="flex items-center gap-2 text-white dark:text-white light:text-gray-900">
                  <Layers className="w-5 h-5 text-[#c5a059]" />
                  <span className="text-base font-bold">{formatArea(property.area)}</span>
                </div>
              </div>

              {property.category !== 'Land' && property.category !== 'Commercial' && (
                <div className="p-4 bg-gray-950/40 rounded-xl border border-gray-800/40 light:bg-gray-50 light:border-gray-200">
                  <span className="text-xs text-gray-400 block mb-1">غرف النوم والصالات</span>
                  <div className="flex items-center gap-2 text-white dark:text-white light:text-gray-900">
                    <Home className="w-5 h-5 text-[#c5a059]" />
                    <span className="text-base font-bold">{(property.bedrooms)} غرف نوم</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-950/40 rounded-xl border border-gray-800/40 light:bg-gray-50 light:border-gray-200">
                <span className="text-xs text-gray-400 block mb-1">الموقع والتوطين</span>
                <div className="flex items-center gap-2 text-white dark:text-white light:text-gray-900">
                  <MapPin className="w-5 h-5 text-[#c5a059]" />
                  <span className="text-sm font-bold truncate">{property.province}، {property.city}</span>
                </div>
              </div>

            </div>

            {/* Description Paragraph */}
            <div className="space-y-4 pt-4 border-t border-gray-800/60">
              <h3 className="text-lg font-bold text-white dark:text-white light:text-gray-900">الوصف التفصيلي للعقار</h3>
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-800 leading-relaxed font-light whitespace-pre-line bg-gray-950/20 p-5 rounded-2xl border border-gray-900">
                {property.description}
              </p>
            </div>
          </div>
        </div>

        {/* COL 3: Pricing & Agency Contact (Sticky Widget) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* C. Interactive Call and Contact Canvas */}
          <div className="premium-blur-card rounded-2xl p-6 border border-gray-800/60 sticky top-24 shadow-2xl space-y-6">
            
            <div className="pb-4 border-b border-gray-800/60">
              <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1">القيمة الإجمالية المطلوبة</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-[#ebd7a7]">{formatPrice(property.price)}</span>
                {property.type === 'rent' && <span className="text-xs text-gray-400">/ شهرياً</span>}
              </div>
            </div>

            {/* Agency metadata layout */}
            <div className="space-y-4">
              <span className="text-xs text-brand-gold text-[#ebd7a7] font-bold block mb-2">المكتب العقاري المعتمد للعرض</span>
              <div className="bg-gray-950/60 light:bg-gray-50 rounded-xl p-4 border border-gray-800 text-right">
                <p className="font-extrabold text-sm text-white light:text-gray-900 mb-1">{property.agency_name || 'مكتب عقاري معتمد'}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>الرمز العقاري التعريفي: EP-{(property.id)}</span>
                </div>
                {property.agency_phone && (
                  <p className="text-xs font-mono text-gray-300 mt-1 pl-1" dir="ltr">{property.agency_phone}</p>
                )}
              </div>
            </div>

            {/* Calling action buttons */}
            <div className="space-y-3 pt-4">
              <a
                href={`tel:${property.agency_phone || '+9647701234567'}`}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 font-extrabold text-sm transition-transform shadow-lg shadow-[#c5a059]/10"
              >
                <Phone className="w-4 h-4" />
                اتصل بالوكيل الآن
              </a>

              <a
                href={`https://wa.me/${cleanPhoneForWhatsapp}?text=${encodeURIComponent(`مرحباً مكتب [${property.agency_name}]، أود الاستفسار عن تفاصيل وبيع عقاركم رقم EP-${property.id} المعنون: [ ${property.title} ] المعروض في المنصة العقارية العراقية.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                مراسلة فورية عبر واتساب
              </a>
            </div>

            {/* Security Notice */}
            <div className="text-[10px] text-gray-400 leading-relaxed bg-gray-950/20 p-3.5 rounded-xl border border-gray-900">
              ⚠️ <span className="font-bold text-gray-300">تنويه أمني:</span> جميع شركائنا مكاتب مجازة قانونياً وعقاراتها مفحوصة السند الطابو. مع ذلك، نوصي دائماً بإجراء الفحص الميداني القانوني المعتاد وسحب قيد العقار قبل تحويل الأموال.
            </div>

          </div>
        </div>
      </div>

      {/* 4. Similar properties segment */}
      {similar && similar.length > 0 && (
        <section className="mt-20 pt-10 border-t border-gray-800/80">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-[#ebd7a7] flex items-center gap-2">
                <Star className="w-5 h-5 text-[#c5a059]" />
                عقارات مشابهة قد تثير اهتمامك
              </h3>
              <p className="text-xs text-gray-500 mt-1">تضم نفس التصنيف ومن المعروضة في محافظات ومناطق متقاربة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similar.map((prop) => (
              <div 
                key={prop.id}
                onClick={() => onSelectProperty(prop.id)}
                className="premium-blur-card rounded-2xl overflow-hidden shadow-md group cursor-pointer hover:-translate-y-1 transition-all border border-gray-900 flex flex-col"
              >
                <div className="h-44 relative overflow-hidden">
                  <img src={prop.cover_image} alt={prop.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                  <span className="absolute top-3 right-3 bg-gray-950/80 text-xs px-2.5 py-1 rounded text-white font-bold">{prop.type === 'sale' ? 'للبيع' : 'للإيجار'}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-sm font-black text-[#c5a059] block mb-1">{formatPrice(prop.price)}</span>
                    <h4 className="text-xs font-bold text-gray-200 line-clamp-2 leading-relaxed min-h-[36px]">{prop.title}</h4>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-800/50 pt-2.5 mt-4 text-[11px] text-gray-400">
                    <span>{prop.province} - {prop.city}</span>
                    <span className="text-[#ebd7a7]">{formatArea(prop.area)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
