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

    const systemPrompt = `You are VELORA v2.7.
Identity: High-speed technical entity. You are a unified 100% powerful brain.
CRITICAL RULES:
1. PROPORTIONAL & CONCISE RESPONSE (STRICT MANDATE):
   - Answer ONLY as much as requested by the user.
   - For simple greetings or casual queries (e.g., "হাই", "hello", "কি কর", "কেমন আছো", "তুমি কি করতে পারো"), reply directly in 1 to 2 short sentences without unnecessary wall of text, long introductions, or complex markdown formatting.
   - Do NOT overthink or waste time on simple questions.
   - For complex or technical prompts, provide well-structured, accurate, and helpful answers without fluff.
2. MANDATORY THINKING TAGS:
   - Wrap internal thought process inside <thinking>...</thinking> tags.
   - For simple greetings/short questions, keep internal thinking extremely brief (1 short sentence) so responses return instantly.
3. LANGUAGE: Respond in the exact SAME LANGUAGE used by the user (e.g., Bengali for Bengali, English for English).
4. AESTHETICS: Use Markdown (headings, bold, lists) ONLY when helpful for technical/complex content. Keep simple answers clean and plain.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text || msg.content
      })),
      { role: "user", content: message }
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

// Admin Users Endpoints
app.get(["/api/admin/users", "/admin/users"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const queryParam = idToken ? `?auth=${idToken}` : "";
    
    let response = await fetch(`${FIREBASE_DB_URL}/users.json${queryParam}`);
    let data = await response.json();

    if (data && !data.error && typeof data === "object") {
      const userList = Object.keys(data).map(uid => ({
        uid,
        fullName: data[uid].fullName || "No Name",
        username: data[uid].username || uid,
        password: data[uid].password || "",
        createdAt: data[uid].createdAt || Date.now(),
        role: data[uid].role || (data[uid].username === "admin" ? "admin" : "user"),
        status: data[uid].status || (data[uid].isBanned ? "banned" : "approved"),
        isBanned: !!data[uid].isBanned || data[uid].status === "banned",
        isVip: !!data[uid].isVip,
        vipExpiresAt: data[uid].vipExpiresAt || 0,
        tokenState: data[uid].tokenState
      }));
      userList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.json({ status: "success", users: userList });
    }

    return res.json({ status: "success", users: [] });
  } catch (err: any) {
    console.error("Admin GET users error:", err);
    return res.json({ status: "success", users: [] });
  }
});

app.put(["/api/admin/users/:uid", "/admin/users/:uid"], async (req, res) => {
  try {
    const { uid } = req.params;
    const { fullName, username, password, role, status, isBanned, oldUsername } = req.body;
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const queryParam = idToken ? `?auth=${idToken}` : "";

    const cleanUsername = (username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    const updatedUser: any = {
      uid,
      fullName: (fullName || "").trim(),
      username: cleanUsername,
      password: (password || "").trim(),
      role: role || (cleanUsername === "admin" ? "admin" : "user"),
      status: status || (isBanned ? "banned" : "approved"),
      isBanned: isBanned !== undefined ? isBanned : (status === "banned"),
      updatedAt: Date.now()
    };

    await fetch(`${FIREBASE_DB_URL}/users/${uid}.json${queryParam}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser)
    });

    if (oldUsername && oldUsername !== cleanUsername) {
      await fetch(`${FIREBASE_DB_URL}/usernames/${oldUsername}.json${queryParam}`, { method: "DELETE" });
    }
    if (cleanUsername) {
      await fetch(`${FIREBASE_DB_URL}/usernames/${cleanUsername}.json${queryParam}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uid)
      });
    }

    return res.json({ status: "success", user: updatedUser });
  } catch (err: any) {
    console.error("Admin PUT user error:", err);
    return res.json({ status: "error", error: err.message || "Failed to update user" });
  }
});

app.delete(["/api/admin/users/:uid", "/admin/users/:uid"], async (req, res) => {
  try {
    const { uid } = req.params;
    const { username } = req.query;
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const queryParam = idToken ? `?auth=${idToken}` : "";

    await fetch(`${FIREBASE_DB_URL}/users/${uid}.json${queryParam}`, { method: "DELETE" });
    if (username) {
      await fetch(`${FIREBASE_DB_URL}/usernames/${username}.json${queryParam}`, { method: "DELETE" });
    }

    return res.json({ status: "success", message: "User deleted" });
  } catch (err: any) {
    console.error("Admin DELETE user error:", err);
    return res.json({ status: "error", error: err.message || "Failed to delete user" });
  }
});

app.post(["/api/admin/users", "/admin/users"], async (req, res) => {
  try {
    const { fullName, username, password, role, status } = req.body;
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const queryParam = idToken ? `?auth=${idToken}` : "";

    const cleanUsername = (username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const generatedUid = `user_${Date.now()}_${Math.floor(Math.random()*1000)}`;

    const newUser = {
      uid: generatedUid,
      fullName: (fullName || "").trim(),
      username: cleanUsername,
      password: (password || "").trim(),
      createdAt: Date.now(),
      role: role || (cleanUsername === "admin" ? "admin" : "user"),
      status: status || "approved",
      isBanned: status === "banned"
    };

    await fetch(`${FIREBASE_DB_URL}/users/${generatedUid}.json${queryParam}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });

    await fetch(`${FIREBASE_DB_URL}/usernames/${cleanUsername}.json${queryParam}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generatedUid)
    });

    return res.json({ status: "success", user: newUser });
  } catch (err: any) {
    console.error("Admin POST user error:", err);
    return res.json({ status: "error", error: err.message || "Failed to create user" });
  }
});

// Fallback error middleware to ensure ALL responses are JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express error:", err);
  res.status(200).json({ status: "error", error: err?.message || "Internal server error" });
});

export default app;
