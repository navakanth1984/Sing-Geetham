import express from "express";
import path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up JSON and URL-encoded body parsers with a higher limit for audio/video uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy-loaded Gemini AI client to keep app startup fast and resilient
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in the environment. Falling back to simulated synthesis.");
    }
    // Note: GoogleGenAI requires an object with { apiKey }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "MOCK_KEY" });
  }
  return aiClient;
}

// Helper utility to robustly query text-based Gemini generation with automatic retry and model fallback (handles 503 errors seamlessly)
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    model: string;
  },
  retries = 2,
  delay = 1000
): Promise<any> {
  const modelsToTry = [
    params.model,
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (let attempt = 0; attempt < retries + 1; attempt++) {
    for (const modelName of modelsToTry) {
      try {
        console.log(`[Sing Geetham] Calling model ${modelName} (attempt ${attempt + 1}/${retries + 1})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Sing Geetham] Model call failed for ${modelName} on attempt ${attempt + 1}:`, err.message || err);
        
        // If it's a 400 Bad Request (e.g., input too long, config error), propagate immediately instead of retrying/falling back
        const is400 = err.status === 400 || err.code === 400 || (err.message && err.message.includes("400")) || (err.message && err.message.includes("invalid"));
        if (is400) {
          throw err;
        }
      }
    }
    if (attempt < retries) {
      console.log(`[Sing Geetham] Retrying service call in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// REST API Endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Sing Geetham Engine"
  });
});

// 1. Convert Text to Speech (TTS Vocal Synthesis) using gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "kore", language = "en-us" } = req.body;
    if (!text) {
       res.status(400).json({ error: "Text prompt is required" });
       return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
        success: false,
        error: "GEMINI_API_KEY not found in environment",
        isSimulated: true
      });
      return;
    }

    const ai = getGeminiClient();
    console.log(`[Sing Geetham] Generating vocal synthesis via gemini-3.1-flash-tts-preview for text: "${text.substring(0, 30)}..."`);
    
    const voiceNameMap: Record<string, string> = {
      puck: "Puck",
      charon: "Charon",
      kore: "Kore",
      fenrir: "Fenrir",
      zephyr: "Zephyr"
    };
    const selectedVoice = voiceNameMap[voice.toLowerCase()] || "Kore";

    // Call Gemini 3.1 TTS model using the official non-deprecated generateContent method
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say this in a highly expressive voice matching the lyric mood: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice }
          }
        }
      }
    });

    let audioBase64 = "";
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          audioBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!audioBase64) {
      res.status(500).json({ error: "No audio generated from gemini-3.1-flash-tts-preview" });
      return;
    }

    res.json({
      success: true,
      audioBase64,
      mimeType: "audio/pcm",
      text
    });
  } catch (error: any) {
    console.error("[Sing Geetham] TTS Error:", error);
    res.status(500).json({ error: error.message || "TTS vocal synthesis failed" });
  }
});

// 2. Generate Music Tracks using Lyria Models (lyria-3-clip-preview / lyria-3-pro-preview)
app.post("/api/generate-music", async (req, res) => {
  try {
    const { prompt, modelType = "clip" } = req.body;
    if (!prompt) {
       res.status(400).json({ error: "Prompt is required" });
       return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
        success: false,
        error: "GEMINI_API_KEY not found in environment",
        isSimulated: true
      });
      return;
    }

    const modelName = modelType === "pro" ? "lyria-3-pro-preview" : "lyria-3-clip-preview";
    const ai = getGeminiClient();
    
    console.log(`[Sing Geetham] Requesting music from ${modelName} with prompt: "${prompt}"`);

    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents: prompt,
    });

    let audioBase64 = "";
    let lyrics = "";
    let mimeType = "audio/wav";

    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      res.status(500).json({ error: "Music generation returned empty stream data." });
      return;
    }

    res.json({
      success: true,
      audioBase64,
      lyrics,
      mimeType
    });
  } catch (error: any) {
    console.error("[Sing Geetham] Lyria Music Generation Error:", error);
    res.status(500).json({ error: error.message || "Lyria music generation failed" });
  }
});

// 3. Audio/Video Speech Transcription using gemini-3.5-flash (with robust fallback)
app.post("/api/transcribe", async (req, res) => {
  try {
    const { fileData, mimeType } = req.body;
    if (!fileData || !mimeType) {
       res.status(400).json({ error: "Both base64 fileData and mimeType are required" });
       return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
        success: false,
        error: "GEMINI_API_KEY not found in environment for transcription",
        isSimulated: true
      });
      return;
    }

    const ai = getGeminiClient();
    console.log(`[Sing Geetham] Transcribing uploaded item (${mimeType}) using gemini-3.5-flash (with robust fallbacks)...`);

    const result = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: [
        { inlineData: { data: fileData, mimeType } },
        { text: "Strictly transcribe the spoken speech or lyrics in this file. Correct and structure it as lyrics. Produce only the transcription, no other talk." }
      ]
    });

    const transcription = result.text || "";

    res.json({
      success: true,
      transcription
    });
  } catch (error: any) {
    console.error("[Sing Geetham] Transcription Error:", error);
    res.status(500).json({ error: error.message || "Speech transcription failed" });
  }
});

// 4. automatic Lyrics Choreography & Chord Progression generator using gemini-3.5-flash (with robust fallback)
app.post("/api/analyze-lyrics", async (req, res) => {
  try {
    const { lyrics, genre = "pop" } = req.body;
    if (!lyrics) {
       res.status(400).json({ error: "Lyrics text is required" });
       return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
         success: false,
         error: "GEMINI_API_KEY not found",
         isSimulated: true
      });
      return;
    }

    const ai = getGeminiClient();
    console.log(`[Sing Geetham] Analyzing lyrics for "${genre}" chord sheet with robust fallback.`);

    const prompt = `Analyze these lyrics and suggest a cohesive professional chord progression and arrangement suited for ${genre} genre:
Lyrics: "${lyrics}"

Respond strictly with a raw JSON block containing these exact fields:
{
  "chords": ["C", "F", "G", "Am"...],
  "tempo": 120,
  "key": "C Major",
  "suggestions": ["Add a light modern synth", "Delay effect on lead vocals"],
  "arrangement": [
    { "section": "Intro", "chords": "C - F", "intensity": "low" },
    { "section": "Verse 1", "chords": "C - F - C - G", "intensity": "medium" },
    { "section": "Chorus 1", "chords": "Am - F - C - G", "intensity": "high" }
  ]
}`;

    const result = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt
    });

    let rawText = result.text || "";
    // Clean potential markdown wrap
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(rawText);
      res.json({
        success: true,
        ...parsed
      });
    } catch {
      // In case parsing failed, try finding braces
      const firstBrace = rawText.indexOf("{");
      const lastBrace = rawText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const trimmedJsonString = rawText.substring(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(trimmedJsonString);
          res.json({
            success: true,
            ...parsed
          });
          return;
        } catch {}
      }
      res.json({
        success: false,
        error: "Failed to parse model's JSON structure",
        rawResult: rawText
      });
    }
  } catch (error: any) {
    console.error("[Sing Geetham] Analyze Lyrics Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze chords" });
  }
});

// Vite server development / production bundling setup
async function setupViteStaticServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite in middleware mode for ultra-fast dev compilation and file loading
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[Sing Geetham] Dev Mode: Vite development server mounted successfully.");
  } else {
    // Production: Serve pre-built static client files from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Sing Geetham] Production Mode: Static file hosting initialized on /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sing Geetham] Server beautifully running on http://0.0.0.0:${PORT}`);
  });
}

setupViteStaticServer().catch((err) => {
  console.error("[Sing Geetham] Failed to instantiate Vite and build layers:", err);
});
