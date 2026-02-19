
-- 1. Venues Table
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  rating REAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  description TEXT,
  image TEXT,
  phone TEXT,
  address TEXT,
  tags TEXT, -- JSON array string
  features TEXT -- JSON array string
);

-- 2. CCAs Table
CREATE TABLE IF NOT EXISTS ccas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  venue_id TEXT NOT NULL,
  rating REAL DEFAULT 0,
  image TEXT,
  experience TEXT,
  languages TEXT, -- JSON array string
  height TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  grade TEXT DEFAULT 'PRO',
  points INTEGER DEFAULT 0,
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

-- 3. Posts Table (Community)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  board TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  venue_id TEXT,
  cca_id TEXT,
  customer_name TEXT NOT NULL,
  reservation_time TEXT,
  reservation_date TEXT,
  status TEXT DEFAULT 'pending'
);

-- 5. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  site_name TEXT,
  admin_phone TEXT,
  admin_email TEXT,
  admin_sns TEXT,
  hq_address TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- [초기 샘플 데이터 삽입]
INSERT OR IGNORE INTO venues (id, name, region, rating, reviews_count, description, image, phone, address, tags, features)
VALUES ('v1', 'Grand Palace JTV', 'Pasay', 4.9, 128, 'Experience the pinnacle of nightlife at Grand Palace JTV.', 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=2000', '0912-345-6789', 'Entertainment City, Pasay', '["Premium Service", "VIP Room"]', '["VIP Rooms", "Live Stage"]');

INSERT OR IGNORE INTO ccas (id, name, venue_id, rating, image, experience, languages, height, description, status, grade, points)
VALUES ('c1', 'Yumi Kim', 'v1', 4.9, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000', '4 Years', '["PH", "EN", "JP"]', '165 cm', '안녕하세요, 유미입니다. 우아하고 편안한 밤을 약속드립니다.', 'active', 'ACE', 1250);

INSERT OR IGNORE INTO posts (id, board, title, author, content, views, likes)
VALUES ('p1', 'Free Board', 'Welcome to the New Portal', 'Admin', 'This is the first post on our new Cloudflare D1 powered system.', 10, 5);

INSERT OR IGNORE INTO site_settings (id, site_name, admin_phone, admin_email, admin_sns, hq_address, logo_url, favicon_url)
VALUES ('global', 'Philippine JTV Association', '0917-000-0000', 'admin@ph-jtv.org', '@phjtv_official', 'Metro Manila, Philippines', '', '');
