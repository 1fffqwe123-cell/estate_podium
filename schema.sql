-- schema.sql - Unified Cloudflare D1 Schema for Estate Podium (المنصة العقارية)
-- Perfectly supports both the Pages custom schema and the multi-agency dashboard layers.

DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS agency_locations;
DROP TABLE IF EXISTS agencies;
DROP TABLE IF EXISTS users;

-- 1. Users Security Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'agency'))
);

-- 2. Agencies Management Table
CREATE TABLE agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT,
  subscription_status TEXT NOT NULL CHECK(subscription_status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Agency Authorized Scope Table
CREATE TABLE agency_locations (
  agency_id INTEGER NOT NULL,
  province TEXT NOT NULL,
  PRIMARY KEY(agency_id, province),
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- 4. Unified Properties Table (Merging Pages schema and rich multi-agency dashboard schema)
CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  location TEXT, -- Pages custom schema: Combined Location Text
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 1, -- Pages custom schema: Bathroom count
  area REAL NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK(type IN ('sale', 'rent')),
  image_key TEXT, -- Pages custom schema: R2 Key
  featured INTEGER NOT NULL DEFAULT 0, -- Pages custom schema: Featured listing flag (0 or 1)
  category TEXT DEFAULT 'Houses' CHECK(category IN ('Houses', 'Apartments', 'Land', 'Commercial')),
  city TEXT DEFAULT '',
  province TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

-- 5. Property Showcase Gallery Images Table
CREATE TABLE property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 6. Lead Requests Table (Dashboard)
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  buy_or_rent TEXT NOT NULL CHECK(buy_or_rent IN ('buy', 'rent')),
  budget REAL NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 7. Inquiries Table (Pages custom schema)
CREATE TABLE inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 8. Subscriptions Ledger Table
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- PRIMARY SEED SYSTEM (ADMIN & SAMPLE DATA)
-- -----------------------------------------------------------------------------

-- Seed Admin User (username: Alihassan123 / password: aliali7777)
INSERT INTO users (id, username, password_hash, role) 
VALUES (1, 'Alihassan123', '$2a$10$wU05z9X7lCscXkG.8qS0reS0Q/2n.Yf7w8C8gN1WjGqf.S3Yw6i9m', 'owner');

-- Seed Agency User (username: AlRafidain_Estate / password: agency123)
INSERT INTO users (id, username, password_hash, role) 
VALUES (2, 'AlRafidain_Estate', '$2a$10$fWJ0UorqP0YhT7jQG4zJxeYlG5.s9f9Z.iO8.Oq/Gv3A4P8hbyS9e', 'agency');

INSERT INTO agencies (id, user_id, name, phone, subscription_status, created_at)
VALUES (1, 2, 'مكتب الرافدين للعقارات', '+964 770 123 4567', 'active', '2026-05-25T12:00:00Z');

INSERT INTO agency_locations (agency_id, province) VALUES (1, 'بغداد');
INSERT INTO agency_locations (agency_id, province) VALUES (1, 'الديوانية');

-- Insert at least 5 sample properties satisfying both formats
INSERT INTO properties (id, agency_id, title, description, price, location, bedrooms, bathrooms, area, type, image_key, featured, category, city, province, cover_image, created_at)
VALUES (
  1, 
  1, 
  'فيلا ملكية فاخرة بتصميم مودرن في الجادرية', 
  'فيلا مدهشة ذات تشطيبات تركية فاخرة بمساحة 300 متر مربع تتضمن 5 غرف نوم ملكية، مسبح خاص، صالة ضيوف واسعة جداً، تقع في أرقى المربعات السكنية في منطقة الجادرية ببغداد.', 
  450000000, 
  'بغداد - الجادرية', 
  5, 
  4, 
  300, 
  'sale', 
  'sample_villa.jpg', 
  1, 
  'Houses', 
  'الجادرية', 
  'بغداد', 
  '/api/images?key=sample_villa.jpg',
  '2026-05-26T12:00:00Z'
);

INSERT INTO properties (id, agency_id, title, description, price, location, bedrooms, bathrooms, area, type, image_key, featured, category, city, province, cover_image, created_at)
VALUES (
  2, 
  1, 
  'شقة بنتهاوس إطلالة مباشرة على جرف دجلة', 
  'شقة سكنية متكاملة مطلة مباشرة على ضفاف نهر دجلة الخالد في الأعظمية. تتكون من 3 غرف نوم مجهزة بأنظمة تكيف مركزي ذكية ومطبخ إيطالي مجهز بالكامل.', 
  1200000, 
  'بغداد - الأعظمية', 
  3, 
  2, 
  180, 
  'rent', 
  'sample_penthouse.jpg', 
  0, 
  'Apartments', 
  'الأعظمية', 
  'بغداد', 
  '/api/images?key=sample_penthouse.jpg',
  '2026-05-26T12:00:00Z'
);

INSERT INTO properties (id, agency_id, title, description, price, location, bedrooms, bathrooms, area, type, image_key, featured, category, city, province, cover_image, created_at)
VALUES (
  3, 
  1, 
  'أرض تجارية استثمارية على الشارع الرئيسي', 
  'أرض ممتازة للمستثمرين على الشارع العام للمحافظة، واجهة تجارية بعرض 20 متر صالحة لإنشاء مجمع عيادات أو مول تجاري أو صالات عرض. تتوفر كافة الخدمات والماء والكهرباء.', 
  850000000, 
  'الديوانية - وسط المدينة', 
  0, 
  0, 
  500, 
  'sale', 
  'sample_land.jpg', 
  1, 
  'Land', 
  'وسط المدينة', 
  'الديوانية', 
  '/api/images?key=sample_land.jpg',
  '2026-05-26T12:00:00Z'
);

INSERT INTO properties (id, agency_id, title, description, price, location, bedrooms, bathrooms, area, type, image_key, featured, category, city, province, cover_image, created_at)
VALUES (
  4, 
  1, 
  'مجمع تجاري ومكاتب مجهزة بالكامل', 
  'موقع تجاري حيوي جداً في النجف بوسط حي المحترفين مجهز بمصاعد كهربائية ومنظومة دفاع مدني ومواقف سيارات واسعة ومقرات إدارية مريحة.', 
  3500000, 
  'النجف - حي المحترفين', 
  0, 
  3, 
  450, 
  'rent', 
  'sample_commercial.jpg', 
  0, 
  'Commercial', 
  'حي المحترفين', 
  'النجف', 
  '/api/images?key=sample_commercial.jpg',
  '2016-05-26T12:00:00Z'
);

INSERT INTO properties (id, agency_id, title, description, price, location, bedrooms, bathrooms, area, type, image_key, featured, category, city, province, cover_image, created_at)
VALUES (
  5, 
  1, 
  'منزل عائلي فخم للبيع في حي الصدر', 
  'منزل متكامل الخدمات في محافظة الديوانية - حي الصدر، بناء حديث طابوق درجة أولى، يحتوي على 3 غرف نوم وصالة كبيرة وحديقة داخلية مريحة وموقف سيارة مستقل.', 
  195000000, 
  'الديوانية - حي الصدر', 
  3, 
  2, 
  200, 
  'sale', 
  'sample_house.jpg', 
  1, 
  'Houses', 
  'حي الصدر', 
  'الديوانية', 
  '/api/images?key=sample_house.jpg',
  '2026-05-26T12:00:00Z'
);

-- Seed Gallery imagery list
INSERT INTO property_images (property_id, image_url) VALUES (1, '/api/images?key=sample_villa.jpg');
INSERT INTO property_images (property_id, image_url) VALUES (2, '/api/images?key=sample_penthouse.jpg');
INSERT INTO property_images (property_id, image_url) VALUES (3, '/api/images?key=sample_land.jpg');
INSERT INTO property_images (property_id, image_url) VALUES (4, '/api/images?key=sample_commercial.jpg');
INSERT INTO property_images (property_id, image_url) VALUES (5, '/api/images?key=sample_house.jpg');
