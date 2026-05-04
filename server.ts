import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Sheets Auth
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  const sheets = google.sheets({ version: "v4", auth });

  // API Route to submit data
  app.post("/api/submit-test", async (req, res) => {
    try {
      const { 
        registrationNumber, 
        registrationDate, 
        name, 
        gender, 
        birthDate, 
        previousSchool, 
        address, 
        recommendedMajor, 
        eyeHealthStatus, 
        scores 
      } = req.body;

      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      
      if (!spreadsheetId) {
        throw new Error("GOOGLE_SHEET_ID is not configured");
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A2", // Assumes first row is header
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              registrationNumber,
              registrationDate,
              name,
              gender,
              birthDate,
              previousSchool,
              address,
              recommendedMajor,
              eyeHealthStatus,
              scores['Pemesinan Kapal'],
              scores['Teknik Kendaraan Ringan'],
              scores['Desain Komunikasi Visual'],
              scores['Teknik Logistik']
            ],
          ],
        },
      });

      res.status(200).json({ message: "Data submitted successfully" });
    } catch (error) {
      console.error("Error submitting to Google Sheets:", error);
      res.status(500).json({ error: "Failed to submit data to Google Sheets" });
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
