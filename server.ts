import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Paths for JSON storage
const DATA_DIR = path.join(process.cwd(), "data");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory fallback if file system acts up
let inquiries: any[] = [];
let sheetConfig = { spreadsheetId: null, spreadsheetUrl: null };

// Load initially
try {
  if (fs.existsSync(INQUIRIES_FILE)) {
    const raw = fs.readFileSync(INQUIRIES_FILE, "utf-8");
    inquiries = JSON.parse(raw);
  } else {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify([], null, 2));
  }
} catch (err) {
  console.error("Failed to load inquiries.json, using in-memory store:", err);
}

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    sheetConfig = JSON.parse(raw);
  } else {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(sheetConfig, null, 2));
  }
} catch (err) {
  console.error("Failed to load config.json, using in-memory store:", err);
}

// Helper to save inquiries
const saveInquiries = () => {
  try {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2));
  } catch (err) {
    console.error("Failed to write to inquiries.json:", err);
  }
};

// Helper to save config
const saveConfig = () => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(sheetConfig, null, 2));
  } catch (err) {
    console.error("Failed to write to config.json:", err);
  }
};

// Robust IST date and time formatter that does not rely on Node's timezone database (supports all container environments)
function formatISTDateAndTime(timestamp: string) {
  let dateStr = "";
  let timeStr = "";
  
  try {
    // 1. First attempt: standard toLocaleString with Asia/Kolkata
    const dateObj = new Date(timestamp);
    dateStr = dateObj.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    timeStr = dateObj.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  } catch (err) {
    console.warn("Standard IST formatting failed, using timezoneoffset fallback:", err);
  }

  // 2. If it is empty, invalid, or threw an error, calculate manually via offset
  // IST is UTC + 5:30. Offset in milliseconds = (5 * 60 + 30) * 60 * 1000 = 19800000 ms
  if (!dateStr || !timeStr || dateStr.includes("Invalid") || timeStr.includes("Invalid")) {
    try {
      const dateObj = new Date(timestamp);
      const istOffsetMs = 19800000;
      const istDateObj = new Date(dateObj.getTime() + istOffsetMs);

      const day = String(istDateObj.getUTCDate()).padStart(2, "0");
      const month = String(istDateObj.getUTCMonth() + 1).padStart(2, "0");
      const year = istDateObj.getUTCFullYear();
      dateStr = `${day}/${month}/${year}`;

      let hours = istDateObj.getUTCHours();
      const minutes = String(istDateObj.getUTCMinutes()).padStart(2, "0");
      const seconds = String(istDateObj.getUTCSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, "0");
      timeStr = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
    } catch (manualErr) {
      console.error("Manual IST calculation failed:", manualErr);
      // Absolute fallback
      const d = new Date(timestamp);
      dateStr = d.toISOString().split("T")[0];
      timeStr = d.toISOString().split("T")[1].slice(0, 8);
    }
  }

  return { date: dateStr, time: timeStr };
}

// API Routes
app.get("/api/inquiries", (req, res) => {
  res.json(inquiries);
});

app.post("/api/inquiries", async (req, res) => {
  const { name, mobile, standard, board, stream, centers } = req.body;
  if (!name || !mobile || !standard || !centers) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const newInquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    name,
    mobile,
    standard,
    board: board || null,
    stream: stream || null,
    centers,
    status: "pending"
  };

  inquiries.unshift(newInquiry); // Add newest first
  saveInquiries();

  // Option A Auto-Sync: post directly to user's Google Sheets Webhook
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      // Append a cache-buster query parameter to prevent any redirect caching across sequential requests
      const delimiter = webhookUrl.includes("?") ? "&" : "?";
      const targetUrl = `${webhookUrl}${delimiter}_cb=${Date.now()}`;

      const { date: istDate, time: istTime } = formatISTDateAndTime(newInquiry.timestamp);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        body: JSON.stringify({
          id: newInquiry.id,
          timestamp: `${istDate}, ${istTime}`,
          Timestamp: `${istDate}, ${istTime}`,
          date: istDate,
          Date: istDate,
          time: istTime,
          Time: istTime,
          name: newInquiry.name,
          mobile: newInquiry.mobile,
          standard: newInquiry.standard,
          board: newInquiry.board || "N/A",
          stream: newInquiry.stream || "N/A",
          centers: newInquiry.centers.join(", ")
        })
      });
      
      const isSuccessStatus = response.ok || [200, 201, 301, 302, 303, 307, 308].includes(response.status);
      if (isSuccessStatus) {
        newInquiry.status = "synced";
        saveInquiries();
        console.log(`Successfully auto-appended inquiry ${newInquiry.id} to Google Sheet Webhook (Status: ${response.status}).`);
      } else {
        console.warn(`Webhook responded with status ${response.status} for ${newInquiry.id}`);
      }
    } catch (err) {
      console.error("Failed to auto-sync with Google Sheet Webhook:", err);
    }
  }

  res.status(201).json(newInquiry);
});

// Update sync status
app.post("/api/inquiries/sync-status", (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids)) {
    res.status(400).json({ error: "ids must be an array" });
    return;
  }

  inquiries = inquiries.map(inq => {
    if (ids.includes(inq.id)) {
      return { ...inq, status: status || "synced" };
    }
    return inq;
  });

  saveInquiries();
  res.json({ success: true, updatedCount: ids.length });
});

// Sheets Config
app.get("/api/config", (req, res) => {
  res.json(sheetConfig);
});

app.post("/api/config", (req, res) => {
  const { spreadsheetId, spreadsheetUrl } = req.body;
  sheetConfig = {
    spreadsheetId: spreadsheetId || null,
    spreadsheetUrl: spreadsheetUrl || null
  };
  saveConfig();
  res.json(sheetConfig);
});

// Vite Middleware Integration
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`Study Circle Server running on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error("Vite server configuration failed:", err);
});
