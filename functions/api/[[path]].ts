// functions/api/[[path]].ts - Unified Catch-All Router for Cloudflare Pages Functions
// Connects Front-End React + Vite directly with Cloudflare D1 and Cloudflare R2 bindings.

import bcrypt from 'bcryptjs';

export interface Env {
  DB: D1Database;
  IMAGES?: R2Bucket;
  R2_IMAGERY?: R2Bucket;
  JWT_SECRET?: string;
}

// -----------------------------------------------------------------------------
// SECURE JWT & AUTHENTICATION SYSTEMS
// -----------------------------------------------------------------------------
async function getAuthenticatedUser(request: Request, env: Env): Promise<any | null> {
  let token = '';

  // 1. Try extracting token from the Authorization header First
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fallback to cookie authentication
  if (!token) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    token = cookies['token'];
  }

  if (!token) return null;

  try {
    const secret = env.JWT_SECRET || 'estate_podium_secret_key_2026_secured';
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);

    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

async function generateJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const partialToken = 
    base64url(JSON.stringify(header)) + "." + 
    base64url(JSON.stringify(payload));

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", 
    enc.encode(secret), 
    { name: "HMAC", hash: { name: "SHA-256" } }, 
    false, 
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(partialToken));

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return partialToken + "." + signatureB64;
}

function base64url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function extractKey(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url, 'https://localhost');
    if (u.pathname.startsWith('/uploads/')) {
      return u.pathname.substring('/uploads/'.length);
    }
    const keyParam = u.searchParams.get('key');
    if (keyParam) return keyParam;
  } catch(e) {}
  
  const parts = url.split('/');
  const last = parts[parts.length - 1];
  if (last.includes('?')) {
    const sp = last.split('?');
    if (sp[1].includes('key=')) {
      return sp[1].split('key=')[1].split('&')[0];
    }
  }
  return last;
}

