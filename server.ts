app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import multer from 'multer';

// -----------------------------------------------------------------------------
// SECRETS & PATHS
// -----------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'estate_podium_secret_key_2026';
const PORT = 3000;

// Initialize uploads archive directory mimicking R2
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// -----------------------------------------------------------------------------
// DATABASE INITIALIZATION & SCHEMA
// -----------------------------------------------------------------------------
const sqlite = new Database('sqlite.db');

// Enable foreign keys
sqlite.exec('PRAGMA foreign_keys = ON;');

// Create pure SQLite tables representing Cloudflare D1 Schema precisely
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'agency'))
  );

  CREATE TABLE IF NOT EXISTS agencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT,
    subscription_status TEXT NOT NULL CHECK(subscription_status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS agency_locations (
    agency_id INTEGER NOT NULL,
    province TEXT NOT NULL,
    PRIMARY KEY(agency_id, province),
    FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('sale', 'rent')),
    category TEXT NOT NULL CHECK(category IN ('Houses', 'Apartments', 'Land', 'Commercial')),
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    bedrooms INTEGER NOT NULL DEFAULT 0,
    area REAL NOT NULL DEFAULT 0,
    cover_image TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS property_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS requests (
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

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
  );
`);

// Drizzle ORM representation
export const db = drizzle(sqlite);

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit per image
});

// -----------------------------------------------------------------------------
// DATABASE INITIAL SEEDING (DEFENSIVE & AUTO-STABILIZED)
// -----------------------------------------------------------------------------

// 1. Seed Default Owner (Alihassan123 / aliali7777)
const ownerExists = sqlite.prepare('SELECT id FROM users WHERE username = ?;').get('Alihassan123');
if (!ownerExists) {
  const ownerPassHash = bcrypt.hashSync('aliali7777', 10);
  sqlite.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?);').run(
    'Alihassan123',
    ownerPassHash,
    'owner'
  );
  console.log('Seeded Owner Account: Alihassan123');
}

// 2. Seed default AlRafidain_Estate (AlRafidain_Estate / agency123)
const agency1UserCheck = sqlite.prepare('SELECT id FROM users WHERE username = ?;').get('AlRafidain_Estate');
if (!agency1UserCheck) {
  const agency1PassHash = bcrypt.hashSync('agency123', 10);
  sqlite.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?);').run(
    'AlRafidain_Estate',
    agency1PassHash,
    'agency'
  );
  const agency1UserId = sqlite.prepare('SELECT last_insert_rowid() as id;').get() as { id: number };

  sqlite.prepare('INSERT INTO agencies (user_id, name, phone, subscription_status, created_at) VALUES (?, ?, ?, ?, ?);').run(
    agency1UserId.id,
    'مكتب الرافدين للعقارات',
    '+964 770 123 4567',
    'active',
    new Date().toISOString()
  );
  const agency1Id = sqlite.prepare('SELECT last_insert_rowid() as id;').get() as { id: number };

  // Assign Baghdad and Diwaniyah to Al Rafidain Estate
  sqlite.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').run(agency1Id.id, 'بغداد');
  sqlite.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').run(agency1Id.id, 'الديوانية');
  console.log('Seeded Agency Account: AlRafidain_Estate');
}

// 3. Seed default AlFurat_Estate if missing
const agency2UserCheck = sqlite.prepare('SELECT id FROM users WHERE username = ?;').get('AlFurat_Estate');
if (!agency2UserCheck) {
  const agency2PassHash = bcrypt.hashSync('agency123', 10);
  sqlite.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?);').run(
    'AlFurat_Estate',
    agency2PassHash,
    'agency'
  );
  const agency2UserId = sqlite.prepare('SELECT last_insert_rowid() as id;').get() as { id: number };

  sqlite.prepare('INSERT INTO agencies (user_id, name, phone, subscription_status, created_at) VALUES (?, ?, ?, ?, ?);').run(
    agency2UserId.id,
    'مكتب الفرات للعقارات والمقاولات',
    '+964 780 987 6543',
    'active',
    new Date().toISOString()
  );
  const agency2Id = sqlite.prepare('SELECT last_insert_rowid() as id;').get() as { id: number };

  // Assign Diwaniyah and النجف to Al Furat
  sqlite.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').run(agency2Id.id, 'الديوانية');
  sqlite.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').run(agency2Id.id, 'النجف');
  console.log('Seeded Agency Account: AlFurat_Estate');
}

// 4. Seed properties only if database contains absolutely no properties
const propCount = sqlite.prepare('SELECT count(*) as count FROM properties;').get() as { count: number };
if (propCount.count === 0) {
  const agency1 = sqlite.prepare("SELECT id FROM agencies WHERE name = 'مكتب الرافدين للعقارات';").get() as { id: number } | undefined;
  const agency2 = sqlite.prepare("SELECT id FROM agencies WHERE name = 'مكتب الفرات للعقارات والمقاولات';").get() as { id: number } | undefined;

  if (agency1 && agency2) {
    const sampleProperties = [
      {
        agency_id: agency1.id,
        title: 'فيلا ملكية فاخرة بتصميم مودرن في الجادرية',
        description: 'فيلا مدهشة ذات تشطيبات تركية فاخرة بمساحة 300 متر مربع تتضمن 5 غرف نوم ملكية، مسبح خاص، صالة ضيوف واسعة جداً، تقع في أرقى المربعات السكنية في منطقة الجادرية ببغداد.',
        price: 450000000, // 450M IQD
        type: 'sale',
        category: 'Houses',
        city: 'الجادرية',
        province: 'بغداد',
        bedrooms: 5,
        area: 300,
        cover_image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'
      },
      {
        agency_id: agency1.id,
        title: 'شقة بنتهاوس إطلالة مباشرة على دجلة',
        description: 'شقة سكنية متكاملة مطلة مباشرة على ضفاف نهر دجلة الخالد في الأعظمية. تتكون من 3 غرف نوم مجهزة بأنظمة تكيف مركزي ذكية ومطبخ إيطالي مجهز بالكامل.',
        price: 1200000, // 1.2M IQD per month
        type: 'rent',
        category: 'Apartments',
        city: 'الأعظمية',
        province: 'بغداد',
        bedrooms: 3,
        area: 180,
        cover_image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
      },
      {
        agency_id: agency2.id,
        title: 'أرض تجارية استثمارية على شارع الديوانية الرئيسي',
        description: 'أرض ممتازة للمستثمرين على الشارع العام للمحافظة، واجهة تجارية بعرض 20 متر صالحة لإنشاء مجمع عيادات أو مول تجاري أو صالات عرض. تتوفر كافة الخدمات والماء والكهرباء.',
        price: 850000000, 
        type: 'sale',
        category: 'Land',
        city: 'وسط المدينة',
        province: 'الديوانية',
        bedrooms: 0,
        area: 500,
        cover_image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
      },
      {
        agency_id: agency2.id,
        title: 'مجمع تجاري ومخازن مجهزة بالكامل',
        description: 'موقع تجاري حيوي جداً في النجف بوسط حي المحترفين مجهز بمصاعد كهربائية ومنظومة دفاع مدني ومواقف سيارات واسعة ومقرات إدارية مريحة.',
        price: 3500000, 
        type: 'rent',
        category: 'Commercial',
        city: 'حي المحترفين',
        province: 'النجف',
        bedrooms: 0,
        area: 450,
        cover_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        agency_id: agency2.id,
        title: 'منزل عائلي فخم للبيع في حي الصدر',
        description: 'منزل متكامل الخدمات في محافظة الديوانية - حي الصدر، بناء حديث طابوق درجة أولى، يحتوي على 3 غرف نوم وصالة كبيرة وحديقة داخلية مريحة وموقف سيارة مستقل.',
        price: 195000000, 
        type: 'sale',
        category: 'Houses',
        city: 'حي الصدر',
        province: 'الديوانية',
        bedrooms: 3,
        area: 200,
        cover_image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const p of sampleProperties) {
      sqlite.prepare(`
        INSERT INTO properties (agency_id, title, description, price, type, category, city, province, bedrooms, area, cover_image, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `).run(
        p.agency_id, p.title, p.description, p.price, p.type, p.category, p.city, p.province,
        p.bedrooms, p.area, p.cover_image, new Date().toISOString()
      );
      const propId = sqlite.prepare('SELECT last_insert_rowid() as id;').get() as { id: number };

      sqlite.prepare('INSERT INTO property_images (property_id, image_url) VALUES (?, ?);').run(propId.id, p.cover_image);
      sqlite.prepare('INSERT INTO property_images (property_id, image_url) VALUES (?, ?);').run(
        propId.id,
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
      );
    }
  }

  // Seed sample requests for demonstration with location scopes
  sqlite.prepare(`
    INSERT INTO requests (full_name, phone, province, city, buy_or_rent, budget, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `).run(
    'علي المحمداوي',
    '+964 782 555 1122',
    'الديوانية',
    'حي العروبة',
    'buy',
    220000000,
    'أبحث عن بيت للشراء مستقل في الديوانية بسعر لا يتجاوز 220 مليون دينار عراقي ويكون ذو خدمات متوفرة وقريب من السوق الرئيسي.',
    new Date().toISOString()
  );

  sqlite.prepare(`
    INSERT INTO requests (full_name, phone, province, city, buy_or_rent, budget, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `).run(
    'مصطفى البصراوي',
    '+964 771 444 9900',
    'البصرة',
    'الجزائر',
    'rent',
    800000,
    'شقة طابق أول أو مع مصعد للإيجار السكني في منطقة الجزائر يفضل غرفتين نوم وصالة مجهزة بالتكييف.',
    new Date().toISOString()
  );

  console.log('Database seeded successfully with sample properties & requests.');
}

// -----------------------------------------------------------------------------
// APP MIDDLEWARES & ROBUST JSON INTERCEPTORS
// -----------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use(cookieParser());

// Robust global JSON parser & interceptor middleware to guarantee non-empty JSON bodies
app.use((req: any, res: any, next: any) => {
  const originalJson = res.json;
  const originalSend = res.send;

  // Intercept res.json
  res.json = function (body: any) {
    if (body && typeof body === 'object') {
      if (body.error && body.success === undefined) {
        body.success = false;
        body.message = body.error;
      }
      if (res.statusCode >= 400) {
        body.success = false;
        if (!body.message) {
          body.message = body.error || 'حدث خطأ في معالجة طلبك.';
        }
      } else {
        if (body.success === undefined) {
          body.success = true;
        }
      }
    } else if (body === undefined || body === null || body === '') {
      body = {
        success: res.statusCode < 400,
        message: res.statusCode < 400 ? 'تمت العملية بنجاح' : 'فشل تنفيذ الطلب.'
      };
    }
    return originalJson.call(this, body);
  };

  // Intercept res.send to protect against empty responses
  res.send = function (body: any) {
    if (body === undefined || body === null || body === '') {
      return res.json({
        success: res.statusCode < 400,
        message: res.statusCode < 400 ? 'تمت العملية بنجاح' : 'فشل تنفيذ الطلب.'
      });
    }
    return originalSend.call(this, body);
  };

  next();
});

// Expose public uploads folder
app.use('/uploads', express.static(uploadsDir));

// -----------------------------------------------------------------------------
// JWT & RBAC SECURITY MIDDLEWARE
// -----------------------------------------------------------------------------
const authenticateUser = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'لم يتم العثور على صلاحيات تسجيل الدخول. يرجى تسجيل الدخول أولاً.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      role: 'owner' | 'agency';
      agencyId?: number;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'جلستك منتهية الصلاحية أو غير صالحة.' });
  }
};

const requireOwner = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ success: false, error: 'هذا الإجراء متاح فقط لمالك المنصة.' });
  }
  next();
};

const requireAgency = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'agency') {
    return res.status(403).json({ success: false, error: 'هذا الإجراء متاح فقط للوكالات العقارية المعتمدة.' });
  }
  next();
};

// -----------------------------------------------------------------------------
// SECURE PAGE-LEVEL MIDDLEWARE FOR /admin, /agency, /dashboard
// -----------------------------------------------------------------------------
app.get(['/admin', '/agency', '/dashboard'], (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      role: 'owner' | 'agency';
      agencyId?: number;
    };

    const targetPath = req.path;
    
    // System must always validate matching roles for backend views
    if (targetPath === '/admin' && decoded.role !== 'owner') {
      return res.redirect('/login');
    }
    if (targetPath === '/agency' && decoded.role !== 'agency') {
      return res.redirect('/login');
    }
    if (targetPath === '/dashboard') {
      if (decoded.role !== 'owner' && decoded.role !== 'agency') {
        return res.redirect('/login');
      }
    }

    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
});

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// METHOD GUARDS: Guarantee /api/login and /api/auth/login only accept POST requests
app.all('/api/login', (req, res, next) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'عذراً، هذا الإجراء غير مسموح لهذه الطريقة. يُرجى محاولة تسجيل الدخول مرة أخرى باستخدام نموذج تسجيل الدخول.'
    });
  }
  next();
});

app.all('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'عذراً، هذا الإجراء غير مسموح لهذه الطريقة. يُرجى محاولة تسجيل الدخول مرة أخرى باستخدام نموذج تسجيل الدخول.'
    });
  }
  next();
});

// -- 1. Authentication Login --
app.post(['/api/login', '/api/auth/login'], (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const user = sqlite.prepare('SELECT * FROM users WHERE username = ?;').get(username) as {
      id: number;
      username: string;
      password_hash: string;
      role: 'owner' | 'agency';
    } | undefined;

    if (!user) {
      return res.status(401).json({ success: false, error: 'خطأ في اسم المستخدم أو كلمة المرور' });
    }

    const passwordsMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordsMatch) {
      return res.status(401).json({ success: false, error: 'خطأ في اسم المستخدم أو كلمة المرور' });
    }

    // Capture Agency details if they correspond to agency role
    let agencyId: number | undefined;
    let agencyName: string | undefined;
    if (user.role === 'agency') {
      const agencyInfo = sqlite.prepare('SELECT id, name, subscription_status FROM agencies WHERE user_id = ?;').get(user.id) as {
        id: number;
        name: string;
        subscription_status: 'active' | 'inactive';
      } | undefined;
      
      if (agencyInfo?.subscription_status === 'inactive') {
        return res.status(403).json({ success: false, error: 'الاشتراك الخاص بالوكالة غير فعال حالياً، يرجى التواصل مع الإدارة.' });
      }
      
      agencyId = agencyInfo?.id;
      agencyName = agencyInfo?.name;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, agencyId, agencyName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure HttpOnly path-strict cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({
      success: true,
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        agencyId,
        agencyName
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'حدث خطأ في تقديم الخدمة: ' + err.message, message: 'حدث خطأ في تقديم الخدمة: ' + err.message });
  }
});

// -- 2. Authentication Logout --
app.post('/api/auth/logout', (req, res) => {
  try {
    res.clearCookie('token');
    return res.json({ success: true, status: 'success', message: 'تم تسجل الخروج بنجاح.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

// -- 3. Get Authenticated Profile --
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json({ success: true, user: null });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Refresh database details in case subscription status was updated
    if (decoded.role === 'agency') {
      const updatedAgency = sqlite.prepare('SELECT subscription_status FROM agencies WHERE id = ?;').get(decoded.agencyId) as {
        subscription_status: string;
      } | undefined;
      if (updatedAgency && updatedAgency.subscription_status === 'inactive') {
        res.clearCookie('token');
        return res.json({ success: true, user: null, error: 'تم تعطيل حسابك العقاري بسبب عدم سداد الاشتراك.' });
      }
    }
    return res.json({ success: true, user: decoded });
  } catch (err) {
    res.clearCookie('token');
    return res.json({ success: true, user: null });
  }
});

// -- 4. Update Credentials --
app.post('/api/auth/change-credentials', authenticateUser, (req: any, res) => {
  try {
    const { newUsername, newPassword } = req.body;
    const currentUserId = req.user.userId;

    if (!newUsername && !newPassword) {
      return res.status(400).json({ success: false, error: 'يرجى تقديم بيانات التحديث.' });
    }

    if (newUsername) {
      // Ensure username uniqueness
      const existingUser = sqlite.prepare('SELECT id FROM users WHERE username = ? AND id != ?;').get(newUsername, currentUserId);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'اسم المستخدم هذا مستخدم مسبقاً من قبل عضو آخر.' });
      }
      sqlite.prepare('UPDATE users SET username = ? WHERE id = ?;').run(newUsername, currentUserId);
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'يجب أن لا تقل كلمة المرور عن 6 حروف.' });
      }
      const newHash = bcrypt.hashSync(newPassword, 10);
      sqlite.prepare('UPDATE users SET password_hash = ? WHERE id = ?;').run(newHash, currentUserId);
    }

    // Refresh JWT
    const updatedUser = sqlite.prepare('SELECT * FROM users WHERE id = ?;').get(currentUserId) as any;
    const token = jwt.sign(
      { 
        userId: updatedUser.id, 
        username: updatedUser.username, 
        role: updatedUser.role,
        agencyId: req.user.agencyId,
        agencyName: req.user.agencyName
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, status: 'success', message: 'تم تحديث البيانات الأمنية بنجاح.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'خطأ بالخادم: ' + err.message, message: 'خطأ بالخادم: ' + err.message });
  }
});

// -- 5. Properties Listing API (Filtering, Infinite Scroll, Pagination) --
app.get('/api/properties', (req, res) => {
  try {
    const {
      category, type, province, city, minPrice, maxPrice, bedrooms, minArea, maxArea, page = 1, limit = 10, agency_id
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page as string) || 1);
    const parsedLimit = Math.max(1, parseInt(limit as string) || 10);
    const offset = (parsedPage - 1) * parsedLimit;

    let queryStr = `
      SELECT p.*, a.name as agency_name, a.phone as agency_phone 
      FROM properties p 
      JOIN agencies a ON p.agency_id = a.id
      WHERE a.subscription_status = 'active'
    `;
    const params: any[] = [];

    if (category && category !== 'all' && category !== '') {
      queryStr += ` AND p.category = ?`;
      params.push(category);
    }

    if (type && type !== 'all' && type !== '') {
      queryStr += ` AND p.type = ?`;
      params.push(type);
    }

    if (province && province !== 'all' && province !== '') {
      queryStr += ` AND p.province = ?`;
      params.push(province);
    }

    if (city && city !== '') {
      queryStr += ` AND p.city LIKE ?`;
      params.push(`%${city}%`);
    }

    if (minPrice && minPrice !== '') {
      queryStr += ` AND p.price >= ?`;
      params.push(parseFloat(minPrice as string));
    }

    if (maxPrice && maxPrice !== '') {
      queryStr += ` AND p.price <= ?`;
      params.push(parseFloat(maxPrice as string));
    }

    if (bedrooms && bedrooms !== 'all' && bedrooms !== '') {
      queryStr += ` AND p.bedrooms >= ?`;
      params.push(parseInt(bedrooms as string));
    }

    if (minArea && minArea !== '') {
      queryStr += ` AND p.area >= ?`;
      params.push(parseFloat(minArea as string));
    }

    if (maxArea && maxArea !== '') {
      queryStr += ` AND p.area <= ?`;
      params.push(parseFloat(maxArea as string));
    }

    if (agency_id) {
      queryStr += ` AND p.agency_id = ?`;
      params.push(parseInt(agency_id as string));
    }

    // Count total matching listings to calculate pagination state
    let countQuery = queryStr.replace('SELECT p.*, a.name as agency_name, a.phone as agency_phone', 'SELECT COUNT(*) as total');
    const countRes = sqlite.prepare(countQuery).get(...params) as { total: number };

    queryStr += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    const list = sqlite.prepare(queryStr).all(...params);
    return res.json({
      success: true,
      properties: list,
      page: parsedPage,
      limit: parsedLimit,
      total: countRes.total,
      hasMore: offset + list.length < countRes.total
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'حدث خلل في استعلام العقارات: ' + err.message, message: 'حدث خلل في استعلام العقارات: ' + err.message });
  }
});

// -- 6. Single Property Details + Similar Gallery Items --
app.get('/api/properties/:id', (req, res) => {
  try {
    const { id } = req.params;
    const property = sqlite.prepare(`
      SELECT p.*, a.name as agency_name, a.phone as agency_phone 
      FROM properties p 
      JOIN agencies a ON p.agency_id = a.id 
      WHERE p.id = ?;
    `).get(id) as any;

    if (!property) {
      return res.status(404).json({ success: false, error: 'العقار المطلوب غير موجود أو تم إزالته مسبقاً.' });
    }

    const images = sqlite.prepare('SELECT image_url FROM property_images WHERE property_id = ?;').all(id) as { image_url: string }[];
    property.images = images.map(img => img.image_url);

    // Get similar properties in the same category & province
    const similar = sqlite.prepare(`
      SELECT p.*, a.name as agency_name, a.phone as agency_phone 
      FROM properties p 
      JOIN agencies a ON p.agency_id = a.id 
      WHERE p.category = ? AND p.province = ? AND p.id != ? AND a.subscription_status = 'active'
      LIMIT 3;
    `).all(property.category, property.province, id);

    return res.json({ success: true, property, similar });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل استعلام تفاصيل العقار: ' + err.message, message: 'فشل استعلام تفاصيل العقار: ' + err.message });
  }
});

// -- 7. Multer Image Upload (Cloudflare R2 mock) --
app.post('/api/upload', authenticateUser, upload.array('images', 8), (req: any, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'يرجى اختيار صور صالحة لرفعها.' });
    }

    const urls = req.files.map((file: any) => `/uploads/${file.filename}`);
    return res.json({ success: true, urls });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل في رفع الصور: ' + err.message, message: 'فشل في رفع الصور: ' + err.message });
  }
});

// -- 8. Add Property Listing (Agency only) --
app.post('/api/properties', authenticateUser, requireAgency, (req: any, res) => {
  try {
    const {
      title, description, price, type, category, city, province, bedrooms, area, cover_image, images
    } = req.body;

    const agencyId = req.user.agencyId;
    if (!agencyId) {
      return res.status(403).json({ success: false, error: 'صلاحيات الوكالة غير مكتملة.' });
    }

    if (!title || !description || !price || !type || !category || !city || !province || !cover_image) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال كافة الحقول الإجبارية للعقار.' });
    }

    const insertRes = sqlite.prepare(`
      INSERT INTO properties (agency_id, title, description, price, type, category, city, province, bedrooms, area, cover_image, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      agencyId, title, description, parseFloat(price), type, category, city, province,
      parseInt(bedrooms) || 0, parseFloat(area) || 0, cover_image, new Date().toISOString()
    );

    const propertyId = insertRes.lastInsertRowid;

    // Insert associated images
    if (images && Array.isArray(images)) {
      for (const url of images) {
        sqlite.prepare('INSERT INTO property_images (property_id, image_url) VALUES (?, ?);').run(propertyId, url);
      }
    } else {
      sqlite.prepare('INSERT INTO property_images (property_id, image_url) VALUES (?, ?);').run(propertyId, cover_image);
    }

    return res.json({ success: true, status: 'success', message: 'تم إدراج العقار بنجاح لتصفح العملاء.', propertyId });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'خطأ بالخادم: ' + err.message, message: 'خطأ بالخادم: ' + err.message });
  }
});

