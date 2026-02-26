
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
  nickname TEXT,
  real_name_first TEXT,
  real_name_middle TEXT,
  real_name_last TEXT,
  birthday TEXT,
  address TEXT,
  phone TEXT,
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
  mbti TEXT,
  zodiac TEXT,
  one_line_story TEXT,
  sns_links TEXT, -- JSON string
  experience_history TEXT, -- JSON string
  marital_status TEXT,
  children_status TEXT,
  special_notes TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  weight TEXT,
  drinking TEXT,
  smoking TEXT,
  pets TEXT,
  specialties TEXT, -- JSON array string
  password TEXT,
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
  cca_id TEXT, -- Main or first CCA
  cca_ids TEXT, -- JSON array of CCA IDs
  customer_name TEXT NOT NULL,
  customer_contact TEXT, -- Kakao, FB, Telegram, Phone etc.
  reservation_time TEXT,
  reservation_date TEXT,
  customer_note TEXT,
  group_size INTEGER DEFAULT 1,
  table_id TEXT,
  room_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, no_show, request_change
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Note: If tables already exist, run these manual updates:
-- ALTER TABLE reservations ADD COLUMN customer_contact TEXT;
-- ALTER TABLE reservations ADD COLUMN table_id TEXT;
-- ALTER TABLE reservations ADD COLUMN room_id TEXT;
-- ALTER TABLE reservations ADD COLUMN cca_ids TEXT;

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

-- 6. Hero Sections Table
CREATE TABLE IF NOT EXISTS hero_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cca_id TEXT,
  badge1 TEXT,
  badge2 TEXT,
  title TEXT,
  content TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  display_order INTEGER
);

-- 7. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  cca_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'photo', 'video'
  url TEXT NOT NULL,
  caption TEXT,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cca_id) REFERENCES ccas(id)
);

-- 8. CCA Holidays Table
CREATE TABLE IF NOT EXISTS cca_holidays (
  id TEXT PRIMARY KEY,
  cca_id TEXT NOT NULL,
  holiday_date TEXT NOT NULL, -- YYYY-MM-DD
  FOREIGN KEY (cca_id) REFERENCES ccas(id),
  UNIQUE(cca_id, holiday_date)
);

-- 9. CCA Sold Out Table
CREATE TABLE IF NOT EXISTS cca_sold_out (
  id TEXT PRIMARY KEY,
  cca_id TEXT NOT NULL,
  sold_out_date TEXT NOT NULL, -- YYYY-MM-DD
  FOREIGN KEY (cca_id) REFERENCES ccas(id),
  UNIQUE(cca_id, sold_out_date)
);

-- 10. CCA Attendance Table (출퇴근 기록)
CREATE TABLE IF NOT EXISTS cca_attendance (
  id TEXT PRIMARY KEY,
  cca_id TEXT NOT NULL,
  venue_id TEXT NOT NULL,
  check_in_at DATETIME,
  check_out_at DATETIME,
  attendance_date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT DEFAULT 'checked_in', -- 'checked_in', 'checked_out'
  FOREIGN KEY (cca_id) REFERENCES ccas(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id),
  UNIQUE(cca_id, attendance_date)
);

-- 11. Customer Messages Table (고객 메시지)
CREATE TABLE IF NOT EXISTS customer_messages (
  id TEXT PRIMARY KEY,
  cca_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  reply_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  replied_at DATETIME,
  FOREIGN KEY (cca_id) REFERENCES ccas(id)
);

-- 12. Admin Messages Table (관리자→CCA 개별 메시지)
CREATE TABLE IF NOT EXISTS admin_messages (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  cca_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'normal', -- 'normal', 'important', 'urgent'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(id),
  FOREIGN KEY (cca_id) REFERENCES ccas(id)
);