// -----------------------------------------------------------------------------
// ROUTE HANDLER EXPORT - Pages catch-all entrypoint
// -----------------------------------------------------------------------------
export const onRequest = async (context: { request: Request; env: Env; params: Record<string, string> }): Promise<Response> => {
  const request = context.request;
  const env = context.env;
  
  const origin = request.headers.get('Origin') || '*';
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Global override of jsonResponse helper to bind CORS Origins and format errors
  const jsonResponse = (data: any, status = 200, headersInit?: HeadersInit): Response => {
    const headers = new Headers(headersInit);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    headers.set('Access-Control-Allow-Credentials', 'true');

    if (data && typeof data === 'object') {
      if (data.error && data.success === undefined) {
        data.success = false;
        data.message = data.error;
      }
      if (status >= 400) {
        data.success = false;
        if (!data.message) {
          data.message = data.error || 'حدث خطأ غير متوقع.';
        }
      } else {
        if (data.success === undefined) {
          data.success = true;
        }
      }
    } else if (data === undefined || data === null || data === '') {
      data = {
        success: status < 400,
        message: status < 400 ? 'تمت العملية بنجاح.' : 'فشل تنفيذ الطلب.'
      };
    }

    return new Response(JSON.stringify(data), { status, headers });
  };

  // Handle CORS Preflights
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }

  // Bind bucket safely
  const bucket = env.IMAGES || env.R2_IMAGERY;

  try {
    // -------------------------------------------------------------------------
    // SCHEMA DETECTION ENGINE (D1 AUTOMATIC MAPPING FOR ALL ENVIRONMENTS)
    // -------------------------------------------------------------------------
    let isPagesSchema = false;
    try {
      const colCheck = await env.DB.prepare("PRAGMA table_info(properties);").all();
      if (colCheck && colCheck.results) {
        const columns = colCheck.results.map((c: any) => c.name);
        if (columns.includes('image_key') || columns.includes('location')) {
          isPagesSchema = true;
        }
      }
    } catch (e) {
      isPagesSchema = false;
    }

    // -------------------------------------------------------------------------
    // IMAGE SERVING ENDPOINTS (/api/images OR /uploads/*)
    // -------------------------------------------------------------------------
    if (path === '/api/images' || path.startsWith('/api/images/') || path.startsWith('/uploads/')) {
      if (method === 'GET') {
        let r2Key = url.searchParams.get('key') || '';
        if (!r2Key) {
          if (path.startsWith('/uploads/')) {
            r2Key = path.substring('/uploads/'.length);
          } else if (path.startsWith('/api/images/')) {
            r2Key = path.substring('/api/images/'.length);
          }
        }

        if (!r2Key) {
          return new Response('Missing key parameter or slug', { status: 400 });
        }

        if (!bucket) {
          return new Response('Storage binding (R2) is not configured', { status: 500 });
        }

        try {
          const object = await bucket.get(r2Key);
          if (!object) {
            return new Response('Image Not Found in Cloudflare R2', { status: 404 });
          }

          const responseHeaders = new Headers();
          object.writeHttpMetadata(responseHeaders);
          responseHeaders.set('etag', object.httpEtag);
          responseHeaders.set('Cache-Control', 'public, max-age=31536000');
          return new Response(object.body, { headers: responseHeaders });
        } catch (err: any) {
          return new Response('Error retrieving from storage: ' + err.message, { status: 500 });
        }
      }
    }

    // -------------------------------------------------------------------------
    // JWT AUTH SECTIONS
    // -------------------------------------------------------------------------
    if (path === '/api/login' || path === '/api/auth/login') {
      if (method !== 'POST') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405);
      }
      const { username, password } = await request.json() as any;
      if (!username || !password) {
        return jsonResponse({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, 400);
      }

      const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?;').bind(username).first() as any;
      if (!user) {
        return jsonResponse({ error: 'خطأ في اسم المستخدم أو كلمة المرور' }, 401);
      }

      const match = bcrypt.compareSync(password, user.password_hash);
      if (!match) {
        return jsonResponse({ error: 'خطأ في اسم المستخدم أو كلمة المرور' }, 401);
      }

      let agencyId: number | undefined;
      let agencyName: string | undefined;

      // Handle subscription check if agency
      if (user.role === 'agency') {
        const agencyInfo = await env.DB.prepare('SELECT id, name, subscription_status FROM agencies WHERE user_id = ?;').bind(user.id).first() as any;
        if (agencyInfo?.subscription_status === 'inactive') {
          return jsonResponse({ error: 'الاشتراك الخاص بالوكالة غير فعال حالياً، يرجى التواصل مع الإدارة.' }, 403);
        }
        agencyId = agencyInfo?.id;
        agencyName = agencyInfo?.name;
      }

      const sessionPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        agencyId,
        agencyName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };

      const token = await generateJWT(sessionPayload, env.JWT_SECRET || 'estate_podium_secret_key_2026_secured');
      const headers = new Headers();
      headers.set('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`);

      return jsonResponse({
        status: 'success',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          agencyId,
          agencyName
        }
      }, 200, headers);
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      const headers = new Headers();
      headers.set('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      return jsonResponse({ status: 'success', message: 'تم تسجيل الخروج بنجاح.' }, 200, headers);
    }

    if (path === '/api/auth/me' && method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) {
        return jsonResponse({ user: null });
      }

      if (user.role === 'agency') {
        const agencyInfo = await env.DB.prepare('SELECT subscription_status FROM agencies WHERE id = ?;').bind(user.agencyId).first() as any;
        if (agencyInfo && agencyInfo.subscription_status === 'inactive') {
          const headers = new Headers();
          headers.set('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
          return jsonResponse({ user: null, error: 'تم تعطيل حسابك العقاري بسبب عدم سداد الاشتراك.' }, 200, headers);
        }
      }

      return jsonResponse({ user });
    }

    if (path === '/api/auth/change-credentials' && method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) return jsonResponse({ error: 'غير مصرح للقيام بهذا الإجراء' }, 401);

      const { newUsername, newPassword } = await request.json() as any;
      if (!newUsername && !newPassword) {
        return jsonResponse({ error: 'يرجى تقديم بيانات التحديث.' }, 400);
      }

      if (newUsername) {
        const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?;').bind(newUsername, user.userId).first();
        if (existing) {
          return jsonResponse({ error: 'اسم المستخدم هذا مستخدم مسبقاً من قبل عضو آخر.' }, 400);
        }
        await env.DB.prepare('UPDATE users SET username = ? WHERE id = ?;').bind(newUsername, user.userId).run();
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          return jsonResponse({ error: 'يجب أن لا تقل كلمة المرور عن 6 حروف.' }, 400);
        }
        const newHash = bcrypt.hashSync(newPassword, 10);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?;').bind(newHash, user.userId).run();
      }

      const updatedUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?;').bind(user.userId).first() as any;
      const sessionPayload = {
        userId: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        agencyId: user.agencyId,
        agencyName: user.agencyName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };

      const token = await generateJWT(sessionPayload, env.JWT_SECRET || 'estate_podium_secret_key_2026_secured');
      const headers = new Headers();
      headers.set('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`);

      return jsonResponse({ status: 'success', message: 'تم تحديث البيانات الأمنية بنجاح.' }, 200, headers);
    }

    // -------------------------------------------------------------------------
    // PROPERTIES ENDPOINTS
    // -------------------------------------------------------------------------
    if (path === '/api/properties' && method === 'GET') {
      const category = url.searchParams.get('category') || '';
      const type = url.searchParams.get('type') || '';
      const province = url.searchParams.get('province') || '';
      const city = url.searchParams.get('city') || '';
      const minPrice = url.searchParams.get('minPrice') || '';
      const maxPrice = url.searchParams.get('maxPrice') || '';
      const bedrooms = url.searchParams.get('bedrooms') || '';
      const minArea = url.searchParams.get('minArea') || '';
      const maxArea = url.searchParams.get('maxArea') || '';
      const agency_id = url.searchParams.get('agency_id') || '';
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10'));
      const offset = (page - 1) * limit;

      if (isPagesSchema) {
        // --- 1. PAGES CUSTOM SCHEMA SELECTION ---
        let baseQuery = "SELECT * FROM properties WHERE 1=1";
        const params: any[] = [];

        if (type && type !== 'all') {
          baseQuery += " AND type = ?";
          params.push(type);
        }
        if (province && province !== 'all') {
          baseQuery += " AND (location LIKE ? OR location = ?)";
          params.push(`%${province}%`, province);
        }
        if (city) {
          baseQuery += " AND location LIKE ?";
          params.push(`%${city}%`);
        }
        if (minPrice) {
          baseQuery += " AND price >= ?";
          params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
          baseQuery += " AND price <= ?";
          params.push(parseFloat(maxPrice));
        }
        if (bedrooms && bedrooms !== 'all') {
          baseQuery += " AND bedrooms >= ?";
          params.push(parseInt(bedrooms));
        }
        if (minArea) {
          baseQuery += " AND area >= ?";
          params.push(parseFloat(minArea));
        }
        if (maxArea) {
          baseQuery += " AND area <= ?";
          params.push(parseFloat(maxArea));
        }

        const countQuery = baseQuery.replace("SELECT * FROM properties", "SELECT COUNT(*) as total FROM properties");
        const countRes = await env.DB.prepare(countQuery).bind(...params).first() as any;
        const total = countRes ? countRes.total : 0;

        baseQuery += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const list = (await env.DB.prepare(baseQuery).bind(...params).all()).results;

        // Map to Front-End friendly Property schema
        const mappedList = list.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          type: item.type || 'sale',
          category: item.category || 'Houses',
          city: item.location ? item.location.split(' - ')[1] || '' : '',
          province: item.location ? item.location.split(' - ')[0] || item.location : 'العراق',
          area: item.area || 0,
          bedrooms: item.bedrooms || 0,
          cover_image: item.image_key ? `/api/images?key=${item.image_key}` : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
          images: item.image_key ? [`/api/images?key=${item.image_key}`] : [],
          agency_id: 1,
          agency_name: 'إدارة المنصة العقارية',
          agency_phone: '+964 770 123 4567'
        }));

        return jsonResponse({
          properties: mappedList,
          page,
          limit,
          total,
          hasMore: offset + mappedList.length < total
        });
      } else {
        // --- 2. MULTI-AGENCY DASHBOARD WORKER SCHEMA ---
        let queryStr = `
          SELECT p.*, a.name as agency_name, a.phone as agency_phone 
          FROM properties p 
          JOIN agencies a ON p.agency_id = a.id
          WHERE a.subscription_status = 'active'
        `;
        const params: any[] = [];

        if (category && category !== 'all') {
          queryStr += ' AND p.category = ?';
          params.push(category);
        }
        if (type && type !== 'all') {
          queryStr += ' AND p.type = ?';
          params.push(type);
        }
        if (province && province !== 'all') {
          queryStr += ' AND p.province = ?';
          params.push(province);
        }
        if (city) {
          queryStr += ' AND p.city LIKE ?';
          params.push(`%${city}%`);
        }
        if (minPrice) {
          queryStr += ' AND p.price >= ?';
          params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
          queryStr += ' AND p.price <= ?';
          params.push(parseFloat(maxPrice));
        }
        if (bedrooms && bedrooms !== 'all') {
          queryStr += ' AND p.bedrooms >= ?';
          params.push(parseInt(bedrooms));
        }
        if (minArea) {
          queryStr += ' AND p.area >= ?';
          params.push(parseFloat(minArea));
        }
        if (maxArea) {
          queryStr += ' AND p.area <= ?';
          params.push(parseFloat(maxArea));
        }
        if (agency_id) {
          queryStr += ' AND p.agency_id = ?';
          params.push(parseInt(agency_id));
        }

        const countQuery = queryStr.replace('SELECT p.*, a.name as agency_name, a.phone as agency_phone', 'SELECT COUNT(*) as total');
        const countRes = await env.DB.prepare(countQuery).bind(...params).first() as any;
        const total = countRes ? countRes.total : 0;

        queryStr += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const list = (await env.DB.prepare(queryStr).bind(...params).all()).results;

        return jsonResponse({
          properties: list,
          page,
          limit,
          total,
          hasMore: offset + list.length < total
        });
      }
    }

    if (path.startsWith('/api/properties/') && method === 'GET') {
      const idStr = path.split('/').pop() || '';
      const id = parseInt(idStr);
      if (isNaN(id)) return jsonResponse({ error: 'رقم العقار غير صحيح' }, 400);

      if (isPagesSchema) {
        const item = await env.DB.prepare("SELECT * FROM properties WHERE id = ?;").bind(id).first() as any;
        if (!item) {
          return jsonResponse({ error: 'العقار المطلوب غير موجود.' }, 404);
        }

        const property = {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          type: item.type || 'sale',
          category: item.category || 'Houses',
          city: item.location ? item.location.split(' - ')[1] || '' : '',
          province: item.location ? item.location.split(' - ')[0] || item.location : 'العراق',
          area: item.area || 0,
          bedrooms: item.bedrooms || 0,
          cover_image: item.image_key ? `/api/images?key=${item.image_key}` : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
          images: item.image_key ? [`/api/images?key=${item.image_key}`] : [],
          agency_id: 1,
          agency_name: 'إدارة المنصة العقارية',
          agency_phone: '+964 770 123 4567'
        };

        // Similar mock items
        const similarList = (await env.DB.prepare("SELECT * FROM properties WHERE id != ? LIMIT 3;").bind(id).all()).results;
        const mappedSimilar = similarList.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          price: s.price,
          type: s.type || 'sale',
          category: s.category || 'Houses',
          city: s.location ? s.location.split(' - ')[1] || '' : '',
          province: s.location ? s.location.split(' - ')[0] || s.location : 'العراق',
          area: s.area || 0,
          bedrooms: s.bedrooms || 0,
          cover_image: s.image_key ? `/api/images?key=${s.image_key}` : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
          images: s.image_key ? [`/api/images?key=${s.image_key}`] : [],
          agency_name: 'إدارة المنصة العقارية',
          agency_phone: '+964 770 123 4567'
        }));

        return jsonResponse({ property, similar: mappedSimilar });
      } else {
        const property = await env.DB.prepare(`
          SELECT p.*, a.name as agency_name, a.phone as agency_phone 
          FROM properties p 
          JOIN agencies a ON p.agency_id = a.id 
          WHERE p.id = ?;
        `).bind(id).first() as any;

        if (!property) {
          return jsonResponse({ error: 'العقار المطلوب غير موجود.' }, 404);
        }

        const imagesRes = await env.DB.prepare('SELECT image_url FROM property_images WHERE property_id = ?;').bind(id).all();
        property.images = imagesRes.results.map((img: any) => img.image_url);

        const similarRes = await env.DB.prepare(`
          SELECT p.*, a.name as agency_name, a.phone as agency_phone 
          FROM properties p 
          JOIN agencies a ON p.agency_id = a.id 
          WHERE p.category = ? AND p.province = ? AND p.id != ? AND a.subscription_status = 'active'
          LIMIT 3;
        `).bind(property.category, property.province, id).all();

        return jsonResponse({ property, similar: similarRes.results });
      }
    }

    if (path === '/api/properties' && method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) {
        return jsonResponse({ error: 'غير مصرح للقيام بهذا الإجراء' }, 401);
      }

      const bodyData = await request.json() as any;
      const { title, description, price, type, location, category, city, province, bedrooms, bathrooms, area, cover_image, images, image_key } = bodyData;

      if (!title || !description || !price || !type) {
        return jsonResponse({ error: 'يرجى إدخال الحقول الإجبارية للعقار.' }, 400);
      }

      if (isPagesSchema) {
        const finalLocation = location || `${province || 'العراق'} - ${city || ''}`;
        const finalKey = image_key || extractKey(cover_image);

        const result = await env.DB.prepare(`
          INSERT INTO properties (title, description, price, location, bedrooms, bathrooms, area, type, image_key, featured, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          title, description, parseFloat(price), finalLocation,
          parseInt(bedrooms) || 0, parseInt(bathrooms) || 1, parseFloat(area) || 0,
          type, finalKey, 0, new Date().toISOString()
        ).run();

        return jsonResponse({ status: 'success', message: 'تم إدراج العقار بنجاح.', propertyId: result.meta.last_row_id });
      } else {
        if (user.role !== 'agency') {
          return jsonResponse({ error: 'صلاحيات الحساب غير كافية لرفع العقارات.' }, 403);
        }

        const result = await env.DB.prepare(`
          INSERT INTO properties (agency_id, title, description, price, type, category, city, province, bedrooms, area, cover_image, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.agencyId, title, description, parseFloat(price), type, category || 'Houses', city || '', province || 'البصرة',
          parseInt(bedrooms) || 0, parseFloat(area) || 0, cover_image || '', new Date().toISOString()
        ).run();

        const propertyId = result.meta.last_row_id;
        const galleryList = images && Array.isArray(images) ? images : [cover_image];
        for (const imgUrl of galleryList) {
          if (imgUrl) {
            await env.DB.prepare('INSERT INTO property_images (property_id, image_url) VALUES (?, ?);').bind(propertyId, imgUrl).run();
          }
        }

        return jsonResponse({ status: 'success', message: 'تم إدراج العقار بنجاح.', propertyId });
      }
    }

    if (path.startsWith('/api/properties/') && method === 'PUT') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) return jsonResponse({ error: 'غير مصرح للقيام بهذا الإجراء' }, 401);

      const idStr = path.split('/').pop() || '';
      const id = parseInt(idStr);

      const bodyData = await request.json() as any;
      const { title, description, price, type, location, category, city, province, bedrooms, bathrooms, area, cover_image, images, image_key } = bodyData;

      if (isPagesSchema) {
        const finalLocation = location || `${province || 'العراق'} - ${city || ''}`;
        const finalKey = image_key || extractKey(cover_image);

        await env.DB.prepare(`
          UPDATE properties 
          SET title = ?, description = ?, price = ?, location = ?, bedrooms = ?, bathrooms = ?, area = ?, type = ?, image_key = ?, featured = ?
          WHERE id = ?;
        `).bind(
          title, description, parseFloat(price), finalLocation,
          parseInt(bedrooms) || 0, parseInt(bathrooms) || 1, parseFloat(area) || 0,
          type, finalKey, 0, id
        ).run();

        return jsonResponse({ status: 'success', message: 'تم تحديث تفاصيل العقار بنجاح.' });
      } else {
        const existing = await env.DB.prepare('SELECT agency_id FROM properties WHERE id = ?;').bind(id).first() as any;
        if (!existing) return jsonResponse({ error: 'العقار غير موجود.' }, 404);
        if (user.role === 'agency' && existing.agency_id !== user.agencyId) {
          return jsonResponse({ error: 'لا تملك صلاحيات تعديل هذا العقار.' }, 403);
        }

        await env.DB.prepare(`
          UPDATE properties 
          SET title = ?, description = ?, price = ?, type = ?, category = ?, city = ?, province = ?, bedrooms = ?, area = ?, cover_image = ?
          WHERE id = ?;
        `).bind(
          title, description, parseFloat(price), type, category || 'Houses', city || '', province || 'البصرة',
          parseInt(bedrooms) || 0, parseFloat(area) || 0, cover_image || '', id
        ).run();

        if (images && Array.isArray(images)) {
          await env.DB.prepare('DELETE FROM property_images WHERE property_id = ?;').bind(id).run();
          for (const url of images) {
            if (url) {
              await env.DB.prepare('INSERT INTO property_images (property_id, image_url) VALUES (?, ?);').bind(id, url).run();
            }
          }
        }

        return jsonResponse({ status: 'success', message: 'تم تحديث تفاصيل العقار بنجاح.' });
      }
    }

    if (path.startsWith('/api/properties/') && method === 'DELETE') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) return jsonResponse({ error: 'غير مصرح للقيام بهذا الإجراء' }, 401);

      const idStr = path.split('/').pop() || '';
      const id = parseInt(idStr);

      if (isPagesSchema) {
        await env.DB.prepare('DELETE FROM properties WHERE id = ?;').bind(id).run();
        return jsonResponse({ status: 'success', message: 'تم حذف الإعلان العقاري بنجاح.' });
      } else {
        const existing = await env.DB.prepare('SELECT agency_id FROM properties WHERE id = ?;').bind(id).first() as any;
        if (!existing) return jsonResponse({ error: 'العقار المطلوب غير متوفر.' }, 404);
        if (user.role === 'agency' && existing.agency_id !== user.agencyId) {
          return jsonResponse({ error: 'لا تملك صلاحية حذف هذا العقار.' }, 403);
        }

        await env.DB.prepare('DELETE FROM properties WHERE id = ?;').bind(id).run();
        return jsonResponse({ status: 'success', message: 'تم حذف الإعلان العقاري بنجاح.' });
      }
    }

    // -------------------------------------------------------------------------
    // FILE STREAM & MULTIPART IMAGE UPLOAD
    // -------------------------------------------------------------------------
    if (path === '/api/upload' && method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) return jsonResponse({ error: 'غير مصرح للقيام بهذا الإجراء' }, 401);

      if (!bucket) {
        return jsonResponse({ error: 'مستودع R2 للصور غير متصل حالياً.' }, 500);
      }

      try {
        const formData = await request.formData();
        const files = formData.getAll('images');

        if (files.length === 0) {
          return jsonResponse({ error: 'يرجى اختيار صور صالحة لرفعها.' }, 400);
        }

        const urls: string[] = [];
        let lastKey = '';
        let lastUrl = '';

        for (const fileItem of files) {
          if (fileItem instanceof File) {
            const extension = (fileItem.name.split('.').pop() || 'jpg').toLowerCase();
            const uuid = crypto.randomUUID();
            const uniqueFilename = `properties/${uuid}.${extension}`;
            
            await bucket.put(uniqueFilename, fileItem.stream(), {
              httpMetadata: { contentType: fileItem.type || 'image/jpeg' }
            });

            const returnUrl = `/api/images?key=${uniqueFilename}`;
            urls.push(returnUrl);
            lastKey = uniqueFilename;
            lastUrl = returnUrl;
          }
        }

        return jsonResponse({
          success: true,
          data: {
            urls
          },
          key: lastKey,
          url: lastUrl,
          urls
        });
      } catch (err: any) {
        return jsonResponse({ error: 'فشل في رفع الصور للغيمة: ' + err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // REQUESTS & INQUIRIES ROUTER
    // -------------------------------------------------------------------------
    if ((path === '/api/requests' || path === '/api/inquiries') && method === 'POST') {
      try {
        const bodyData = await request.json() as any;

        // Auto determine which schema client called
        if (isPagesSchema) {
          const { property_id, name, email, phone, message } = bodyData;
          if (!property_id || !name || !email || !message) {
            return jsonResponse({ error: 'يرجى ملء جميع الحقول المطلوبة لتقديم استفسارك.' }, 400);
          }

          await env.DB.prepare(`
            INSERT INTO inquiries (property_id, name, email, phone, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            parseInt(property_id), name, email, phone || '', message, new Date().toISOString()
          ).run();

          return jsonResponse({ status: 'success', message: 'تم تقديم استفسارك بنجاح. ستتواصل معك الإدارة قريباً.' });
        } else {
          // Standard lead requests
          const { full_name, phone, province, city, buy_or_rent, budget, description } = bodyData;
          if (!full_name || !phone || !province || !city || !buy_or_rent || !budget || !description) {
            return jsonResponse({ error: 'يرجى ملء جميع الحقول المطلوبة لتقديم طلبك.' }, 400);
          }

          await env.DB.prepare(`
            INSERT INTO requests (full_name, phone, province, city, buy_or_rent, budget, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
          `).bind(
            full_name, phone, province, city, buy_or_rent, parseFloat(budget), description, new Date().toISOString()
          ).run();

          return jsonResponse({ status: 'success', message: 'تم إرسال طلبك العقاري بنجاح. ستتواصل معك الوكالات المختصة قريباً.' });
        }
      } catch (e: any) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    if (path === '/api/requests' && method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) return jsonResponse({ error: 'غير مصرح للقيام بهذا الإجراء' }, 401);

      try {
        if (user.role === 'owner') {
          const allRes = await env.DB.prepare('SELECT * FROM requests ORDER BY id DESC;').all();
          return jsonResponse({ requests: allRes.results });
        } else {
          const agencyLocs = await env.DB.prepare('SELECT province FROM agency_locations WHERE agency_id = ?;').bind(user.agencyId).all();
          const assignedProvinces = agencyLocs.results.map((l: any) => l.province);

          if (assignedProvinces.length === 0) {
            return jsonResponse({ requests: [], message: 'الوكالة العقارية تملك حساباً غير معين لأي محافظة للاطلاع على الطلبات.' });
          }

          const placeholders = assignedProvinces.map(() => '?').join(',');
          const localizedRes = await env.DB.prepare(`
            SELECT * FROM requests 
            WHERE province IN (${placeholders})
            ORDER BY id DESC;
          `).bind(...assignedProvinces).all();

          return jsonResponse({ requests: localizedRes.results });
        }
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // OWNER MANAGEMENT API MODULES (agencies, subscriptions, analytics)
    // -------------------------------------------------------------------------
    if (path === '/api/agencies' && method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      if (!user || user.role !== 'owner') return jsonResponse({ error: 'متاح فقط لإدارة المنصة.' }, 403);

      const listRes = await env.DB.prepare(`
        SELECT a.*, u.username as username 
        FROM agencies a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.id DESC;
      `).all();

      const agencies = listRes.results as any[];
      for (const agency of agencies) {
        const provincesRes = await env.DB.prepare('SELECT province FROM agency_locations WHERE agency_id = ?;').bind(agency.id).all();
        agency.provinces = provincesRes.results.map((l: any) => l.province);
      }

      return jsonResponse({ agencies });
    }

    if (path === '/api/agencies' && method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      if (!user || user.role !== 'owner') return jsonResponse({ error: 'متاح فقط لإدارة المنصة.' }, 403);

      const { name, phone, username, password, provinces } = await request.json() as any;
      if (!name || !phone || !username || !password || !provinces || !Array.isArray(provinces)) {
        return jsonResponse({ error: 'البيانات غير مكتملة.' }, 400);
      }

      const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?;').bind(username).first();
      if (existing) return jsonResponse({ error: 'اسم المستخدم للوكالة مسجل بالفعل.' }, 400);

      const hash = bcrypt.hashSync(password, 10);
      const userInsert = await env.DB.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?);').bind(username, hash, 'agency').run();
      const userId = userInsert.meta.last_row_id;

      const agencyInsert = await env.DB.prepare('INSERT INTO agencies (user_id, name, phone, subscription_status, created_at) VALUES (?, ?, ?, ?, ?);').bind(
        userId, name, phone, 'active', new Date().toISOString()
      ).run();
      const agencyId = agencyInsert.meta.last_row_id;

      for (const prov of provinces) {
        await env.DB.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').bind(agencyId, prov).run();
      }

      await env.DB.prepare('INSERT INTO subscriptions (agency_id, start_date, end_date) VALUES (?, ?, ?);').bind(
        agencyId, new Date().toISOString(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      ).run();

      return jsonResponse({ status: 'success', message: 'تم إدراج الوكالة العقارية بنجاح.' });
    }

    if (path.startsWith('/api/agencies/') && method === 'PUT') {
      const user = await getAuthenticatedUser(request, env);
      if (!user || user.role !== 'owner') return jsonResponse({ error: 'متاح فقط لإدارة المنصة.' }, 403);

      const idStr = path.split('/').pop() || '';
      const id = parseInt(idStr);

      const { name, phone, subscription_status, provinces } = await request.json() as any;

      await env.DB.prepare('UPDATE agencies SET name = ?, phone = ?, subscription_status = ? WHERE id = ?;').bind(
        name, phone, subscription_status, id
      ).run();

      if (provinces && Array.isArray(provinces)) {
        await env.DB.prepare('DELETE FROM agency_locations WHERE agency_id = ?;').bind(id).run();
        for (const prov of provinces) {
          await env.DB.prepare('INSERT INTO agency_locations (agency_id, province) VALUES (?, ?);').bind(id, prov).run();
        }
      }

      return jsonResponse({ status: 'success', message: 'تم تحديث الوكالة والمحافظات بنجاح.' });
    }

    if (path.startsWith('/api/agencies/') && method === 'DELETE') {
      const user = await getAuthenticatedUser(request, env);
      if (!user || user.role !== 'owner') return jsonResponse({ error: 'متاح فقط لإدارة المنصة.' }, 403);

      const idStr = path.split('/').pop() || '';
      const id = parseInt(idStr);

      const agencyObj = await env.DB.prepare('SELECT user_id FROM agencies WHERE id = ?;').bind(id).first() as any;
      if (!agencyObj) return jsonResponse({ error: 'الوكالة العقارية غير موجودة.' }, 404);

      await env.DB.prepare('DELETE FROM users WHERE id = ?;').bind(agencyObj.user_id).run();
      return jsonResponse({ status: 'success', message: 'تم إزالة الوكالة وحسابها بالكامل.' });
    }

    if (path === '/api/owner/analytics' && method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      if (!user || user.role !== 'owner') return jsonResponse({ error: 'متاح فقط لإدارة المنصة.' }, 403);

      const totalProperties = await env.DB.prepare('SELECT COUNT(*) as count FROM properties;').first() as any;
      const totalAgencies = await env.DB.prepare('SELECT COUNT(*) as count FROM agencies;').first() as any;
      const totalRequests = await env.DB.prepare('SELECT COUNT(*) as count FROM requests;').first() as any;
      const typeDistribution = await env.DB.prepare('SELECT type, COUNT(*) as count FROM properties GROUP BY type;').all();
      const categoryDistribution = await env.DB.prepare('SELECT category, COUNT(*) as count FROM properties GROUP BY category;').all();
      const provincialProperties = await env.DB.prepare('SELECT province, COUNT(*) as count FROM properties GROUP BY province;').all();

      return jsonResponse({
        propertyCount: totalProperties ? totalProperties.count : 0,
        agencyCount: totalAgencies ? totalAgencies.count : 0,
        requestCount: totalRequests ? totalRequests.count : 0,
        types: typeDistribution.results,
        categories: categoryDistribution.results,
        provinces: provincialProperties.results
      });
    }

    // Capture standard 404
    return jsonResponse({
      success: false,
      error: 'المسار غير موجود',
      message: 'عذراً، المسار المطلوب غير متوفر.'
    }, 404);

  } catch (outerErr: any) {
    return jsonResponse({
      success: false,
      error: outerErr?.message || 'خطأ داخلي فادح في السيرفر',
      message: outerErr?.message || 'خطأ داخلي فادح في السيرفر'
    }, 500);
  }
};
