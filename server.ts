import express from "express";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import multer from "multer";

// ===================== CONFIG =====================
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET || "estate_podium_secret_key_2026";

// ===================== SAFE MIDDLEWARE =====================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// FIX: Prevent empty JSON crash globally
app.use((req, res, next) => {
  const oldJson = res.json;

  res.json = function (data: any) {
    if (!data) data = { success: true };

    if (typeof data === "string") {
      data = { success: true, message: data };
    }

    return oldJson.call(this, data);
  };

  next();
});

// ===================== STATIC =====================
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// ===================== DATABASE =====================
const sqlite = new Database("sqlite.db");

sqlite.exec("PRAGMA foreign_keys = ON;");

// ===================== TABLES =====================
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT
);

CREATE TABLE IF NOT EXISTS agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  phone TEXT,
  subscription_status TEXT DEFAULT 'active'
);
`);

// ===================== SEED =====================
const count = sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as any;

if (count.c === 0) {
  const hash1 = bcrypt.hashSync("aliali7777", 10);
  sqlite.prepare(
    "INSERT INTO users (username,password_hash,role) VALUES (?,?,?)"
  ).run("Alihassan123", hash1, "owner");

  const hash2 = bcrypt.hashSync("agency123", 10);
  sqlite.prepare(
    "INSERT INTO users (username,password_hash,role) VALUES (?,?,?)"
  ).run("AlRafidain_Estate", hash2, "agency");
}

// ===================== AUTH MIDDLEWARE =====================
const auth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not logged in",
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// ===================== LOGIN (FIX 405 HERE) =====================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing credentials",
    });
  }

  const user = sqlite
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as any;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid login",
    });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({
      success: false,
      message: "Invalid login",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  return res.json({
    success: true,
    user: {
      username: user.username,
      role: user.role,
    },
  });
});

// ===================== ME =====================
app.get("/api/me", auth, (req: any, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// ===================== LOGOUT =====================
app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ success: true });
});

// ===================== ROUTE FIX (IMPORTANT) =====================
// Prevent 405 noise by catching invalid methods
app.all("/api/login", (req, res, next) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Use POST only",
    });
  }
  next();
});

// ===================== ADMIN ROUTE SAFETY =====================
app.get(["/admin", "/agency", "/dashboard"], auth, (req: any, res) => {
  return res.json({
    success: true,
    message: "Dashboard OK",
    user: req.user,
  });
});

// ===================== GLOBAL ERROR FIX =====================
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Server error safe fallback",
  });
});

// ===================== START =====================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
