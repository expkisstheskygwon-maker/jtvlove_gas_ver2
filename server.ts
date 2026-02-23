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

  // API Routes
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
