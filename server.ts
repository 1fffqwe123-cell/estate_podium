// server.ts - Native Node.js Development Server hosting Cloudflare Worker routing
// Built on pure Built-in Node HTTP and Vite, with zero Express or SQLite dependencies.

import http from 'http';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import worker from './src/worker';

const PORT = 3000;

// -----------------------------------------------------------------------------
// PURE IN-MEMORY SIMULATION DATA STORE (ZERO SQLITE / FS FILESYSTEM IN BACKEND)
// -----------------------------------------------------------------------------
let users = [
  {
    id: 1,
    username: 'Alihassan123',
    password_hash: bcrypt.hashSync('aliali7777', 10),
    role: 'owner'
  },
  {
    id: 2,
    username: 'AlRafidain_Estate',
    password_hash: bcrypt.hashSync('agency123', 10),
    role: 'agency'
  },
  {
    id: 3,
    username: 'AlFurat_Estate',
    password_hash: bcrypt.hashSync('agency123', 10),
    role: 'agency'
  }
];

let agencies = [
  {
    id: 1,
    user_id: 2,
    name: 'مكتب الرافدين للعقارات',
    phone: '+964 770 123 4567',
    subscription_status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 3,
    name: 'مكتب الفرات للعقارات والمقاولات',
    phone: '+964 780 987 6543',
    subscription_status: 'active',
    created_at: new Date().toISOString()
  }
];

let agency_locations = [
  { agency_id: 1, province: 'بغداد' },
  { agency_id: 1, province: 'الديوانية' },
  { agency_id: 2, province: 'الديوانية' },
  { agency_id: 2, province: 'النجف' }
];

let properties = [
  {
    id: 1,
    agency_id: 1,
    title: 'فيلا ملكية فاخرة بتصميم مودرن في الجادرية',
    description: 'فيلا مدهشة ذات تشطيبات تركية فاخرة بمساحة 300 متر مربع تتضمن 5 غرف نوم ملكية، مسبح خاص، صالة ضيوف واسعة جداً، تقع في أرقى المربعات السكنية في منطقة الجادرية ببغداد.',
    price: 450000000,
    type: 'sale',
    category: 'Houses',
    city: 'الجادرية',
    province: 'بغداد',
    bedrooms: 5,
    area: 300,
    cover_image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    agency_id: 1,
    title: 'شقة بنتهاوس إطلالة مباشرة على دجلة',
    description: 'شقة سكنية متكاملة مطلة مباشرة على ضفاف نهر دجلة الخالد في الأعظمية. تتكون من 3 غرف نوم مجهزة بأنظمة تكيف مركزي ذكية ومطبخ إيطالي مجهز بالكامل.',
    price: 1200000,
    type: 'rent',
    category: 'Apartments',
    city: 'الأعظمية',
    province: 'بغداد',
    bedrooms: 3,
    area: 180,
    cover_image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    agency_id: 2,
    title: 'أرض تجارية استثمارية على شارع الديوانية الرئيسي',
    description: 'أرض ممتازة للمستثمرين على الشارع العام للمحافظة، واجهة تجارية بعرض 20 متر صالحة لإنشاء مجمع عيادات أو مول تجاري أو صالات عرض. تتوفر كافة الخدمات والماء والكهرباء.',
    price: 850000000,
    type: 'sale',
    category: 'Land',
    city: 'وسط المدينة',
    province: 'الديوانية',
    bedrooms: 0,
    area: 500,
    cover_image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    agency_id: 2,
    title: 'مجمع تجاري ومخازن مجهزة بالكامل',
    description: 'موقع تجاري حيوي جداً في النجف بوسط حي المحترفين مجهز بمصاعد كهربائية ومنظومة دفاع مدني ومواقف سيارات واسعة ومقرات إدارية مريحة.',
    price: 3500000,
    type: 'rent',
    category: 'Commercial',
    city: 'حي المحترفين',
    province: 'النجف',
    bedrooms: 0,
    area: 450,
    cover_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    agency_id: 2,
    title: 'منزل عائلي فخم للبيع في حي الصدر',
    description: 'منزل متكامل الخدمات في محافظة الديوانية - حي الصدر، بناء حديث طابوق درجة أولى، يحتوي على 3 غرف نوم وصالة كبيرة وحديقة داخلية مريحة وموقف سيارة مستقل.',
    price: 195000000,
    type: 'sale',
    category: 'Houses',
    city: 'حي الصدر',
    province: 'الديوانية',
    bedrooms: 3,
    area: 200,
    cover_image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  }
];

