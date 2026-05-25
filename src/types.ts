export type UserRole = 'owner' | 'agency';

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface Agency {
  id: number;
  name: string;
  subscription_status: 'active' | 'inactive';
  created_at: string;
  phone?: string;
  user_id?: number; // connected back to users for authorization
  assigned_provinces?: string[]; // compiled from agency_locations
}

export interface AgencyLocation {
  agency_id: number;
  province: string;
}

export interface Property {
  id: number;
  agency_id: number;
  title: string;
  description: string;
  price: number;
  type: 'sale' | 'rent';
  category: 'Houses' | 'Apartments' | 'Land' | 'Commercial';
  city: string;
  province: string;
  area: number; // square meters
  bedrooms: number;
  cover_image: string;
  agency_name?: string;
  agency_phone?: string;
  images?: string[]; // property_images list
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
}

export interface PropertyRequest {
  id: number;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  buy_or_rent: 'buy' | 'rent';
  budget: number;
  description: string;
  created_at?: string;
}

export interface Subscription {
  id: number;
  agency_id: number;
  start_date: string;
  end_date: string;
}

export interface SearchFilters {
  category: string;
  type: string; // 'all' | 'sale' | 'rent'
  province: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  minArea: string;
  maxArea: string;
}

export const IRAQ_PROVINCES = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'النجف',
  'كربلاء',
  'الديوانية',
  'بابل',
  'ذي قار',
  'ميسان',
  'المثنى',
  'الأنبار',
  'واسط',
  'صلاح الدين',
  'ديالى',
  'كركوك',
  'السليمانية',
  'دهوك'
];

export const PROPERTY_CATEGORIES = [
  { value: 'Houses', label: 'منازل / فلل (Houses)' },
  { value: 'Apartments', label: 'شقق (Apartments)' },
  { value: 'Land', label: 'أراضي (Land)' },
  { value: 'Commercial', label: 'عقارات تجارية (Commercial)' }
];
