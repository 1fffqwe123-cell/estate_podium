import React, { useState } from 'react';
import { IRAQ_PROVINCES } from '../types';
import { Send, CheckCircle, ShieldAlert, BadgeInfo, ArrowLeftCircle } from 'lucide-react';

interface RequestSystemProps {
  setActiveTab: (tab: string) => void;
}

export default function RequestSystem({ setActiveTab }: RequestSystemProps) {
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [buyOrRent, setBuyOrRent] = useState<'buy' | 'rent'>('buy');
  const [budget, setBudget] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !province || !city || !budget || !description) {
      setError('يرجى تعبئة كافة الحقول العقارية المطلوبة في الاستمارة.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          province,
          city,
          buy_or_rent: buyOrRent,
          budget: parseFloat(budget),
          description
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'فشل المخدم العقاري عن إتمام التسجيل.');
      }

      setSuccess(true);
      // Reset
      setFullName('');
      setPhone('');
      setProvince('');
      setCity('');
      setBudget('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تقديم طلبك. يرجى تكرار المحاولة تالياً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      
      {/* Dynamic Header */}
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ebd7a7] leading-tight flex items-center justify-center gap-2">
          طلب عقار مخصص في العراق
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
          هل تواجه صعوبة في العثور على منزلك المناسب؟ أدخل حقول طلبك الآن، وسيقوم النظام بتوجيه طلبك <span className="text-[#c5a059] font-bold">فقط وحصرياً للمكاتب المعتمدة في نفس محافظتك</span> ليتواصلوا معك فوراً.
        </p>
      </div>

      {success ? (
        /* Absolutely breathtaking success submission state */
        <div className="premium-blur-card rounded-2xl p-8 sm:p-12 text-center border-t-4 border-t-green-500 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-green-500/5 blur-3xl rounded-full" />
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">تم تسجيل وتعميم طلبك بنجاح!</h2>
          <p className="text-gray-300 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            تمت أتمتة الطلب بنجاح. بموجب نظام الحماية المعتمد لدينا، لن يظهر طلبك وقنوات اتصالك إلا للوكلاء المعتمدين والنشطين ضمن المحافظة التي حددتها. ستتلقى مكالمات أو رسائل واتساب خلال ساعات قليلة قادمة.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              id="success_btn_home"
              onClick={() => setActiveTab('home')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] text-gray-950 font-bold text-sm shadow-md transition-all"
            >
              الرجوع لتصفح العقارات العامة
            </button>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-3 rounded-xl border border-gray-800 bg-gray-950/40 text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-semibold transition-colors"
            >
              تقديم استمارة طلب عقار آخر
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main inputs section */}
          <div className="lg:col-span-2 premium-blur-card rounded-2xl p-6 sm:p-8 border border-gray-800/80 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3" id="rq_form_title">تعبئة نموذج الطلب</h3>
            
            {error && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/20 text-red-400 text-xs mb-6 text-right">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-350 light:text-gray-750 mb-1.5">الاسم الكامل بالطابو أو اسم العائلة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: المهندس سجاد الخفاجي"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-[#c5a059] text-sm focus:outline-none text-white light:bg-white light:border-gray-200 light:text-gray-900"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-350 light:text-gray-750 mb-1.5">رقم الهاتف العراقي (اتصال + واتساب)</label>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 0770XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-[#c5a059] text-sm focus:outline-none text-white light:bg-white light:border-gray-200 light:text-gray-900 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selected Province */}
                <div>
                  <label className="block text-xs font-bold text-gray-350 light:text-gray-750 mb-1.5">محافظة الطلب المفضلة</label>
                  <select
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-[#c5a059] text-sm focus:outline-none text-gray-300 light:bg-white light:border-gray-200 light:text-gray-900"
                  >
                    <option value="">اختار المحافظة العقارية...</option>
                    {IRAQ_PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* District/City */}
                <div>
                  <label className="block text-xs font-bold text-gray-350 light:text-gray-750 mb-1.5">المدينة أو الحي السكني المطلوب</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حي الكرادة، الجزائر، حي العروبة"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-[#c5a059] text-sm focus:outline-none text-white light:bg-white light:border-gray-200 light:text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buy or Rent Tab Button Option */}
                <div>
                  <label className="block text-xs font-bold text-gray-350 light:text-gray-750 mb-1.5">خيار الطلب العقاري</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-gray-950/80 border border-gray-800 p-1.5 rounded-xl light:bg-gray-100 light:border-gray-200">
                    <button
                      type="button"
                      onClick={() => setBuyOrRent('buy')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        buyOrRent === 'buy'
                          ? 'bg-[#c5a059] text-gray-950 shadow'
                          : 'text-gray-400 hover:text-white light:text-gray-650'
                      }`}
                    >
                      أرغب بالشراء
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyOrRent('rent')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        buyOrRent === 'rent'
                          ? 'bg-[#c5a059] text-gray-950 shadow'
                          : 'text-gray-400 hover:text-white light:text-gray-650'
                      }`}
                    >
                      أرغب بالإيجار
                    </button>
                  </div>
                </div>

                {/* Budget Limit */}
                <div>
                  <label className="block text-xs font-bold text-gray-350 light:text-gray-750 mb-1.5">
                    الحد الأقصى للميزانية المرصودة (بالدينار العراقي)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="امثلة: 150000000 (150 مليون)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-[#c5a059] text-sm focus:outline-none text-white light:bg-white light:border-gray-200 light:text-gray-900"
                  />
                </div>
              </div>

              {/* Description box */}
              <div>
                <label className="block text-xs font-bold text-gray-350 light:text-gray-750 mb-1.5">ما هي المواصفات والتفاصيل التي تطلبها؟</label>
                <textarea
                  required
                  rows={4}
                  placeholder="مثال: ابحث عن بيت طابوق يتضمن على الاقل 3 غرف نوم وصالة كبيرة للأبناء مع حديقة صغيرة ومكان مخصص للسيارة، القرب من مدارس ومساحة لا تقل عن 200 م²."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-[#c5a059] text-sm focus:outline-none text-white light:bg-white light:border-gray-200 light:text-gray-900 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                id="submit_lead_btn"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#ebd7a7] hover:from-[#a17f40] hover:to-[#c5a059] disabled:from-gray-800 disabled:to-gray-900 text-gray-950 disabled:text-gray-500 font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/10"
              >
                {submitting ? 'جاري تعميم طلبك على الشبكة...' : 'إرسال وتعميم الطلب فوراً'}
                <Send className="w-4 h-4" />
              </button>

            </form>
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6 lg:col-span-1">
            {/* Guide Info */}
            <div className="bg-[#12161f] light:bg-[#f1f5f9] rounded-2xl p-5 border border-gray-800/60 shadow-lg space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BadgeInfo className="w-5 h-5 text-[#c5a059]" />
                <h4 className="font-extrabold text-[#ebd7a7] text-sm">كيف يعمل نظام التوجيه؟</h4>
              </div>
              <ul className="space-y-3.5 text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 leading-relaxed list-disc pr-4">
                <li>
                  عند إرسال طلبك، نقوم بمطابقة حقل <span className="text-[#ebd7a7] font-bold">"المحافظة العقارية"</span> الذي اخترته مع المكاتب العقارية المصنفة والمعينة لنفس نطاق المحافظة.
                </li>
                <li>
                  مكاتب المحافظة المعنية فقط (مثل الديوانية أو النجف) سيظهر لها طلبك بالكامل مع قنوات تواصلك، لتقديم أفضل العروض المتوفرة لديهم.
                </li>
                <li>
                  مكاتب المحافظات الأخرى <span className="text-red-400 font-bold">تُحظر تماماً</span> من رؤية بياناتك أو الحصول على رقم هاتفك لضمان تواصل متخصص ومريح.
                </li>
              </ul>
            </div>

            {/* Privacy Alert */}
            <div className="bg-[#1c1815] rounded-2xl p-5 border border-yellow-950/40 shadow-lg flex gap-3.5">
              <ShieldAlert className="w-6 h-6 text-[#c5a059] shrink-0" />
              <div className="text-xs space-y-1">
                <h5 className="font-extrabold text-[#ebd7a7]">ميثاق حماية الخصوصية</h5>
                <p className="text-gray-400 leading-relaxed font-light">
                  نحن في "المنصة العقارية" لا نبيع رقم هاتفك لجهات تسويقية خارجية أبداً. ينتهي ترخيص رؤية طلبك فور قيامك بتأكيد العثور على الوحدة أو انقضاء 30 يوماً تلقائياً على الطلب.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
