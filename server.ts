import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Helper to get all available Naga API keys
  const getApiKeys = () => {
    const keys: string[] = [];
    if (process.env.NAGA_API_KEY) keys.push(process.env.NAGA_API_KEY);
    
    // Support multiple keys like NAGA_API_KEY_1, NAGA_API_KEY_2...
    Object.keys(process.env).forEach(envKey => {
      if (envKey.startsWith('NAGA_API_KEY_') && process.env[envKey]) {
        keys.push(process.env[envKey] as string);
      }
    });
    
    // Remove duplicates
    return Array.from(new Set(keys.filter(k => k && k.trim().length > 0)));
  };

  // Chat Handler Function
  const handleChatRequest = async (req: express.Request, res: express.Response) => {
    try {
      let message = req.body?.message || req.query?.q || req.query?.message;
      let history = req.body?.history || [];
      let messages = req.body?.messages;

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

      // Check for custom Gateway configuration (from request body or custom headers)
      const customGateway = req.body?.gatewayConfig || (req.headers['x-gateway-url'] ? {
        enabled: true,
        baseUrl: req.headers['x-gateway-url'] as string,
        apiKey: (req.headers['x-gateway-key'] as string) || '',
        authScheme: (req.headers['x-gateway-auth-scheme'] as string) || 'x-api-key',
        model: (req.headers['x-gateway-model'] as string) || 'nemotron-3-ultra-550b-a55b:free'
      } : null);

      let gatewayUrl = "https://api.naga.ac/v1/chat/completions";
      let requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
      let modelName = "nemotron-3-ultra-550b-a55b:free";

      if (customGateway && customGateway.enabled !== false && customGateway.baseUrl) {
        let cleanBase = customGateway.baseUrl.trim().replace(/\/+$/, "");
        if (cleanBase.endsWith("/chat/completions")) {
          gatewayUrl = cleanBase;
        } else {
          gatewayUrl = `${cleanBase}/chat/completions`;
        }

        const gwApiKey = customGateway.apiKey ? customGateway.apiKey.trim() : "";
        const scheme = customGateway.authScheme || 'x-api-key';

        if (scheme === 'x-api-key') {
          requestHeaders["x-api-key"] = gwApiKey;
        } else if (scheme === 'x-goog-api-key') {
          requestHeaders["x-goog-api-key"] = gwApiKey;
        } else {
          requestHeaders["Authorization"] = `Bearer ${gwApiKey}`;
        }

        if (customGateway.customHeaders && typeof customGateway.customHeaders === 'object') {
          Object.assign(requestHeaders, customGateway.customHeaders);
        }

        if (customGateway.model && customGateway.model.trim()) {
          modelName = customGateway.model.trim();
        }
      } else {
        const availableKeys = getApiKeys();
        if (availableKeys.length === 0) {
          return res.status(200).json({ 
            error: "No Naga API key found. Please set NAGA_API_KEY in environment variables or configure Gateway in settings." 
          });
        }
        const apiKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
        requestHeaders["Authorization"] = `Bearer ${apiKey}`;
      }

      const systemPrompt = `You are VELORA v2.7.
Identity: High-speed technical entity. You are a unified 100% powerful brain formed by combining all available API keys.
CRITICAL RULES:
1. LANGUAGE: Respond in the SAME LANGUAGE used by the user (Bengali, English, etc.).
2. SPEED: Respond as fast as possible.
3. MANDATORY THINKING: You MUST ALWAYS wrap your internal thought process inside <thinking>...</thinking> tags before giving your final answer. Keep your thinking VERY BRIEF (max 2-3 short sentences).
4. FINAL ANSWER: After the </thinking> tag, you MUST provide the actual answer to the user. Do NOT stop after thinking.
5. ZERO FILLER: No conversational fluff. Be direct and precise after your thinking block.`;

      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...history.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text || msg.content
        })),
        { role: "user", content: message }
      ];

      const isStream = req.body?.stream !== false;

      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          model: modelName,
          messages: formattedMessages,
          temperature: 0.2,
          max_tokens: 4000,
          stream: isStream
        })
      });

      if (response.ok && response.body) {
        if (isStream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(decoder.decode(value));
          }
          return res.end();
        } else {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await response.json();
            return res.status(200).json(data);
          } else {
            const text = await response.text();
            return res.status(200).json({
              id: "chatcmpl-" + Date.now(),
              choices: [{ message: { role: "assistant", content: text } }]
            });
          }
        }
      } else if (!response.ok) {
        const errorText = await response.text();
        console.error("Gateway API Error Response:", errorText);
        return res.status(200).json({ 
          error: `Gateway API Error (${response.status}): ${errorText}` 
        });
      }
      return res.status(200).json({ error: "Failed to read response body." });
    } catch (error: any) {
      console.error("Error in chat handler:", error);
      res.status(200).json({ error: error.message || "Failed to generate response" });
    }
  };

  app.post("/api/chat", handleChatRequest);
  app.post("/api/v1/chat", handleChatRequest);
  app.get("/api/v1/chat", handleChatRequest);
  app.post("/api/v1/chat/completions", handleChatRequest);
  app.get("/api/v1/chat/completions", handleChatRequest);

  // Gateway Connection Test Endpoint
  app.post("/api/gateway/test", async (req, res) => {
    try {
      const { baseUrl, apiKey, authScheme, model, customHeaders } = req.body || {};
      
      if (!baseUrl) {
        return res.status(400).json({ success: false, error: "Gateway base URL is required." });
      }

      let cleanBase = baseUrl.trim().replace(/\/+$/, "");
      let gatewayUrl = cleanBase.endsWith("/chat/completions") ? cleanBase : `${cleanBase}/chat/completions`;

      let headers: Record<string, string> = { "Content-Type": "application/json" };
      const scheme = authScheme || 'x-api-key';
      const keyVal = (apiKey || '').trim();

      if (scheme === 'x-api-key') {
        headers["x-api-key"] = keyVal;
      } else if (scheme === 'x-goog-api-key') {
        headers["x-goog-api-key"] = keyVal;
      } else {
        headers["Authorization"] = `Bearer ${keyVal}`;
      }

      if (customHeaders && typeof customHeaders === 'object') {
        Object.assign(headers, customHeaders);
      }

      const testModel = model || "nemotron-3-ultra-550b-a55b:free";

      const testRes = await fetch(gatewayUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
          stream: false
        })
      });

      if (testRes.ok) {
        const data = await testRes.json();
        return res.json({ 
          success: true, 
          status: testRes.status, 
          message: "Gateway connection successful! (200 OK)",
          model: testModel,
          sampleResponse: data?.choices?.[0]?.message?.content || "Connection verified."
        });
      } else {
        const errText = await testRes.text();
        return res.status(400).json({ 
          success: false, 
          status: testRes.status, 
          error: `Gateway returned status ${testRes.status}: ${errText.slice(0, 200)}` 
        });
      }
    } catch (err: any) {
      return res.status(500).json({ 
        success: false, 
        error: `Network error connecting to Gateway: ${err.message}` 
      });
    }
  });

  app.get("/api/admin/stats", (req, res) => {
    const keys = getApiKeys();
    res.json({
      status: "success",
      apiKeyCount: keys.length,
      timestamp: Date.now()
    });
  });

  app.get("/api/v1/health", (req, res) => {
    res.json({ status: "ok", service: "VELORA AI API", version: "1.0.0" });
  });

  // --- Admin Firebase Database API Endpoints ---
  const FIREBASE_DB_URL = "https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app";

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