-- 13. Venue Notices Table (업체 공지사항)
CREATE TABLE IF NOT EXISTS venue_notices (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

-- [초기 샘플 데이터 삽입]
INSERT OR IGNORE INTO venues (id, name, region, rating, reviews_count, description, image, phone, address, tags, features)
VALUES ('v1', 'Grand Palace JTV', 'Pasay', 4.9, 128, 'Experience the pinnacle of nightlife at Grand Palace JTV.', 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=2000', '0912-345-6789', 'Entertainment City, Pasay', '["Premium Service", "VIP Room"]', '["VIP Rooms", "Live Stage"]');

INSERT OR IGNORE INTO ccas (id, name, venue_id, rating, image, experience, languages, height, description, status, grade, points)
VALUES ('c1', 'Yumi Kim', 'v1', 4.9, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000', '4 Years', '["ENGLISH", "KOREAN", "JAPANESE"]', '165 cm', '안녕하세요, 유미입니다. 우아하고 편안한 밤을 약속드립니다.', 'active', 'ACE', 1250);

INSERT OR IGNORE INTO posts (id, board, title, author, content, views, likes)
VALUES ('p1', 'Free Board', 'Welcome to the New Portal', 'Admin', 'This is the first post on our new Cloudflare D1 powered system.', 10, 5);

INSERT OR IGNORE INTO site_settings (id, site_name, admin_phone, admin_email, admin_sns, hq_address, logo_url, favicon_url)
VALUES ('global', 'Philippine JTV Association', '0917-000-0000', 'admin@ph-jtv.org', '@phjtv_official', 'Metro Manila, Philippines', '', '');

-- CCA Portal 샘플 데이터
INSERT OR IGNORE INTO customer_messages (id, cca_id, customer_name, message, is_read, replied, created_at)
VALUES
  ('cm1', 'c1', 'Lee Manager', '유미님, 오늘 저녁 8시 예약 가능할까요?', 0, 0, '2026-02-25 14:30:00'),
  ('cm2', 'c1', 'Mr. Tanaka', '先日はありがとうございました。また来週お会いしましょう。', 0, 0, '2026-02-25 13:15:00'),
  ('cm3', 'c1', 'Kim Director', '다음 주 금요일 VIP 파티 참석 가능하신가요?', 1, 0, '2026-02-25 11:00:00'),
  ('cm4', 'c1', 'Park Team Lead', '오늘 방문 시 특별 주문이 있습니다.', 0, 0, '2026-02-25 10:20:00'),
  ('cm5', 'c1', 'Alex Chen', '좋은 시간 감사했습니다 😊', 1, 1, '2026-02-24 22:00:00');

INSERT OR IGNORE INTO admin_messages (id, venue_id, cca_id, sender_name, title, message, is_read, priority, created_at)
VALUES
  ('am1', 'v1', 'c1', 'Grand Palace 매니저', '이번 주 VIP 이벤트 안내', '유미님, 이번 주 토요일 VIP 이벤트 세션 참여 가능 여부를 확인해 주세요. 참석 시 추가 포인트가 지급됩니다.', 0, 'important', '2026-02-25 09:00:00'),
  ('am2', 'v1', 'c1', 'Grand Palace 매니저', '유니폼 변경 공지', '새로운 유니폼이 도착했습니다. 내일 출근 시 사무실에서 수령해 주세요.', 1, 'normal', '2026-02-24 15:00:00');

INSERT OR IGNORE INTO venue_notices (id, venue_id, title, content, is_pinned, created_at)
VALUES
  ('vn1', 'v1', '2월 마지막 주 영업시간 변경', '2월 28일(금)은 특별 이벤트로 인해 영업시간이 18:00~05:00으로 변경됩니다.', 1, '2026-02-25 08:00:00'),
  ('vn2', 'v1', '신규 음료 메뉴 추가', '3월부터 프리미엄 칵테일 라인업이 추가됩니다. 메뉴 숙지 부탁드립니다.', 0, '2026-02-24 10:00:00'),
  ('vn3', 'v1', '직원 건강검진 안내', '3월 첫째 주 직원 건강검진이 예정되어 있습니다. 일정 확인 후 참여해 주세요.', 0, '2026-02-23 14:00:00');

INSERT OR IGNORE INTO reservations (id, venue_id, cca_id, customer_name, reservation_time, reservation_date, status)
VALUES
  ('r10', 'v1', 'c1', 'Lee Manager', '20:00', '2026-02-25', 'confirmed'),
  ('r11', 'v1', 'c1', 'Mr. Tanaka', '21:30', '2026-02-25', 'pending'),
  ('r12', 'v1', 'c1', 'Kim Director', '22:00', '2026-02-25', 'confirmed');

-- 14. CCA Point Categories (업장별 포인트/패널티 설정)
CREATE TABLE IF NOT EXISTS cca_point_categories (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL, -- 단위 금액 (Pesos)
  type TEXT DEFAULT 'point', -- 'point' (지급), 'penalty' (공제)
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

-- 15. CCA Point Logs (개별 포인트 발생 기록)
CREATE TABLE IF NOT EXISTS cca_point_logs (
  id TEXT PRIMARY KEY,
  cca_id TEXT NOT NULL,
  category_id TEXT, -- 설정된 카테고리 참조 (삭제 시에도 기록 보존을 위해 ID만 보관)
  name TEXT NOT NULL, -- 카테고리 이름 백업
  amount REAL NOT NULL, -- 단위 금액 백업
  quantity INTEGER DEFAULT 1,
  total REAL NOT NULL, -- amount * quantity (자동 계산 또는 입력)
  description TEXT, -- 특이사항
  log_date TEXT NOT NULL, -- 날짜/시간 (YYYY-MM-DD HH:mm)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cca_id) REFERENCES ccas(id)
);

-- 초기 샘플 카테고리
INSERT OR IGNORE INTO cca_point_categories (id, venue_id, name, amount, type)
VALUES 
  ('pc1', 'v1', 'Booking Point', 100, 'point'),
  ('pc2', 'v1', 'Overtime', 150, 'point'),
  ('pc3', 'v1', 'Late Arrival', 200, 'penalty'),
  ('pc4', 'v1', 'Absent without notice', 500, 'penalty');
