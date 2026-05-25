-- schema.sql - Cloudflare D1 Migration & Database Schema for Estate Podium

-- Drop existing tables if they exist to start fresh in production
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS agency_locations;
DROP TABLE IF EXISTS agencies;
DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'agency'))
);

-- 2. Agencies Table
CREATE TABLE agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT,
  subscription_status TEXT NOT NULL CHECK(subscription_status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Agency Locations Scope Table
CREATE TABLE agency_locations (
  agency_id INTEGER NOT NULL,
  province TEXT NOT NULL,
  PRIMARY KEY(agency_id, province),
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- 4. Properties Table
CREATE TABLE properties (
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

-- 5. Property Showcase Gallery Images Table
CREATE TABLE property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 6. Lead Requests Table
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

-- 7. Subscriptions Ledger Table
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Add Default Seeding data for Cloudflare D1 environment onboarding:
-- Admin Credentials (username: Alihassan123 / password: aliali7777)
-- (Hash: $2a$10$wU05z9X7lCscXkG.8qS0reS0Q/2n.Yf7w8C8gN1WjGqf.S3Yw6i9m)
INSERT INTO users (id, username, password_hash, role) VALUES (1, 'Alihassan123', '$2a$10$wU05z9X7lCscXkG.8qS0reS0Q/2n.Yf7w8C8gN1WjGqf.S3Yw6i9m', 'owner');
