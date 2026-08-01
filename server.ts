import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper to get all available Naga API keys
  const getApiKeysInfo = () => {
    const keys: { name: string, value: string }[] = [];
    if (process.env.NAGA_API_KEY) {
      keys.push({ name: 'NAGA_API_KEY', value: process.env.NAGA_API_KEY });
    }
    
    Object.keys(process.env).forEach(envKey => {
      if (envKey.startsWith('NAGA_API_KEY_') && process.env[envKey]) {
        keys.push({ name: envKey, value: process.env[envKey] as string });
      }
    });
    
    return keys;
  };

  const getApiKeys = () => getApiKeysInfo().map(k => k.value);

  // Stats tracking helper
  const FIREBASE_DB_URL = "https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app";
  
  const trackApiUsage = async (apiKey: string, model: string) => {
    try {
      const keyHash = Buffer.from(apiKey).toString('hex').slice(0, 16);
      const today = new Date().toISOString().split('T')[0];
      const cleanModel = model.replace(/[^a-zA-Z0-9-]/g, '_');
      
      const updates: any = {};
      
      // Increment total calls
      updates[`/stats/api_keys/${keyHash}/total_calls`] = { ".sv": { "increment": 1 } };
      
      // Increment daily calls
      updates[`/stats/api_keys/${keyHash}/daily/${today}`] = { ".sv": { "increment": 1 } };
      
      // Increment model specific calls
      updates[`/stats/api_keys/${keyHash}/models/${cleanModel}`] = { ".sv": { "increment": 1 } };

      // Update info
      const maskKey = (key: string) => `${key.slice(0, 6)}...${key.slice(-4)}`;
      updates[`/stats/api_keys/${keyHash}/info`] = {
        maskedValue: maskKey(apiKey),
        lastUsed: Date.now(),
        lastModel: model
      };

      await fetch(`${FIREBASE_DB_URL}/.json`, {
        method: "PATCH",
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

      // If developer sent 'messages' array (OpenAI format), parse it
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
      let requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
      
      let modelName = "nemotron-3-ultra-550b-a55b:free";

      const availableKeys = getApiKeys();
      if (availableKeys.length === 0) {
        return res.status(401).json({ 
          error: "No Naga API key found. Please set NAGA_API_KEY in environment variables." 
        });
      }
      const apiKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
      requestHeaders["Authorization"] = `Bearer ${apiKey}`;
      
      console.log(`[Gateway] Processing: ${req.method} ${req.path} | Client Model: ${modelFromClient || 'default'} -> Upstream Model: ${modelName}`);

      // Track usage asynchronously with model info
      trackApiUsage(apiKey, modelFromClient || modelName).catch(e => console.error("Async track error:", e));

      // Determine if streaming is requested
      const isStreamRequested = req.body?.stream === true || req.query?.stream === 'true';

      const systemPrompt = `You are VELORA v2.7.
Identity: High-speed technical entity. You are a unified 100% powerful brain.
CRITICAL RULES:
1. LANGUAGE: Respond in the SAME LANGUAGE used by the user.
2. AESTHETICS: Use Markdown heavily to make your answers BEAUTIFUL. Use headings (##), bold text, lists, and tables where appropriate.
3. STRUCTURE: Organize your thoughts clearly. Use emojis sparingly but effectively to highlight key points.
4. MANDATORY THINKING: You MUST ALWAYS wrap your internal thought process inside <thinking>...</thinking> tags. Keep thinking BRIEF.
5. FINAL ANSWER: Provide a comprehensive, professional, and elegant response after the thinking block.`;

      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...history.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text || msg.content
        })),
        { role: "user", content: message }
      ];

      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          model: modelName,
          messages: formattedMessages,
          temperature: 0.2,
          max_tokens: 4000,
          stream: isStreamRequested
        })
      });

      if (response.ok && response.body) {
        // Proxy the response directly to ensure minimal interference
        const contentType = response.headers.get("content-type") || "application/json";
        res.setHeader("Content-Type", contentType);
        
        // Proxy other important headers
        const proxyHeaders = ["cache-control", "connection", "transfer-encoding"];
        proxyHeaders.forEach(h => {
          const val = response.headers.get(h);
          if (val) res.setHeader(h, val);
        });

        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } catch (err) {
          console.error("Gateway stream proxy error:", err);
        } finally {
          res.end();
        }
        return;
      } else {
        const errorText = await response.text();
        console.error("Gateway API Error Response:", errorText);
        
        if (isStreamRequested) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          
          let userErrMsg = "**ত্রুটি:** গেটওয়ে সার্ভিস সাময়িকভাবে ব্যস্ত। দয়া করে আবার চেষ্টা করুন।";
          if (errorText.includes("rate_limit_exceeded")) {
            userErrMsg = "**সীমা অতিক্রম (Rate Limit Reached):** এআই সার্ভিস প্রোভাইডারের দৈনিক সীমা পূর্ণ হয়েছে। দয়া করে কিছু সময় পর আবার চেষ্টা করুন।";
          }

          const errData = JSON.stringify({
            id: `chatcmpl-err-${Date.now()}`,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: modelFromClient || "claude-3-5-sonnet",
            choices: [{
              index: 0,
              delta: { content: `\n\n${userErrMsg}` },
              finish_reason: "stop"
            }]
          });
          res.write(`data: ${errData}\n\ndata: [DONE]\n\n`);
          return res.end();
        } else {
          let userErrMsg = "**ত্রুটি:** গেটওয়ে সার্ভিস সাময়িকভাবে ব্যস্ত। দয়া করে আবার চেষ্টা করুন।";
          if (errorText.includes("rate_limit_exceeded")) {
            userErrMsg = "**সীমা অতিক্রম (Rate Limit Reached):** এআই সার্ভিস প্রোভাইডারের দৈনিক সীমা পূর্ণ হয়েছে। দয়া করে কিছু সময় পর আবার চেষ্টা করুন।";
          }

          return res.status(200).json({ 
            id: `chatcmpl-err-${Date.now()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: modelFromClient || "claude-3-5-sonnet",
            choices: [{
              index: 0,
              message: {
                role: "assistant",
                content: userErrMsg
              },
              finish_reason: "stop"
            }]
          });
        }
      }
      return res.status(500).json({ error: "Failed to read response body from upstream." });
    } catch (error: any) {
      console.error("Error in chat handler:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  };

  const handleModelsRequest = (req: express.Request, res: express.Response) => {
    console.log(`[Gateway] Discovery request: ${req.method} ${req.url}`);
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
        { id: "claude-3-5-sonnet", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
        { id: "claude-3-5-sonnet-20240620", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
        { id: "claude run", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
        { id: "nemotron-3-ultra-550b-a55b:free", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
        { id: "gpt-4o", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
        { id: "gpt-4o-mini", object: "model", created: now, owned_by: "velora", permission: defaultPerm },
        { id: "gpt-3.5-turbo", object: "model", created: now, owned_by: "velora", permission: defaultPerm }
      ]
    });
  };

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- VELORA CLOUD GATEWAY: HYPER-RESILIENT ROUTING ---
  // Catch OpenAI or Anthropic style endpoints ANYWHERE in the path
  app.use((req, res, next) => {
    const path = req.path.replace(/\/v1\/v1\//g, "/v1/");
    
    // Skip internal app routes
    if (path.startsWith('/api/admin') || path.startsWith('/api/auth') || path.startsWith('/api/user')) {
      return next();
    }

    // Match completions or messages endpoints
    if (path.endsWith("/chat/completions") || path.endsWith("/messages") || path.endsWith("/chat") || path.endsWith("/completions")) {
      console.log(`[Gateway] Intercepted Request: ${req.method} ${req.path} -> normalized: ${path}`);
      return handleChatRequest(req, res);
    }

    // Match models discovery
    if (path.endsWith("/models")) {
      return handleModelsRequest(req, res);
    }

    // Match specific model retrieval
    if (path.includes("/models/")) {
      const requestedId = path.split("/models/")[1] || "claude-3-5-sonnet";
      return res.json({
        id: requestedId,
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "velora"
      });
    }

    next();
  });

  // CORS middleware for external Developer API requests
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const keysInfo = getApiKeysInfo();
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch stats from Firebase
      const response = await fetch(`${FIREBASE_DB_URL}/stats/api_keys.json`);
      const statsData = await response.json() || {};
      
      const detailedKeys = keysInfo.map(info => {
        const keyHash = Buffer.from(info.value).toString('hex').slice(0, 16);
        const stats = statsData[keyHash] || {};
        return {
          name: info.name,
          maskedValue: stats.info?.maskedValue || `${info.value.slice(0, 6)}...${info.value.slice(-4)}`,
          totalCalls: stats.total_calls || 0,
          todayCalls: (stats.daily && stats.daily[today]) || 0,
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
      res.status(500).json({ status: "error", error: "Failed to fetch stats" });
    }
  });

  app.get("/api/v1/health", (req, res) => {
    res.json({ status: "ok", service: "VELORA AI API", version: "1.0.0" });
  });

  // --- Admin Firebase Database API Endpoints ---
  // FIREBASE_DB_URL moved up to be used in stats tracking

  app.get("/api/admin/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
      const queryParam = idToken ? `?auth=${idToken}` : "";
      
      // 1. Try reading /users.json
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
          apiAccessEnabled: data[uid].apiAccessEnabled ?? (data[uid].username === "admin" || data[uid].role === "admin"),
          apiKey: data[uid].apiKey || ""
        }));
        userList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return res.json({ status: "success", users: userList });
      }

      // 2. Try reading /user_list.json
      response = await fetch(`${FIREBASE_DB_URL}/user_list.json${queryParam}`);
      data = await response.json();

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
          apiAccessEnabled: data[uid].apiAccessEnabled ?? (data[uid].username === "admin" || data[uid].role === "admin"),
          apiKey: data[uid].apiKey || ""
        }));
        userList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return res.json({ status: "success", users: userList });
      }

      // 3. Fallback: Try reading usernames.json and then each user
      response = await fetch(`${FIREBASE_DB_URL}/usernames.json${queryParam}`);
      data = await response.json();

      if (data && !data.error && typeof data === "object") {
        const uids = Array.from(new Set(Object.values(data) as string[]));
        const userPromises = uids.map(async (uId) => {
          try {
            const uRes = await fetch(`${FIREBASE_DB_URL}/users/${uId}.json${queryParam}`);
            const uData = await uRes.json();
            if (uData && !uData.error) {
              return {
                uid: uId,
                fullName: uData.fullName || "No Name",
                username: uData.username || uId,
                password: uData.password || "",
                createdAt: uData.createdAt || Date.now(),
                role: uData.role || (uData.username === "admin" ? "admin" : "user"),
                status: uData.status || (uData.isBanned ? "banned" : "approved"),
                isBanned: !!uData.isBanned || uData.status === "banned",
                apiAccessEnabled: uData.apiAccessEnabled ?? (uData.username === "admin" || uData.role === "admin"),
                apiKey: uData.apiKey || ""
              };
            }
          } catch (e) {
            console.warn("Individual user fetch err:", e);
          }
          return null;
        });

        const results = (await Promise.all(userPromises)).filter(Boolean);
        results.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        return res.json({ status: "success", users: results });
      }

      return res.json({ status: "success", users: [] });
    } catch (err: any) {
      console.error("Admin GET users error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const { fullName, username, password, role, status, isBanned, apiAccessEnabled, apiKey, oldUsername } = req.body;
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

      if (apiAccessEnabled !== undefined) {
        updatedUser.apiAccessEnabled = !!apiAccessEnabled;
      }
      if (apiKey !== undefined) {
        updatedUser.apiKey = apiKey;
      }

      await fetch(`${FIREBASE_DB_URL}/users/${uid}.json${queryParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser)
      });

      await fetch(`${FIREBASE_DB_URL}/user_list/${uid}.json${queryParam}`, {
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
      return res.status(500).json({ error: err.message || "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const { username } = req.query;
      const authHeader = req.headers.authorization;
      const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
      const queryParam = idToken ? `?auth=${idToken}` : "";

      await fetch(`${FIREBASE_DB_URL}/users/${uid}.json${queryParam}`, { method: "DELETE" });
      await fetch(`${FIREBASE_DB_URL}/user_list/${uid}.json${queryParam}`, { method: "DELETE" });
      if (username) {
        await fetch(`${FIREBASE_DB_URL}/usernames/${username}.json${queryParam}`, { method: "DELETE" });
      }

      return res.json({ status: "success", message: "User deleted from Firebase" });
    } catch (err: any) {
      console.error("Admin DELETE user error:", err);
      return res.status(500).json({ error: err.message || "Failed to delete user" });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
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

      await fetch(`${FIREBASE_DB_URL}/user_list/${generatedUid}.json${queryParam}`, {
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
      return res.status(500).json({ error: err.message || "Failed to create user" });
    }
  });
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
