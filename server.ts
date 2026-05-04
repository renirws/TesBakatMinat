import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to submit data via Webhook
  app.post("/api/submit-test", async (req, res) => {
    try {
      const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn("GOOGLE_SHEET_WEBHOOK_URL is not configured.");
        return res.status(200).json({ message: "Webhook skipped (not configured)" });
      }

      // Proxy request to Google Apps Script
      await axios.post(webhookUrl, req.body);

      res.status(200).json({ message: "Data submitted to Google Sheets successfully" });
    } catch (error) {
      console.error("Error submitting to Google Sheets Webhook:", error);
      res.status(500).json({ error: "Failed to submit data" });
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