let property_images = [
  { id: 1, property_id: 1, image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80' },
  { id: 2, property_id: 1, image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80' },
  { id: 3, property_id: 2, image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' },
  { id: 4, property_id: 3, image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80' },
  { id: 5, property_id: 4, image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' },
  { id: 6, property_id: 5, image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80' }
];

let requests = [
  {
    id: 1,
    full_name: 'علي المحمداوي',
    phone: '+964 782 555 1122',
    province: 'الديوانية',
    city: 'حي العروبة',
    buy_or_rent: 'buy',
    budget: 220000000,
    description: 'أبحث عن بيت للشراء مستقل في الديوانية بسعر لا يتجاوز 220 مليون دينار عراقي ويكون ذو خدمات متوفرة وقريب من السوق الرئيسي.',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    full_name: 'مصطفى البصراوي',
    phone: '+964 771 444 9900',
    province: 'البصرة',
    city: 'الجزائر',
    buy_or_rent: 'rent',
    budget: 800000,
    description: 'شقة طابق أول أو مع مصعد للإيجار السكني في منطقة الجزائر يفضل غرفتين نوم وصالة مجهزة بالتكييف.',
    created_at: new Date().toISOString()
  }
];

let subscriptions = [
  {
    id: 1,
    agency_id: 1,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    agency_id: 2,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// -----------------------------------------------------------------------------
// CLOUDFLARE D1 INTERPRETER SIMULATION
// -----------------------------------------------------------------------------
class MockStatement {
  sql: string;
  args: any[] = [];

  constructor(sql: string) {
    this.sql = sql.trim().replace(/\s+/g, ' ');
  }

  bind(...args: any[]) {
    this.args = args.map(arg => (arg === undefined ? null : arg));
    return this;
  }

  async run() {
    const sql = this.sql;
    const args = this.args;

    if (sql.includes('UPDATE users SET username = ? WHERE id = ?')) {
      const [username, id] = args;
      const u = users.find(x => x.id === Number(id));
      if (u) u.username = username;
      return { meta: { last_row_id: id } };
    }

    if (sql.includes('UPDATE users SET password_hash = ? WHERE id = ?')) {
      const [hash, id] = args;
      const u = users.find(x => x.id === Number(id));
      if (u) u.password_hash = hash;
      return { meta: { last_row_id: id } };
    }

    if (sql.includes('UPDATE agencies SET name = ?, phone = ?, subscription_status = ? WHERE id = ?')) {
      const [name, phone, status, id] = args;
      const a = agencies.find(x => x.id === Number(id));
      if (a) {
        a.name = name;
        a.phone = phone;
        a.subscription_status = status;
      }
      return { meta: { last_row_id: id } };
    }

    if (sql.includes('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')) {
      const [username, hash, role] = args;
      const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      users.push({ id: newId, username, password_hash: hash, role });
      return { meta: { last_row_id: newId } };
    }

    if (sql.includes('INSERT INTO agencies (user_id, name, phone, subscription_status, created_at)')) {
      const [user_id, name, phone, status, created_at] = args;
      const newId = agencies.length > 0 ? Math.max(...agencies.map(a => a.id)) + 1 : 1;
      agencies.push({ id: newId, user_id: Number(user_id), name, phone, subscription_status: status, created_at });
      return { meta: { last_row_id: newId } };
    }

    if (sql.includes('INSERT INTO agency_locations (agency_id, province)')) {
      const [agency_id, province] = args;
      agency_locations.push({ agency_id: Number(agency_id), province });
      return { meta: { last_row_id: 1 } };
    }

    if (sql.includes('DELETE FROM agency_locations WHERE agency_id = ?')) {
      const [agency_id] = args;
      agency_locations = agency_locations.filter(l => l.agency_id !== Number(agency_id));
      return { meta: { last_row_id: 0 } };
    }

    if (sql.includes('INSERT INTO subscriptions (agency_id, start_date, end_date)')) {
      const [agency_id, start_date, end_date] = args;
      const newId = subscriptions.length > 0 ? Math.max(...subscriptions.map(s => s.id)) + 1 : 1;
      subscriptions.push({ id: newId, agency_id: Number(agency_id), start_date, end_date });
      return { meta: { last_row_id: newId } };
    }

    if (sql.includes('INSERT INTO properties')) {
      const [agency_id, title, description, price, type, category, city, province, bedrooms, area, cover_image, created_at] = args;
      const newId = properties.length > 0 ? Math.max(...properties.map(p => p.id)) + 1 : 1;
      properties.push({
        id: newId,
        agency_id: Number(agency_id),
        title,
        description,
        price: Number(price),
        type,
        category,
        city,
        province,
        bedrooms: Number(bedrooms),
        area: Number(area),
        cover_image,
        created_at
      });
      return { meta: { last_row_id: newId } };
    }

    if (sql.includes('UPDATE properties SET') || (sql.includes('UPDATE properties') && sql.includes('SET'))) {
      const [title, description, price, type, category, city, province, bedrooms, area, cover_image, id] = args;
      const p = properties.find(x => x.id === Number(id));
      if (p) {
        p.title = title;
        p.description = description;
        p.price = Number(price);
        p.type = type;
        p.category = category;
        p.city = city;
        p.province = province;
        p.bedrooms = Number(bedrooms);
        p.area = Number(area);
        p.cover_image = cover_image;
      }
      return { meta: { last_row_id: id } };
    }

    if (sql.includes('DELETE FROM properties WHERE id = ?')) {
      const [id] = args;
      properties = properties.filter(p => p.id !== Number(id));
      return { meta: { last_row_id: id } };
    }

    if (sql.includes('DELETE FROM property_images WHERE property_id = ?')) {
      const [property_id] = args;
      property_images = property_images.filter(img => img.property_id !== Number(property_id));
      return { meta: { last_row_id: 0 } };
    }

    if (sql.includes('INSERT INTO property_images (property_id, image_url)')) {
      const [property_id, image_url] = args;
      const newId = property_images.length > 0 ? Math.max(...property_images.map(img => img.id)) + 1 : 1;
      property_images.push({ id: newId, property_id: Number(property_id), image_url });
      return { meta: { last_row_id: newId } };
    }

    if (sql.includes('INSERT INTO requests')) {
      const [full_name, phone, province, city, buy_or_rent, budget, description, created_at] = args;
      const newId = requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1;
      requests.push({
        id: newId,
        full_name,
        phone,
        province,
        city,
        buy_or_rent,
        budget: Number(budget),
        description,
        created_at
      });
      return { meta: { last_row_id: newId } };
    }

    if (sql.includes('DELETE FROM users WHERE id = ?')) {
      const [id] = args;
      const agency = agencies.find(a => a.user_id === Number(id));
      if (agency) {
        agencies = agencies.filter(a => a.id !== agency.id);
        agency_locations = agency_locations.filter(l => l.agency_id !== agency.id);
        properties = properties.filter(p => p.agency_id !== agency.id);
      }
      users = users.filter(u => u.id !== Number(id));
      return { meta: { last_row_id: id } };
    }

    return { meta: { last_row_id: 1 } };
  }

  async first() {
    const sql = this.sql;
    const args = this.args;

    if (sql.includes('SELECT * FROM users WHERE username = ?')) {
      const [username] = args;
      return users.find(u => u.username === username) || null;
    }

    if (sql.includes('SELECT id FROM users WHERE username = ?') && !sql.includes('AND id != ?')) {
      const [username] = args;
      const u = users.find(x => x.username === username);
      return u ? { id: u.id } : null;
    }

    if (sql.includes('SELECT id, name, subscription_status FROM agencies WHERE user_id = ?')) {
      const [user_id] = args;
      return agencies.find(a => a.user_id === Number(user_id)) || null;
    }

    if (sql.includes('SELECT subscription_status FROM agencies WHERE id = ?')) {
      const [id] = args;
      const a = agencies.find(x => x.id === Number(id));
      return a ? { subscription_status: a.subscription_status } : null;
    }

    if (sql.includes('SELECT id FROM users WHERE username = ? AND id != ?')) {
      const [username, id] = args;
      const u = users.find(x => x.username === username && x.id !== Number(id));
      return u ? { id: u.id } : null;
    }

    if (sql.includes('SELECT * FROM users WHERE id = ?')) {
      const [id] = args;
      return users.find(u => u.id === Number(id)) || null;
    }

    if (sql.includes('SELECT agency_id FROM properties WHERE id = ?')) {
      const [id] = args;
      const p = properties.find(x => x.id === Number(id));
      return p ? { agency_id: p.agency_id } : null;
    }

    if (sql.includes('SELECT user_id FROM agencies WHERE id = ?')) {
      const [id] = args;
      const a = agencies.find(x => x.id === Number(id));
      return a ? { user_id: a.user_id } : null;
    }

    if (sql.includes('SELECT COUNT(*) as count FROM properties')) {
      return { count: properties.length };
    }

    if (sql.includes('SELECT COUNT(*) as count FROM agencies')) {
      return { count: agencies.length };
    }

    if (sql.includes('SELECT COUNT(*) as count FROM requests')) {
      return { count: requests.length };
    }

    if (sql.includes('SELECT COUNT(*) as total FROM properties p JOIN agencies a ON p.agency_id = a.id WHERE a.subscription_status = \'active\'') || sql.includes('SELECT COUNT(*) as total FROM properties p')) {
      const results = this.filterPropertiesInternal();
      return { total: results.length };
    }

    if (sql.includes('FROM properties p JOIN agencies a ON p.agency_id = a.id WHERE p.id = ?')) {
      const [id] = args;
      const p = properties.find(x => x.id === Number(id));
      if (!p) return null;
      const agency = agencies.find(a => a.id === p.agency_id);
      return {
        ...p,
        agency_name: agency ? agency.name : 'Unknown Agency',
        agency_phone: agency ? agency.phone : ''
      };
    }

    return null;
  }

  async all() {
    const sql = this.sql;
    const args = this.args;

    if (this.sql.includes('SELECT a.*, u.username as username FROM agencies a JOIN users u')) {
      const joined = agencies.map(a => {
        const u = users.find(x => x.id === a.user_id);
        return {
          ...a,
          username: u ? u.username : ''
        };
      }).sort((a, b) => b.id - a.id);
      return { results: joined };
    }

    if (sql.includes('SELECT province FROM agency_locations WHERE agency_id = ?')) {
      const [agency_id] = args;
      const match = agency_locations.filter(l => l.agency_id === Number(agency_id));
      return { results: match };
    }

    if (sql.includes('SELECT image_url FROM property_images WHERE property_id = ?')) {
      const [property_id] = args;
      const match = property_images.filter(img => img.property_id === Number(property_id));
      return { results: match };
    }

    if (sql.includes('SELECT * FROM requests ORDER BY id DESC') && !sql.includes('WHERE province IN')) {
      const sorted = [...requests].sort((a, b) => b.id - a.id);
      return { results: sorted };
    }

    if (sql.includes('SELECT * FROM requests WHERE province IN')) {
      const matched = requests.filter(r => args.includes(r.province)).sort((a, b) => b.id - a.id);
      return { results: matched };
    }

    if (sql.includes('SELECT p.*, a.name as agency_name, a.phone as agency_phone FROM properties p JOIN agencies a ON p.agency_id = a.id WHERE a.subscription_status = \'active\'')) {
      let matched = this.filterPropertiesInternal();
      const offset = args[args.length - 1];
      const limit = args[args.length - 2];
      const paged = matched.slice(offset, offset + limit);
      return { results: paged };
    }

    if (sql.includes('WHERE p.category = ? AND p.province = ? AND p.id != ? AND a.subscription_status = \'active\' LIMIT 3')) {
      const [category, province, id] = args;
      const matched = properties.filter(p => {
        const ag = agencies.find(a => a.id === p.agency_id);
        const isActive = ag ? ag.subscription_status === 'active' : false;
        return p.category === category && p.province === province && p.id !== Number(id) && isActive;
      }).slice(0, 3).map(p => {
        const ag = agencies.find(a => a.id === p.agency_id);
        return {
          ...p,
          agency_name: ag ? ag.name : '',
          agency_phone: ag ? ag.phone : ''
        };
      });
      return { results: matched };
    }

    if (sql.includes('SELECT type, COUNT(*) as count FROM properties GROUP BY type')) {
      const groups: Record<string, number> = {};
      properties.forEach(p => {
        groups[p.type] = (groups[p.type] || 0) + 1;
      });
      const results = Object.entries(groups).map(([type, count]) => ({ type, count }));
      return { results };
    }

    if (sql.includes('SELECT category, COUNT(*) as count FROM properties GROUP BY category')) {
      const groups: Record<string, number> = {};
      properties.forEach(p => {
        groups[p.category] = (groups[p.category] || 0) + 1;
      });
      const results = Object.entries(groups).map(([category, count]) => ({ category, count }));
      return { results };
    }

    if (sql.includes('SELECT province, COUNT(*) as count FROM properties GROUP BY province')) {
      const groups: Record<string, number> = {};
      properties.forEach(p => {
        groups[p.province] = (groups[p.province] || 0) + 1;
      });
      const results = Object.entries(groups).map(([province, count]) => ({ province, count }));
      return { results };
    }

    return { results: [] };
  }

  private filterPropertiesInternal() {
    let matched = properties.filter(p => {
      const ag = agencies.find(a => a.id === p.agency_id);
      return ag && ag.subscription_status === 'active';
    });

    const sql = this.sql;
    const args = [...this.args];

    if (sql.includes('LIMIT ? OFFSET ?')) {
      args.pop(); // offset
      args.pop(); // limit
    }

    let cursor = 0;

    if (sql.includes('AND p.category = ?')) {
      const cat = args[cursor++];
      matched = matched.filter(p => p.category === cat);
    }
    if (sql.includes('AND p.type = ?')) {
      const ty = args[cursor++];
      matched = matched.filter(p => p.type === ty);
    }
    if (sql.includes('AND p.province = ?')) {
      const prov = args[cursor++];
      matched = matched.filter(p => p.province === prov);
    }
    if (sql.includes('AND p.city LIKE ?')) {
      const rawArg = args[cursor++];
      const cityLike = typeof rawArg === 'string' ? rawArg.replace(/%/g, '') : '';
      matched = matched.filter(p => p.city.includes(cityLike));
    }
    if (sql.includes('AND p.price >= ?')) {
      const minP = args[cursor++];
      matched = matched.filter(p => p.price >= Number(minP));
    }
    if (sql.includes('AND p.price <= ?')) {
      const maxP = args[cursor++];
      matched = matched.filter(p => p.price <= Number(maxP));
    }
    if (sql.includes('AND p.bedrooms >= ?')) {
      const beds = args[cursor++];
      matched = matched.filter(p => p.bedrooms >= Number(beds));
    }
    if (sql.includes('AND p.area >= ?')) {
      const minA = args[cursor++];
      matched = matched.filter(p => p.area >= Number(minA));
    }
    if (sql.includes('AND p.area <= ?')) {
      const maxA = args[cursor++];
      matched = matched.filter(p => p.area <= Number(maxA));
    }
    if (sql.includes('AND p.agency_id = ?')) {
      const agId = args[cursor++];
      matched = matched.filter(p => p.agency_id === Number(agId));
    }

    matched.sort((a, b) => b.id - a.id);

    return matched.map(p => {
      const ag = agencies.find(a => a.id === p.agency_id);
      return {
        ...p,
        agency_name: ag ? ag.name : '',
        agency_phone: ag ? ag.phone : ''
      };
    });
  }
}

const mockDB = {
  prepare(sql: string) {
    return new MockStatement(sql);
  }
};

// -----------------------------------------------------------------------------
// CLOUDFLARE R2 DATASTORE SIMULATION (IN-MEMORY MAP)
// -----------------------------------------------------------------------------
const r2Store = new Map<string, { body: Buffer; contentType: string }>();

const mockR2_IMAGERY = {
  async put(key: string, value: any, options?: any) {
    let buffer: Buffer;
    if (value && typeof value.getReader === 'function') {
      const chunks: any[] = [];
      const reader = value.getReader();
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks.map(c => Buffer.from(c)));
    } else if (Buffer.isBuffer(value)) {
      buffer = value;
    } else if (value && typeof value.arrayBuffer === 'function') {
      buffer = Buffer.from(await value.arrayBuffer());
    } else {
      buffer = Buffer.from(value);
    }
    const contentType = options?.httpMetadata?.contentType || 'image/jpeg';
    r2Store.set(key, { body: buffer, contentType });
    return {};
  },
  async get(key: string) {
    const object = r2Store.get(key);
    if (!object) return null;
    return {
      body: object.body,
      httpEtag: `"${key}-etag"`,
      writeHttpMetadata(headers: any) {
        headers.set('Content-Type', object.contentType);
      }
    };
  }
};

// Seed R2 with Unsplash imagery mappings so we don't break local design layout looks
const loadImg = async (filename: string, extUrl: string) => {
  try {
    const res = await fetch(extUrl);
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      r2Store.set(filename, {
        body: Buffer.from(arrayBuf),
        contentType: res.headers.get('content-type') || 'image/jpeg'
      });
    }
  } catch (err) {
    // Fail silently in development/sandboxes
  }
};

// -----------------------------------------------------------------------------
// WORKER RUNTIME & CONVERTER HOOK
// -----------------------------------------------------------------------------
async function translateRequest(req: http.IncomingMessage): Promise<Request> {
  const protocol = 'http';
  const host = req.headers.host || 'localhost:3000';
  const url = `${protocol}://${host}${req.url}`;

  const chunks: any[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach(v => headers.append(key, v));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return new Request(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined
  });
}

async function pipeResponse(webRes: Response, res: http.ServerResponse) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });

  if (webRes.body) {
    const reader = webRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  }
  res.end();
}

// -----------------------------------------------------------------------------
// WEB PIPELINE INITIALIZER
// -----------------------------------------------------------------------------
async function bootstrap() {
  const env = {
    DB: mockDB as any,
    R2_IMAGERY: mockR2_IMAGERY as any,
    JWT_SECRET: 'estate_podium_secret_key_2026_secured'
  };

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  const server = http.createServer((req, res) => {
    const url = req.url || '/';

    // Intercept client file upload and api queries
    if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
      translateRequest(req)
        .then(webReq => worker.fetch(webReq, env))
        .then(webRes => pipeResponse(webRes, res))
        .catch(err => {
          console.error('[Worker Dev Error]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Worker Exec Error' }));
        });
    } else {
      // Let Vite handle assets and routing
      vite.middlewares(req, res);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Podium] Pure Cloudflare-aligned Dev Server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Bootstrap failure:', err);
});
