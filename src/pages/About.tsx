import React from 'react';
import { Building2, ShieldCheck, Users, Mail, Phone, MapPin, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-[#ebd7a7] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#c5a059] to-[#ebd7a7] flex items-center justify-center text-gray-950 shadow-xl shadow-[#c5a059]/10">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">حول المنصة العقارية - Estate Podium</h1>
          <p className="text-[#c5a059] text-sm font-medium tracking-wide uppercase">العراق الدليل العقاري الفخم المعتمد</p>
        </div>

        {/* Hero Card */}
        <div className="p-8 rounded-2xl border border-gray-800 bg-[#12161f] bg-opacity-80 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059] opacity-5 rounded-full blur-3xl"></div>
          <p className="text-right leading-relaxed text-sm text-gray-300">
            تأسست "المنصة العقارية" لتكون الواجهة والملاذ الرقمي الأول والأرقى لتسويق وتداول العقارات الفاخرة والاستثمارية في العراق. نحن نربط كبار المطورين والمكاتب العقارية المعتمدة بالعملاء والمستثمرين، لنوفر تجربة تصفح وبحث عقاري عصرية، آمنة وموثوقة تخضع لرقابة وتدقيق مستمر.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-gray-900 bg-gray-950/60 text-right space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] ml-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base">أمن ومصداقية تامة</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              نفحص تراخيص جميع المكاتب والعقارات المدرجة بالمنصة لمنع العروض الوهمية وضمان دقة المعلومات والطلب.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-gray-900 bg-gray-950/60 text-right space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] ml-auto">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base">شبكة وكالات معتمدة</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              مكاتب مميزة تغطي كافة المحافظات العراقية (بغداد، النجف، الديوانية، البصرة، وبقية مدن البلد الحبيب).
            </p>
          </div>

          <div className="p-6 rounded-xl border border-gray-900 bg-gray-950/60 text-right space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] ml-auto">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base">جودة الاختيار</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              يركز تصنيفنا على الفلل والقصور الحديثة، الشقق السكنية الفاخرة، والمقرات الإدارية والأراضي الممتازة.
            </p>
          </div>
        </div>

        {/* Office details and Contacts */}
        <div className="border-t border-gray-900 pt-10 text-right space-y-6">
          <h2 className="text-xl font-bold text-white">معلومات الاتصال والمقر الرئيسي</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-3 justify-end">
              <span>العراق، بغداد، الجادرية الكرادة</span>
              <MapPin className="w-5 h-5 text-[#c5a059]" />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <span dir="ltr">+964 770 123 4567</span>
              <Phone className="w-5 h-5 text-[#c5a059]" />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <span>support@estate-podium.com</span>
              <Mail className="w-5 h-5 text-[#c5a059]" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
