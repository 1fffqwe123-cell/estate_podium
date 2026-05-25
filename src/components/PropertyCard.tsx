import React from 'react';
import { Property } from '../types';
import { formatPrice, formatArea } from '../utils';
import { Home, MapPin, Phone, MessageCircle, ArrowLeft, Layers } from 'lucide-react';

interface PropertyCardProps {
  key?: React.Key | any;
  property: Property;
  onSelect: (id: number) => void;
}

export default function PropertyCard({ property, onSelect }: PropertyCardProps) {
  // Convert Iraq phone numbers to international standard if needed for WhatsApp
  const rawPhone = property.agency_phone || '+9647701234567';
  const cleanPhoneForWhatsapp = rawPhone.replace(/\s+/g, '').replace('+', '');

  return (
    <div
      id={`property-card-${property.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden shadow-lg transition-all duration-300 premium-blur-card hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#c5a059]/5 border border-gray-800/40 relative"
    >
      {/* Sale/Rent & Category Badges */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold text-gray-950 shadow-md ${
          property.type === 'sale' 
            ? 'bg-gradient-to-r from-[#c5a059] to-[#ebd7a7]' // Sale is warm gold
            : 'bg-white' // Rent is clean white
        }`}>
          {property.type === 'sale' ? 'للبيع' : 'للإيجار'}
        </span>
      </div>

      <div className="absolute top-4 left-4 z-10">
        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-950/80 text-gray-300 border border-gray-800 backdrop-blur-md">
          {property.category === 'Houses' && 'منزل / فيلا'}
          {property.category === 'Apartments' && 'شقة'}
          {property.category === 'Land' && 'أرض سكنية'}
          {property.category === 'Commercial' && 'عقار تجاري'}
        </span>
      </div>

      {/* Property Thumbnail covering 100% of banner block with image optimization */}
      <div 
        onClick={() => onSelect(property.id)}
        className="relative h-56 sm:h-60 w-full overflow-hidden cursor-pointer"
      >
        <img
          src={property.cover_image}
          alt={property.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback static premium placeholder
            e.currentTarget.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-65 group-hover:opacity-50 transition-opacity" />
      </div>

      {/* Details Box */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Pricing tag */}
        <div className="mb-2.5">
          <span className="text-xl font-extrabold text-[#ebd7a7] dark:text-[#ebd7a7] light:text-[#a17f40]">
            {formatPrice(property.price)}
          </span>
          {property.type === 'rent' && (
            <span className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mr-1.5">/ شهرياً</span>
          )}
        </div>

        {/* Title */}
        <h3 
          onClick={() => onSelect(property.id)}
          className="text-base font-bold line-clamp-2 text-white dark:text-white light:text-gray-900 group-hover:text-[#c5a059] cursor-pointer transition-colors mb-3 h-12"
        >
          {property.title}
        </h3>

        {/* Location indicators */}
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs mb-4">
          <MapPin className="w-4 h-4 text-[#c5a059] shrink-0" />
          <span className="truncate">{property.province} ، {property.city}</span>
        </div>

        {/* Specs and area row */}
        <div className="flex items-center gap-4 py-3 border-y border-gray-800/50 light:border-gray-100/80 text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-5 mt-auto">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4 text-gray-500" />
            <span>المساحة:</span>
            <span className="font-bold text-white dark:text-white light:text-gray-900">{formatArea(property.area)}</span>
          </div>

          {property.category !== 'Land' && property.category !== 'Commercial' && (
            <div className="flex items-center gap-1">
              <Home className="w-4 h-4 text-gray-500" />
              <span>الغرف:</span>
              <span className="font-bold text-white dark:text-white light:text-gray-900">{(property.bedrooms)}</span>
            </div>
          )}
        </div>

        {/* Contact info and buttons */}
        <div className="flex flex-col gap-2.5">
          {property.agency_name && (
            <div className="text-[11px] text-gray-400 dark:text-gray-400 light:text-gray-600 truncate">
              الوكالة: <span className="text-gray-200 dark:text-gray-200 light:text-gray-900 font-medium">{property.agency_name}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2" id="property-card-ctas">
            {/* Quick Call */}
            <a
              href={`tel:${property.agency_phone || '+9647701234567'}`}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-800 text-gray-300 bg-gray-900/40 hover:bg-gray-800 light:border-gray-200 light:bg-gray-50 light:text-gray-700 hover:text-white transition-colors text-xs font-bold"
            >
              <Phone className="w-3.5 h-3.5 text-[#c5a059]" />
              اتصال مباشر
            </a>

            {/* Quick WhatsApp */}
            <a
              href={`https://wa.me/${cleanPhoneForWhatsapp}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن عقاركم المعلن باسم: "${property.title}" في المنصة العقارية.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors text-xs font-bold shadow-md shadow-green-900/10"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              واتساب
            </a>
          </div>

          <button
            onClick={() => onSelect(property.id)}
            className="w-full mt-1.5 py-2 rounded-xl text-center text-xs font-semibold text-[#c5a059] hover:text-white bg-[#c5a059]/10 hover:bg-[#c5a059] transition-all duration-300 flex items-center justify-center gap-1 border border-[#c5a059]/20"
          >
            تفاصيل العقار
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