// -- 9. Edit Property Listing --
app.put('/api/properties/:id', authenticateUser, requireAgency, (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, price, type, category, city, province, bedrooms, area, cover_image, images
    } = req.body;

    const existing = sqlite.prepare('SELECT agency_id FROM properties WHERE id = ?;').get(id) as { agency_id: number } | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'العقار غير موجود.' });
    }

    if (existing.agency_id !== req.user.agencyId) {
      return res.status(403).json({ success: false, error: 'لا تملك صلاحيات تعديل بيانات هذا العقار.' });
    }

    sqlite.prepare(`
      UPDATE properties 
      SET title = ?, description = ?, price = ?, type = ?, category = ?, city = ?, province = ?, bedrooms = ?, area = ?, cover_image = ?
      WHERE id = ?;
    `).run(
      title, description, parseFloat(price), type, category, city, province,
      parseInt(bedrooms) || 0, parseFloat(area) || 0, cover_image, id
    );

    if (images && Array.isArray(images)) {
      sqlite.prepare('DELETE FROM property_images WHERE property_id = ?;').run(id);
      for (const url of images) {
        sqlite.prepare('INSERT INTO property_images (property_id, image_url) VALUES (?, ?);').run(id, url);
      }
    }

    return res.json({ success: true, status: 'success', message: 'تم تعديل تفاصيل العقار بنجاح.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء تعديل العقار: ' + err.message, message: 'حدث خطأ أثناء تعديل العقار: ' + err.message });
  }
});

