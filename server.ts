import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  // API route for scanning nutrition label
  app.post("/api/scan", async (req, res) => {
    try {
      const { imageBase64, images, mode, prompt: customPrompt } = req.body;
      const rawImages: string[] = images && Array.isArray(images) && images.length > 0 
        ? images 
        : (Array.isArray(imageBase64) ? imageBase64 : (imageBase64 ? [imageBase64] : []));

      if (rawImages.length === 0) {
        return res.status(400).json({ error: "No image provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const imageParts = rawImages.map(imgStr => {
        const matches = imgStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let mimeType = "image/jpeg";
        let base64Data = imgStr;
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        };
      });

      const prompt = customPrompt || (mode === 'group'
        ? "You are a strict food packaging identifier. Look at these multiple angles of the same group of items. Extract ONLY the Brand Name and Product Name for each distinct item. STRICTLY IGNORE marketing slogans. Return ONLY a JSON array of objects with 'brand' and 'product_name' keys."
        : `
You are an expert OCR and nutritional data extractor. Analyze this food label. It may have poor lighting, glare, or slight blur. 
1. Locate the exact column for 'per 100g' or 'pro 100g'. 
2. Extract the integer values for Total Calories (kcal), Protein (g), Fats (g), Carbohydrates (g), and Fiber (g).
3. If a value is missing or listed as '<0.5' or 'trace', return 0.
4. SANITY CHECK: Protein + Fats + Carbohydrates + Fiber must not exceed 100. Total Calories should roughly equal (Protein*4) + (Carbs*4) + (Fats*9).
5. Search the label/packaging for the Brand/Manufacturer and the specific Product Name.
6. IMPORTANT: If the image is completely unreadable due to severe glare, blur, or darkness, do not guess. Set 'success': false.
7. Return ONLY a valid JSON object in this exact format:
{
  "success": true/false,
  "brand": "Extracted brand or 'Unknown'",
  "product_name": "Extracted product name or 'Unknown'",
  "calories": 0,
  "protein": 0,
  "fats": 0,
  "carbs": 0,
  "fiber": 0,
  "error_reason": "Provide a brief reason if success is false (e.g., 'Too much glare', 'Too dark')."
}
`);

      const config = {
        contents: [
          prompt,
          ...imageParts,
        ],
        config: {
          responseMimeType: "application/json",
        }
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          ...config
        });
      } catch (err: any) {
        if (err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
          console.warn("gemini-3.8-flash unavailable or quota exceeded, falling back to gemini-3.1-flash-lite");
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            ...config
          });
        } else {
          throw err;
        }
      }

      if (!response.text) {
        throw new Error("No text response from Gemini");
      }

      const data = JSON.parse(response.text);
      res.json(data);
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: error.message || "Failed to process image" });
    }
  });

  // API route for checking duplicate in Airtable
  app.get("/api/check", async (req, res) => {
    try {
      const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;
      const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
      if (!baseId || !apiKey) {
        return res.status(500).json({ error: "Airtable credentials not configured on the server." });
      }

      const { brand, product, barcode, filterByFormula } = req.query;
      let formula = '';
      if (filterByFormula) {
        formula = filterByFormula as string;
      } else if (barcode) {
        formula = `{Barcode}='${barcode}'`;
      } else {
        formula = `AND(LOWER({Brand})='${brand}', LOWER({Product Name})='${product}')`;
      }
      const url = `https://api.airtable.com/v0/${baseId}/Scans?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to check Airtable");
      }

      const data = await response.json();
      res.json({ exists: data.records && data.records.length > 0, records: data.records || [] });
    } catch (error: any) {
      console.error("Error checking Airtable:", error);
      res.status(500).json({ error: error.message || "Failed to check record" });
    }
  });

  // Proxy route for direct Airtable queries
  app.get("/api/airtable/scans", async (req, res) => {
    try {
      const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;
      const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
      if (!baseId || !apiKey) {
        return res.status(500).json({ error: "Airtable credentials not configured on the server." });
      }

      const filterByFormula = (req.query.filterByFormula as string) || '';
      const url = `https://api.airtable.com/v0/${baseId}/Scans?filterByFormula=${encodeURIComponent(filterByFormula)}`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to query Airtable");
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error querying Airtable Scans:", error);
      res.status(500).json({ error: error.message || "Failed to query Airtable" });
    }
  });

  // API route for saving to Airtable
  app.post("/api/save", async (req, res) => {
    try {
      const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;
      const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
      if (!baseId || !apiKey) {
        return res.status(500).json({ error: "Airtable credentials not configured on the server." });
      }

      const response = await fetch(`https://api.airtable.com/v0/${baseId}/Scans`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ records: [{ fields: req.body }] })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Airtable API Error:", errorData);
        throw new Error(errorData.error?.message || "Failed to save to Airtable");
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error saving to Airtable:", error);
      res.status(500).json({ error: error.message || "Failed to save record" });
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
