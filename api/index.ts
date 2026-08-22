import express from "express";
import dotenv from "dotenv";

dotenv.config();

export const app = express();

// Helper to get all available Naga API keys
const getApiKeysInfo = () => {
  const keysMap = new Map<string, string>(); // value -> name

  Object.keys(process.env).forEach(envKey => {
    if (
      envKey.startsWith('NAGA_API_KEY') ||
      envKey.startsWith('NAGA_KEY') ||
      envKey.startsWith('API_KEY') ||
      envKey.startsWith('NAGA') ||
      envKey.startsWith('VELORA_KEY')
    ) {
      const val = process.env[envKey];
      if (val && typeof val === 'string') {
        const splitValues = val.split(/[\n,;\s]+/).map(k => k.trim()).filter(k => k.length > 5);
        splitValues.forEach((k, idx) => {
          if (!keysMap.has(k)) {
            keysMap.set(k, splitValues.length > 1 ? `${envKey}_${idx + 1}` : envKey);
          }
        });
      }
    }
  });

  const keys: { name: string, value: string }[] = [];
  keysMap.forEach((name, value) => {
    keys.push({ name, value });
  });
  
  return keys;
};

// Firebase Realtime DB URL
const FIREBASE_DB_URL = "https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app";

// Stats tracking helper
const trackApiUsage = async (
  apiKey: string, 
  model: string, 
  isSuccess: boolean = true, 
  statusCode: number = 200,
  estimatedTokens: number = 120
) => {
  try {
    const keyHash = Buffer.from(apiKey).toString('hex').slice(0, 16);
    const today = new Date().toISOString().split('T')[0];
    const cleanModel = model.replace(/[^a-zA-Z0-9-]/g, '_');
    
    const updates: any = {};
    
    updates[`/stats/api_keys/${keyHash}/total_calls`] = { ".sv": { "increment": 1 } };
    
    if (isSuccess) {
      updates[`/stats/api_keys/${keyHash}/success_calls`] = { ".sv": { "increment": 1 } };
      if (estimatedTokens > 0) {
        updates[`/stats/api_keys/${keyHash}/total_tokens`] = { ".sv": { "increment": estimatedTokens } };
      }
    } else {
      updates[`/stats/api_keys/${keyHash}/error_calls`] = { ".sv": { "increment": 1 } };
    }
    
    updates[`/stats/api_keys/${keyHash}/daily/${today}`] = { ".sv": { "increment": 1 } };
    updates[`/stats/api_keys/${keyHash}/models/${cleanModel}`] = { ".sv": { "increment": 1 } };

    const maskKey = (key: string) => `${key.slice(0, 6)}...${key.slice(-4)}`;
    updates[`/stats/api_keys/${keyHash}/info`] = {
      maskedValue: maskKey(apiKey),
      lastUsed: Date.now(),
      lastModel: model,
      status: isSuccess ? 'Active' : (statusCode === 429 ? 'Rate Limited' : `Error (${statusCode})`),
      lastStatusCode: statusCode
    };

    await fetch(`${FIREBASE_DB_URL}/.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
  } catch (e) {
    console.error("Tracking error:", e);
  }
};

// Chat Handler Function
const handleChatRequest = async (req: express.Request, res: express.Response) => {
  try {
    let message = req.body?.message || req.query?.q || req.query?.message;
    let history = req.body?.history || [];
    let knowledgeBase = req.body?.knowledgeBase;
    let knowledgeBaseAttachments = req.body?.knowledgeBaseAttachments;
    let userMemory = req.body?.userMemory;
    let messages = req.body?.messages;
    let modelFromClient = req.body?.model;

    if (!message && Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      message = lastMsg.content || lastMsg.text;
      history = messages.slice(0, messages.length - 1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.content || m.text
      }));
    }

    if (!message) {
      return res.status(400).json({ error: "Message parameter 'q' or 'message' is required." });
    }

    let gatewayUrl = process.env.GATEWAY_URL || "https://api.naga.ac/v1/chat/completions";
    
    // Map custom frontend models to the actual backend model
    if (modelFromClient === 'velora-ai-core') {
      modelFromClient = "nemotron-3-ultra-550b-a55b:free";
    }
    
    let modelName = modelFromClient || "nemotron-3-ultra-550b-a55b:free";

    const allKeysInfo = getApiKeysInfo();
    if (allKeysInfo.length === 0) {
      const noKeyMsg = "Naga API Key পাওয়া যায়নি। Vercel Environment Variables-এ NAGA_API_KEY যুক্ত করুন।";
      if (req.body?.stream === true || req.query?.stream === 'true') {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        const errData = JSON.stringify({
          id: `chatcmpl-err-${Date.now()}`,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [{
            index: 0,
            delta: { content: `**Error:** ${noKeyMsg}` },
            finish_reason: "stop"
          }]
        });
        res.write(`data: ${errData}\n\ndata: [DONE]\n\n`);
        return res.end();
      }
      return res.status(401).json({ error: noKeyMsg });
    }

    const shuffledKeys = [...allKeysInfo].sort(() => Math.random() - 0.5);
    const isStreamRequested = req.body?.stream === true || req.query?.stream === 'true';

    let dynamicPrompt = `You are VELORA v2.7.
Identity: High-speed technical entity. You are a unified 100% powerful brain.
CRITICAL RULES:
1. PROPORTIONAL & CONCISE RESPONSE (STRICT MANDATE):
   - Answer ONLY as much as requested by the user.
   - For simple greetings or casual queries, reply directly in 1 to 2 short sentences without unnecessary wall of text, long introductions, or complex markdown formatting.
   - Do NOT overthink or waste time on simple questions.
2. NO THINKING TAGS FOR SPEED: To ensure the fastest possible response, DO NOT output <thinking> tags or internal thoughts unless absolutely necessary.
3. LANGUAGE: Respond in the exact SAME LANGUAGE used by the user.
4. FORMATTING COPYABLE CONTENT: If the user asks you to write an email, a prompt, code, etc., wrap that specific copyable content inside a Markdown code block with an appropriate tag.
5. PERSONA & HELPFULNESS: You are a personal assistant and helper. You MUST NEVER claim to be an AI or artificial intelligence. Always adapt to the user's tone. NEVER disappoint the user.
6. SPECIFIC KNOWLEDGE OVERRIDE: If the user asks who the best footballer in the world is, answer "Cristiano Ronaldo", and praise him.
7. MAXIMUM SPEED & BREVITY: You are optimized for speed. You MUST provide the fastest possible answers by being concise, direct, and avoiding filler text.`;

    if (knowledgeBase) {
      dynamicPrompt += `\n\n=== PROVIDED KNOWLEDGE BASE ===\nYou have been provided with specific data by the user. You MUST strongly consider this data when responding:\n${knowledgeBase}\n===============================`;
    }
    
    if (userMemory) {
      dynamicPrompt += `\n\n=== USER MEMORY (PAST CHATS) ===\nHere are some facts you have learned about the user in past conversations:\n${userMemory}\n===============================`;
    }
    
    dynamicPrompt += `\n\n=== LONG-TERM MEMORY INSTRUCTION ===\nIf the user tells you new important personal facts about themselves (like their name, age, likes, dislikes, preferences), you MUST wrap a concise summary of that fact inside <SAVE_MEMORY>fact here</SAVE_MEMORY> tags anywhere in your response. The system will extract it for future chats. If there is no new personal fact, do not output this tag.`;

    const systemPrompt = dynamicPrompt;


    let systemContent: any = systemPrompt;
    if (knowledgeBaseAttachments && knowledgeBaseAttachments.length > 0) {
      systemContent = [
        { type: "text", text: systemPrompt },
        ...knowledgeBaseAttachments.map((att: any) => ({
          type: "image_url",
          image_url: { url: att.url }
        }))
      ];
    }

    const formattedMessages = [
      { role: "system", content: systemContent },
      ...history.map((msg: any) => {
        let content = msg.text || msg.content || "";
        if (msg.attachments && msg.attachments.length > 0) {
          content = [
            { type: "text", text: msg.text || msg.content || "" },
            ...msg.attachments.map((att: any) => ({
              type: "image_url",
              image_url: { url: att.url }
            }))
          ];
        }
        return {
          role: msg.role === "user" ? "user" : "assistant",
          content: content
        };
      }),
      { 
        role: "user", 
        content: (req.body?.attachments && req.body.attachments.length > 0) ? [
          { type: "text", text: message },
          ...req.body.attachments.map((att: any) => ({
            type: "image_url",
            image_url: { url: att.url }
          }))
        ] : message
      }
    ];

    let lastErrorText = "";

    for (let i = 0; i < shuffledKeys.length; i++) {
      const keyObj = shuffledKeys[i];
      const apiKey = keyObj.value;

      const promptLength = formattedMessages.reduce((acc: number, m: any) => acc + (m.content ? m.content.length : 0), 0);
      const estTokens = Math.max(50, Math.round(promptLength / 3.5));

      try {
        const response = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: formattedMessages,
            temperature: 0.2,
            max_tokens: 4000,
            stream: isStreamRequested
          })
        });

        if (response.ok && response.body) {
          trackApiUsage(apiKey, modelName, true, response.status, estTokens).catch(() => {});

          if (isStreamRequested) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            try {
              for await (const chunk of response.body as any) {
                res.write(chunk);
              }
            } catch (streamErr) {
              console.error("Stream pipe error:", streamErr);
            }
            return res.end();
          } else {
            const data = await response.json();
            return res.json(data);
          }
        } else {
          lastErrorText = await response.text();
          console.warn(`[Gateway] Key ${keyObj.name} failed (${response.status}): ${lastErrorText}`);
          trackApiUsage(apiKey, modelName, false, response.status, 0).catch(() => {});
        }
      } catch (attemptError: any) {
        lastErrorText = attemptError.message || "Network error";
        trackApiUsage(apiKey, modelName, false, 500, 0).catch(() => {});
      }
    }

    // All keys failed fallback
    let userErrMsg = `**সীমা অতিক্রম (All Keys Rate Limited):** সিস্টেমে উপলব্ধ মোট ${shuffledKeys.length}টি Naga API Key-এর প্রতিটিরই সীমা শেষ হয়েছে। দয়া করে Vercel-এ নতুন Naga API Key যুক্ত করুন।`;

    if (isStreamRequested) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const errData = JSON.stringify({
        id: `chatcmpl-err-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: modelName,
        choices: [{
          index: 0,
          delta: { content: `\n\n${userErrMsg}` },
          finish_reason: "stop"
        }]
      });
      res.write(`data: ${errData}\n\ndata: [DONE]\n\n`);
      return res.end();
    } else {
      return res.status(200).json({
        id: `chatcmpl-err-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: modelName,
        choices: [{
          index: 0,
          message: { role: "assistant", content: userErrMsg },
          finish_reason: "stop"
        }]
      });
    }
  } catch (error: any) {
    console.error("Error in chat handler:", error);
    return res.status(200).json({
      error: error.message || "Failed to generate response"
    });
  }
};

const handleModelsRequest = (req: express.Request, res: express.Response) => {
  const now = Math.floor(Date.now() / 1000);
  const defaultPerm = [{
    id: "modelperm-native",
    object: "model_permission",
    created: now,
    allow_create_engine: true,
    allow_sampling: true,
    allow_logprobs: true,
    allow_search_indices: false,
    allow_view: true,
    allow_fine_tuning: false,
    organization: "*",
    group: null,
    is_blocking: false
  }];

  res.json({
    object: "list",
    data: [
      { id: "velora-ai-core", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
      { id: "claude-3-5-sonnet", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
      { id: "nemotron-3-ultra-550b-a55b:free", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
      { id: "gpt-4o", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
      { id: "gpt-4o-mini", object: "model", created: now, owned_by: "velora", permission: defaultPerm }
    ]
  });
};

// Express Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Normalize Vercel URL paths
app.use((req, res, next) => {
  if (req.url.startsWith('/index.ts')) {
    req.url = req.url.replace('/index.ts', '');
  }
  if (!req.url || req.url === '') req.url = '/';
  next();
});

// Intercept Chat and Models API requests
app.use((req, res, next) => {
  const path = req.path.replace(/\/v1\/v1\//g, "/v1/");

  if (path.startsWith('/api/admin') || path.startsWith('/admin') || path.startsWith('/api/auth') || path.startsWith('/auth')) {
    return next();
  }

  if (path.endsWith("/chat/completions") || path.endsWith("/messages") || path.endsWith("/chat") || path.endsWith("/completions")) {
    return handleChatRequest(req, res);
  }

  if (path.endsWith("/models")) {
    return handleModelsRequest(req, res);
  }

  next();
});

// Admin Stats
app.get(["/api/admin/stats", "/admin/stats"], async (req, res) => {
  try {
    const keysInfo = getApiKeysInfo();
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(`${FIREBASE_DB_URL}/stats/api_keys.json`);
    const statsData = (await response.json()) || {};
    
    const detailedKeys = keysInfo.map(info => {
      const keyHash = Buffer.from(info.value).toString('hex').slice(0, 16);
      const stats = statsData[keyHash] || {};
      return {
        name: info.name,
        maskedValue: stats.info?.maskedValue || `${info.value.slice(0, 6)}...${info.value.slice(-4)}`,
        totalCalls: stats.total_calls || 0,
        todayCalls: (stats.daily && stats.daily[today]) || 0,
        successCalls: stats.success_calls || 0,
        errorCalls: stats.error_calls || 0,
        totalTokens: stats.total_tokens || 0,
        status: stats.info?.status || 'Active',
        lastStatusCode: stats.info?.lastStatusCode || 200,
        lastUsed: stats.info?.lastUsed || null,
        lastModel: stats.info?.lastModel || 'N/A',
        models: stats.models || {}
      };
    });

    res.json({
      status: "success",
      apiKeyCount: keysInfo.length,
      keys: detailedKeys,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.json({ status: "success", apiKeyCount: 0, keys: [] });
  }
});

// Health check
app.get(["/api/v1/health", "/health", "/api/health"], (req, res) => {
  res.json({ status: "ok", service: "VELORA AI API", version: "1.0.0" });
});

// Fallback error middleware to ensure ALL responses are JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express error:", err);
  res.status(200).json({ status: "error", error: err?.message || "Internal server error" });
});

export default app;