// -- 10. Delete Property Listing --
app.delete('/api/properties/:id', authenticateUser, (req: any, res) => {
  try {
    const { id } = req.params;
    const propertyObj = sqlite.prepare('SELECT agency_id FROM properties WHERE id = ?;').get(id) as { agency_id: number } | undefined;
    if (!propertyObj) {
      return res.status(404).json({ success: false, error: 'العقار غير موجود لتتم إزالته.' });
    }

    if (req.user.role === 'agency' && propertyObj.agency_id !== req.user.agencyId) {
      return res.status(403).json({ success: false, error: 'لا تملك صلاحية لحذف هذا العقار.' });
    }

    sqlite.prepare('DELETE FROM properties WHERE id = ?;').run(id);
    return res.json({ success: true, status: 'success', message: 'تم حذف الإعلان العقاري بنجاح.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل حذف العقار كلياً: ' + err.message, message: 'فشل حذف العقار كلياً: ' + err.message });
  }
});

// -- 11. Lead Requests - Submit Request --
app.post('/api/requests', (req, res) => {
  try {
    const { full_name, phone, province, city, buy_or_rent, budget, description } = req.body;

    if (!full_name || !phone || !province || !city || !buy_or_rent || !budget || !description) {
      return res.status(400).json({ success: false, error: 'يرجى ملء جميع الحقول المطلوبة لتقديم طلبك.' });
    }

    sqlite.prepare(`
      INSERT INTO requests (full_name, phone, province, city, buy_or_rent, budget, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      full_name, phone, province, city, buy_or_rent, parseFloat(budget), description, new Date().toISOString()
    );
    return res.json({ success: true, status: 'success', message: 'تم إرسال طلبك العقاري بنجاح. ستتواصل معك الوكالات المختصة قريباً.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء تقديم الطلب: ' + err.message, message: 'حدث خطأ أثناء تقديم الطلب: ' + err.message });
  }
});

// -- 12. View Lead Requests with RBAC --
app.get('/api/requests', authenticateUser, (req: any, res) => {
  try {
    if (req.user.role === 'owner') {
      const allRequests = sqlite.prepare('SELECT * FROM requests ORDER BY id DESC;').all();
      return res.json({ success: true, requests: allRequests });
    } else {
      const agencyLocs = sqlite.prepare('SELECT province FROM agency_locations WHERE agency_id = ?;').all(req.user.agencyId) as { province: string }[];
      const assignedProvinces = agencyLocs.map(l => l.province);

      if (assignedProvinces.length === 0) {
        return res.json({ success: true, requests: [], message: 'الوكالة العقارية تملك حساباً غير معين لأي محافظة للاطلاع على الطلبات.' });
      }

      const placeholders = assignedProvinces.map(() => '?').join(',');
      const localizedRequests = sqlite.prepare(`
        SELECT * FROM requests 
        WHERE province IN (${placeholders})
        ORDER BY id DESC;
      `).all(...assignedProvinces);

      return res.json({ success: true, requests: localizedRequests });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل جلب الطلبات العقارية: ' + err.message, message: 'فشل جلب الطلبات العقارية: ' + err.message });
  }
});

// -- 13. Owner View Registered Agencies --
app.get('/api/agencies', authenticateUser, requireOwner, (req, res) => {
  try {
    const agenciesList = sqlite.prepare(`
      SELECT a.*, u.username as username 
      FROM agencies a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC;
    `).all() as any[];

    for (const a of agenciesList) {
      const locs = sqlite.prepare('SELECT province FROM agency_locations WHERE agency_id = ?;').all(a.id) as { province: string }[];
      a.provinces = locs.map(l => l.province);
    }

    return res.json({ success: true, agencies: agenciesList });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل استجرار بيانات الوكالات: ' + err.message, message: 'فشل استجرار بيانات الوكالات: ' + err.message });
  }
});

// -- 14. Owner Create Agency --
app.post('/api/agencies', authenticateUser, requireOwner, (req, res) => {
  try {
    const { name, phone, username, password, provinces } = req.body;

    if (!name || !phone || !username || !password || !provinces || !Array.isArray(provinces)) {
      return res.status(400).json({ success: false, error: 'يرجى تقديم كافة معلومات الوكالة العقارية متبوعة بقائمة المحافظات المسؤولة عنها.' });
    }

    const testUser = sqlite.prepare('SELECT id FROM users WHERE username = ?;').get(username);
    if (testUser) {
      return res.status(400).json({ success: false, error: 'اسم مستخدم الوكالة المودع مسجل مسبقاً.' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const userInsert = sqlite.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?);').run(
      username, hashed, 'agency'
    );
    const userId = userInsert.lastInsertRowid;

    const agencyInsert = sqlite.prepare('INSERT INTO agencies (user_id, name, phone, subscription_status, created_at) VALUES (?, ?, ?, ?, ?);').run(
      userId, name, phone, 'active', new Date().toISOString()
    );
    const agencyId = agencyInsert.lastInsertRowid;

    for (const prov of provinces) {
      sqlite.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').run(agencyId, prov);
    }

    // Insert entry in subscriptions table
    sqlite.prepare('INSERT INTO subscriptions (agency_id, start_date, end_date) VALUES (?, ?, ?);').run(
      agencyId,
      new Date().toISOString(),
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    );

    return res.json({ success: true, status: 'success', message: 'تم تسجيل الوكالة العقارية وربط صلاحياتها بنجاح.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل في تهيئة حساب الوكالة: ' + err.message, message: 'فشل في تهيئة حساب الوكالة: ' + err.message });
  }
});

// -- 15. Owner Edit Agency --
app.put('/api/agencies/:id', authenticateUser, requireOwner, (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, subscription_status, provinces } = req.body;

    sqlite.prepare('UPDATE agencies SET name = ?, phone = ?, subscription_status = ? WHERE id = ?;').run(
      name, phone, subscription_status, id
    );

    if (provinces && Array.isArray(provinces)) {
      sqlite.prepare('DELETE FROM agency_locations WHERE agency_id = ?;').run(id);
      for (const prov of provinces) {
        sqlite.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').run(id, prov);
      }
    }

    return res.json({ success: true, status: 'success', message: 'تم تحديث بيانات الوكالة والمحافظات المخصصة لها.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'خطأ: ' + err.message, message: 'خطأ: ' + err.message });
  }
});

// -- 16. Owner Delete Agency --
app.delete('/api/agencies/:id', authenticateUser, requireOwner, (req, res) => {
  try {
    const { id } = req.params;
    const agencyObj = sqlite.prepare('SELECT user_id FROM agencies WHERE id = ?;').get(id) as { user_id: number } | undefined;
    if (!agencyObj) {
      return res.status(404).json({ success: false, error: 'الوكالة العقارية غير معثور عليها.' });
    }

    sqlite.prepare('DELETE FROM users WHERE id = ?;').run(agencyObj.user_id);
    return res.json({ success: true, status: 'success', message: 'تم إزالة الوكالة العقارية وصلاحياتها بالكامل.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل أثناء الإزالة الكلية: ' + err.message, message: 'فشل أثناء الإزالة الكلية: ' + err.message });
  }
});

// -- 17. Owner Dashboard Analytics --
app.get('/api/owner/analytics', authenticateUser, requireOwner, (req, res) => {
  try {
    const totalProperties = sqlite.prepare('SELECT COUNT(*) as count FROM properties;').get() as { count: number };
    const totalAgencies = sqlite.prepare('SELECT COUNT(*) as count FROM agencies;').get() as { count: number };
    const totalRequests = sqlite.prepare('SELECT COUNT(*) as count FROM requests;').get() as { count: number };
    const typeDistribution = sqlite.prepare('SELECT type, COUNT(*) as count FROM properties GROUP BY type;').all() as { type: string, count: number }[];
    const categoryDistribution = sqlite.prepare('SELECT category, COUNT(*) as count FROM properties GROUP BY category;').all() as { category: string, count: number }[];
    const provincialProperties = sqlite.prepare('SELECT province, COUNT(*) as count FROM properties GROUP BY province;').all() as { province: string, count: number }[];

    return res.json({
      success: true,
      propertyCount: totalProperties.count,
      agencyCount: totalAgencies.count,
      requestCount: totalRequests.count,
      types: typeDistribution,
      categories: categoryDistribution,
      provinces: provincialProperties
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'تحليل البيانات الخدمي واجه أخطاء: ' + err.message, message: 'تحليل البيانات الخدمي واجه أخطاء: ' + err.message });
  }
});

// -----------------------------------------------------------------------------
// APP-WIDE GLOBAL EXCEPTION HANDLER
// -----------------------------------------------------------------------------
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Global Exception Handler]', err);
  const errMsg = err?.message || 'حدث خطأ داخلي في الخادم.';
  res.status(500).json({
    success: false,
    error: errMsg,
    message: errMsg
  });
});

// -----------------------------------------------------------------------------
// VITE OR SPA WEB SERVER REGISTRATION (EXPRESS + VITE BUNDLING IN CONTAINER)
// -----------------------------------------------------------------------------
async function startWebPipeline() {
  if (process.env.NODE_ENV !== 'production') {
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteInstance.middlewares);
    console.log('Registered Vite development server pipeline.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Registered static SPA production directory serving: ' + distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Estate Podium server running seamlessly on http://localhost:${PORT}`);
  });
}

startWebPipeline();
