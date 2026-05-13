import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // In-memory store for simulation purposes (Missions, Logs)
  let missions: any[] = [
    {
      id: "m1",
      name: "Borders Patrol Alpha",
      callsign: "SV-7",
      created_at: new Date().toISOString(),
      waypoints: [
        { id: "wp1", name: "Alpha-1", lat: 34.15768, lon: -117.48392, alt: 15000, order: 0 },
        { id: "wp2", name: "Alpha-2", lat: 34.20000, lon: -117.50000, alt: 15500, order: 1 }
      ]
    }
  ];
  let logs: any[] = [];

  // ── API Routes ────────────────────────────────────────────────────────────────

  app.get("/api/health", (req, res) => {
    res.json({ service: "orvane-seven", status: "online" });
  });

  app.get("/api/missions", (req, res) => {
    res.json(missions);
  });

  app.post("/api/missions", (req, res) => {
    const { name, callsign } = req.body;
    const mission = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || "New Mission",
      callsign: callsign || "SV-7",
      created_at: new Date().toISOString(),
      waypoints: []
    };
    missions.push(mission);
    res.json(mission);
  });

  app.get("/api/missions/:id", (req, res) => {
    const mission = missions.find(m => m.id === req.params.id);
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    res.json(mission);
  });

  app.delete("/api/missions/:id", (req, res) => {
    missions = missions.filter(m => m.id !== req.params.id);
    logs = logs.filter(l => l.mission_id !== req.params.id);
    res.json({ deleted: true });
  });

  app.post("/api/missions/:id/waypoints", (req, res) => {
    const mission = missions.find(m => m.id === req.params.id);
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    const { name, lat, lon, alt, order } = req.body;
    const wp = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      alt: parseFloat(alt) || 15000,
      order: order ?? mission.waypoints.length
    };
    mission.waypoints.push(wp);
    res.json(mission);
  });

  app.delete("/api/missions/:id/waypoints/:wpId", (req, res) => {
    const mission = missions.find(m => m.id === req.params.id);
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    mission.waypoints = mission.waypoints.filter((w: any) => w.id !== req.params.wpId);
    res.json(mission);
  });

  app.post("/api/logs", (req, res) => {
    const log = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...req.body
    };
    logs.push(log);
    if (logs.length > 1000) logs.shift();
    res.json(log);
  });

  app.get("/api/missions/:id/logs", (req, res) => {
    const missionLogs = logs.filter(l => l.mission_id === req.params.id);
    res.json(missionLogs.reverse());
  });

  // ── Static / Vite ─────────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true"
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
