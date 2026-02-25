import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // In-memory store for the preview
  let siteSettings = {
    site_name: 'Philippine JTV Association',
    admin_phone: '0917-000-0000',
    admin_email: 'admin@ph-jtv.org',
    admin_sns: '@phjtv_official',
    hq_address: 'Metro Manila, Philippines',
    logo_url: '',
    favicon_url: ''
  };

  let heroSections: any[] = [];
  let ccas: any[] = [
    {
      id: 'c1',
      name: 'Yumi Kim',
      nickname: 'Yumi',
      venue_id: 'v1',
      venueName: 'Grand Palace JTV',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000',
      experience: '4 Years',
      languages: '["PH", "EN", "JP"]',
      height: '165 cm',
      description: '안녕하세요, 유미입니다. 우아하고 편안한 밤을 약속드립니다.',
      status: 'active',
      grade: 'ACE',
      points: 1250,
      mbti: 'ENFJ',
      sns_links: JSON.stringify({ instagram: 'yumi_official', facebook: 'yumi.kim' }),
      experience_history: JSON.stringify([]),
      views_count: 1200,
      likes_count: 450,
      posts_count: 42
    }
  ];

  let gallery: any[] = [
    { id: 'm1', ccaId: 'c1', type: 'photo', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800', caption: '오늘 밤도 화이팅! ✨ 우리 그랜드 팰리스에서 만나요.', likes: 124, shares: 12, commentsCount: 5, date: '2023.11.20' },
    { id: 'm2', ccaId: 'c1', type: 'photo', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800', caption: '새로 장만한 드레스 👗 어때요? 피드백 환영!', likes: 98, shares: 5, commentsCount: 2, date: '2023.11.19' },
  ];

  // API Routes
  app.get("/api/gallery", (req, res) => {
    const ccaId = req.query.ccaId;
    let filtered = gallery;
    if (ccaId) filtered = gallery.filter(g => g.ccaId === ccaId);
    res.json(filtered);
  });

  app.post("/api/gallery", (req, res) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...req.body,
      likes: 0,
      shares: 0,
      commentsCount: 0,
      date: new Date().toISOString()
    };
    gallery.push(newItem);
    res.json({ success: true, id: newItem.id });
  });

  app.delete("/api/gallery/:id", (req, res) => {
    gallery = gallery.filter(g => g.id !== req.params.id);
    res.json({ success: true });
  });

  app.get("/api/settings", (req, res) => {
    res.json(siteSettings);
  });

  app.post("/api/settings", (req, res) => {
    siteSettings = { ...siteSettings, ...req.body };
    res.json({ success: true });
  });

  app.get("/api/hero", (req, res) => {
    res.json(heroSections);
  });

  app.post("/api/hero", (req, res) => {
    const { heroSections: newSections } = req.body;
    heroSections = (newSections || []).slice(0, 5).map((s: any, i: number) => ({
      ...s,
      displayOrder: i
    }));
    res.json({ success: true });
  });

  app.get("/api/ccas", (req, res) => {
    res.json(ccas.map(c => ({
      ...c,
      languages: JSON.parse(c.languages || '[]'),
      sns: JSON.parse(c.sns_links || '{}'),
      experienceHistory: JSON.parse(c.experience_history || '[]')
    })));
  });

  app.get("/api/ccas/:id", (req, res) => {
    const cca = ccas.find(c => c.id === req.params.id);
    if (!cca) return res.status(404).json({ error: "Not found" });
    res.json({
      ...cca,
      languages: JSON.parse(cca.languages || '[]'),
      sns: JSON.parse(cca.sns_links || '{}'),
      experienceHistory: JSON.parse(cca.experience_history || '[]')
    });
  });

  app.post("/api/ccas/:id", (req, res) => {
    const index = ccas.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    const body = req.body;
    ccas[index] = {
      ...ccas[index],
      ...body,
      name: body.name || ccas[index].name,
      sns_links: body.sns ? JSON.stringify(body.sns) : ccas[index].sns_links,
      experience_history: body.experienceHistory ? JSON.stringify(body.experienceHistory) : ccas[index].experience_history
    };
    res.json({ success: true });
  });

  app.post("/api/upload", (req, res) => {
    // In this preview, we handle upload by returning the base64 if provided, 
    // but the frontend already has a fallback. 
    // This endpoint is just to prevent 404.
    res.status(400).json({ error: "Use client-side upload fallback for preview" });
  });

  // Mock other APIs if needed
  app.get("/api/ccas", (req, res) => {
    // Fallback to mock data is handled in frontend apiService
    res.status(404).json({ error: "Use mock data" });
  });

  app.get("/api/venues", (req, res) => {
    res.status(404).json({ error: "Use mock data" });
  });

  app.get("/api/posts", (req, res) => {
    res.status(404).json({ error: "Use mock data" });
  });

  // CCA Portal Home API (local dev)
  let mockAttendance: any = null;

  app.get("/api/cca-portal/home", (req, res) => {
    const ccaId = req.query.ccaId;
    const today = new Date().toISOString().split('T')[0];
    const cca = ccas.find(c => c.id === ccaId) || ccas[0];

    res.json({
      cca: { ...cca, venue_name: 'Grand Palace JTV' },
      reservations: [
        { id: 'r10', customer_name: 'Lee Manager', reservation_time: '20:00', reservation_date: today, status: 'confirmed' },
        { id: 'r11', customer_name: 'Mr. Tanaka', reservation_time: '21:30', reservation_date: today, status: 'pending' },
        { id: 'r12', customer_name: 'Kim Director', reservation_time: '22:00', reservation_date: today, status: 'confirmed' },
      ],
      customerMessages: [
        { id: 'cm1', customer_name: 'Lee Manager', message: '유미님, 오늘 저녁 8시 예약 가능할까요?', is_read: 0, replied: 0, created_at: '2026-02-25 14:30:00' },
        { id: 'cm2', customer_name: 'Mr. Tanaka', message: '先日はありがとうございました。また来週お会いしましょう。', is_read: 0, replied: 0, created_at: '2026-02-25 13:15:00' },
        { id: 'cm3', customer_name: 'Kim Director', message: '다음 주 금요일 VIP 파티 참석 가능하신가요?', is_read: 1, replied: 0, created_at: '2026-02-25 11:00:00' },
        { id: 'cm4', customer_name: 'Park Team Lead', message: '오늘 방문 시 특별 주문이 있습니다.', is_read: 0, replied: 0, created_at: '2026-02-25 10:20:00' },
        { id: 'cm5', customer_name: 'Alex Chen', message: '좋은 시간 감사했습니다 😊', is_read: 1, replied: 1, created_at: '2026-02-24 22:00:00' },
      ],
      adminMessages: [
        { id: 'am1', sender_name: 'Grand Palace 매니저', title: '이번 주 VIP 이벤트 안내', message: '유미님, 이번 주 토요일 VIP 이벤트 세션 참여 가능 여부를 확인해 주세요. 참석 시 추가 포인트가 지급됩니다.', is_read: 0, priority: 'important', created_at: '2026-02-25 09:00:00' },
        { id: 'am2', sender_name: 'Grand Palace 매니저', title: '유니폼 변경 공지', message: '새로운 유니폼이 도착했습니다. 내일 출근 시 사무실에서 수령해 주세요.', is_read: 1, priority: 'normal', created_at: '2026-02-24 15:00:00' },
      ],
      notices: [
        { id: 'vn1', title: '2월 마지막 주 영업시간 변경', content: '2월 28일(금)은 특별 이벤트로 인해 영업시간이 18:00~05:00으로 변경됩니다.', is_pinned: 1, created_at: '2026-02-25 08:00:00' },
        { id: 'vn2', title: '신규 음료 메뉴 추가', content: '3월부터 프리미엄 칵테일 라인업이 추가됩니다. 메뉴 숙지 부탁드립니다.', is_pinned: 0, created_at: '2026-02-24 10:00:00' },
        { id: 'vn3', title: '직원 건강검진 안내', content: '3월 첫째 주 직원 건강검진이 예정되어 있습니다. 일정 확인 후 참여해 주세요.', is_pinned: 0, created_at: '2026-02-23 14:00:00' },
      ],
      attendance: mockAttendance,
      today,
    });
  });

  app.post("/api/cca-portal/attendance", (req, res) => {
    const { action } = req.body;
    const now = new Date().toISOString();
    if (action === 'check_in') {
      mockAttendance = { status: 'checked_in', check_in_at: now };
      res.json({ success: true, action: 'check_in', time: now });
    } else if (action === 'check_out') {
      mockAttendance = { ...mockAttendance, status: 'checked_out', check_out_at: now };
      res.json({ success: true, action: 'check_out', time: now });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
