import express from "express";
import dotenv from "dotenv";
import { Readable } from "stream";
import webpush from "web-push";

dotenv.config();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:support@nipa.app",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (vapidErr) {
    console.warn("VAPID initialization error:", vapidErr);
  }
}


export const app = express();

// In-memory health tracker for API keys (Circuit breaker)
// If a key fails (e.g., 401 Unauthorized, 403 Forbidden, 429 Rate Limit, invalid quota),
// it is marked unhealthy with cooldown so user requests NEVER waste time on broken keys!
const keyHealthTracker = new Map<string, { consecutiveErrors: number; cooldownUntil: number; lastError: string }>();

const markKeyHealthy = (apiKey: string) => {
  keyHealthTracker.set(apiKey, { consecutiveErrors: 0, cooldownUntil: 0, lastError: "" });
};

const markKeyUnhealthy = (apiKey: string, statusCode: number, errorMsg: string) => {
  const current = keyHealthTracker.get(apiKey) || { consecutiveErrors: 0, cooldownUntil: 0, lastError: "" };
  const errors = current.consecutiveErrors + 1;
  // If 401 or 403, key is bad/expired -> cooldown 1 hour
  // If 429 rate limited -> cooldown 3 minutes
  // Other server errors -> cooldown 45 seconds
  let cooldownDuration = 45 * 1000;
  if (statusCode === 401 || statusCode === 403) {
    cooldownDuration = 60 * 60 * 1000; // 1 hour
  } else if (statusCode === 429) {
    cooldownDuration = 3 * 60 * 1000; // 3 minutes
  }

  keyHealthTracker.set(apiKey, {
    consecutiveErrors: errors,
    cooldownUntil: Date.now() + cooldownDuration,
    lastError: errorMsg
  });
};

const isKeyHealthy = (apiKey: string): boolean => {
  const health = keyHealthTracker.get(apiKey);
  if (!health) return true;
  if (health.cooldownUntil && health.cooldownUntil > Date.now()) {
    return false; // Still in cooldown, do NOT use this failing key!
  }
  return true;
};
const getApiKeysInfo = async () => {
  const keysMap = new Map<string, { name: string; type: 'naga'; customEndpoint?: string }>();

  // Chat completions must go ONLY through the Unorouter API using the UNOROUTER_AI secret key
  const nagaKeys = [];if (process.env.NAGA_API_KEY) nagaKeys.push(process.env.NAGA_API_KEY);for (let i = 1; i <= 50; i++) {
    const k = process.env[`NAGA_API_KEY_${i}`];if (k) nagaKeys.push(k);}const val = nagaKeys.join(",");
  if (val && typeof val === 'string') {
    const splitValues = val.split(/[\n,;\s]+/).map(k => k.trim()).filter(k => k.length > 5);
    splitValues.forEach((k, idx) => {
      keysMap.set(k, { 
        name: splitValues.length > 1 ? `NIPA NAGA GATEWAY_${idx + 1}` : 'NIPA NAGA GATEWAY', 
        type: 'naga' 
      });
    });
  }

  const keys: { name: string; value: string; type: 'naga'; customEndpoint?: string }[] = [];
  keysMap.forEach((info, value) => {
    keys.push({ name: info.name, value, type: info.type, customEndpoint: info.customEndpoint });
  });
  
  return keys;
};

// Firebase Realtime DB URL
const FIREBASE_DB_URL = "https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app";

// Helper to extract Bearer token from Authorization header
const getBearerToken = (req: express.Request): string | null => {
  const authHeader = req.headers.authorization || (req.headers as any).Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

// Helper to extract uid from unverified JWT middle segment (RTDB ?auth= performs cryptographic verification)
const getUidFromToken = (token: string): string | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    return payload.user_id || payload.sub || null;
  } catch (e) {
    return null;
  }
};

// Helper to construct RTDB URL with token auth parameter
const rtdb = (path: string, token: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${FIREBASE_DB_URL}${cleanPath}.json?auth=${encodeURIComponent(token)}`;
};

// Stats tracking helper
const trackApiUsage = async (
  apiKey: string, 
  model: string, 
  isSuccess: boolean = true, 
  statusCode: number = 200,
  estimatedTokens: number = 120,
  token?: string | null
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

    const targetUrl = token ? rtdb('', token) : `${FIREBASE_DB_URL}/.json`;
    await fetch(targetUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
  } catch (e) {
    // Stats must never break chat
  }
};

// Best-effort server-side token deduction helper
const deductUserTokens = async (
  uid: string, 
  token: string, 
  promptChars: number, 
  responseChars: number,
  multiplier: number = 1
) => {
  try {
    const usage = Math.max(10, Math.round(((promptChars + responseChars) / 3.5) * multiplier));
    const tokenRes = await fetch(rtdb(`users/${uid}/tokenState`, token));
    if (!tokenRes.ok) return;
    const currentTokenState = await tokenRes.json();
    if (!currentTokenState || typeof currentTokenState !== 'object') return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = currentTokenState.lastResetDate === todayStr;
    const maxDaily = currentTokenState.maxDailyTokens || 50000;
    let bonusTokens = currentTokenState.bonusTokens || 0;

    if (!isToday) {
      const prevUsed = currentTokenState.tokensUsedToday || 0;
      const bonusSpent = Math.max(0, prevUsed - maxDaily);
      bonusTokens = Math.max(0, bonusTokens - bonusSpent);
      sendPushToUser(uid, "ডেইলি টোকেন রিসেট হয়েছে!", "আপনার দৈনিক ফ্রি টোকেন কোটা রিসেট হয়েছে। এখনই চ্যাট শুরু করুন!").catch(() => {});
    }

    const currentUsed = isToday ? (currentTokenState.tokensUsedToday || 0) : 0;
    const newUsed = currentUsed + usage;

    await fetch(rtdb(`users/${uid}/tokenState`, token), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokensUsedToday: newUsed,
        bonusTokens: bonusTokens,
        lastResetDate: todayStr
      })
    });
  } catch (e) {
    // Best-effort: catch errors silently, never fail the user response because of deduction errors.
  }
};

const generateImageDirect = async (imagePrompt: string, apiKey: string, type: 'unorouter' | 'naga', endpoint?: string) => {
  const url = endpoint || (type === 'unorouter' ? "https://api.unorouter.com/v1/chat/completions" : "https://api.naga.ac/v1/chat/completions");
  const imageCandidateModels = ["juggernaut-xl:free", "dreamshaper:free", "albedobase-xl-sdxl:free", "absolutereality:free"];
  
  for (const imgModel of imageCandidateModels) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: imgModel,
          messages: [{ role: "user", content: imagePrompt }],
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: AbortSignal.timeout(35000)
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        if (content) return content;
      }
    } catch (e) {
      console.warn(`Direct image gen error with ${imgModel}:`, e);
    }
  }
  return null;
};

// Chat Handler Function
const handleChatRequest = async (req: express.Request, res: express.Response) => {
  try {
    // 1. Authenticate Request via Firebase ID Token
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    // Verify token & read user from RTDB with ?auth=
    let userDoc: any = null;
    try {
      const userRes = await fetch(rtdb(`users/${tokenUid}`, bearerToken));
      if (!userRes.ok) {
        return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
      }
      userDoc = await userRes.json();
    } catch (e) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    if (!userDoc || typeof userDoc !== 'object') {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    // Check account status
    if (userDoc.status === 'banned' || userDoc.isBanned === true) {
      return res.status(403).json({ error: "আপনার অ্যাকাউন্টটি স্থগিত (Banned) করা হয়েছে।" });
    }

    // Read system token configuration with token
    let defaultMaxDailyTokens = 50000;
    let tokenMultiplier = 1;
    let adRewardTokenAmount = 30000;
    try {
      const configRes = await fetch(rtdb('settings/token_config', bearerToken));
      if (configRes.ok) {
        const cfg = await configRes.json();
        if (cfg && typeof cfg.defaultMaxDailyTokens === 'number' && cfg.defaultMaxDailyTokens > 0) {
          defaultMaxDailyTokens = cfg.defaultMaxDailyTokens;
        }
        if (cfg && typeof cfg.tokenMultiplier === 'number' && cfg.tokenMultiplier > 0) {
          tokenMultiplier = cfg.tokenMultiplier;
        }
        if (cfg && typeof cfg.adRewardTokenAmount === 'number' && cfg.adRewardTokenAmount > 0) {
          adRewardTokenAmount = cfg.adRewardTokenAmount;
        }
      }
    } catch (e) {
      // Use defaults
    }

    // Compute quota: VIP active -> unlimited
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    const isVipActive = Boolean(
      (userDoc.vipExpiresAt && userDoc.vipExpiresAt > now) ||
      (userDoc.isVip && (!userDoc.vipExpiresAt || userDoc.vipExpiresAt === 0))
    );

    const tokenState = userDoc.tokenState || {};
    const isToday = tokenState.lastResetDate === todayStr;
    const maxDaily = tokenState.maxDailyTokens || defaultMaxDailyTokens;
    let bonusTokens = tokenState.bonusTokens || 0;

    if (!isToday) {
      const prevUsed = tokenState.tokensUsedToday || 0;
      const bonusSpent = Math.max(0, prevUsed - maxDaily);
      bonusTokens = Math.max(0, bonusTokens - bonusSpent);
    }

    const tokensUsedToday = isToday ? (tokenState.tokensUsedToday || 0) : 0;
    const totalAvailable = maxDaily + bonusTokens;
    const remaining = isVipActive ? 999999999 : (totalAvailable - tokensUsedToday);

    if (!isVipActive && remaining <= 0) {
      const quotaMsg = `আপনার আজকের ${maxDaily.toLocaleString()} ফ্রি টোকেন এবং বোনাস টোকেন শেষ হয়ে গেছে! রিডিম কোড ব্যবহার করুন অথবা প্রিমিয়াম প্ল্যান নিন।`;
      return res.status(402).json({ error: quotaMsg });
    }

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

    // Always locked to exactly gpt-oss-safeguard-20b:free (ignore client/env parameters)
    const modelName = "llama-3.3-70b-instruct:free";

    const isStreamRequested = (req.body?.stream === true || req.query?.stream === 'true') && 
      !message.toLowerCase().match(/(generate|make|create|draw|paint|show|ছবি)\s+(image|picture|photo|art|আঁকো|বানাও)/i);

    // Official Nipa AI System Prompt (Bengali-first, friendly, proud identity)
    const baseIdentityPrompt = process.env.SYSTEM_PROMPT || `You are Nipa (বাংলায় "নিপা"), the official AI assistant of NIPA NETWORK by NIPA SOLUTIONS.
Identity & Persona:
- When asked "তুমি কে?", "who are you?", or about your identity, warmly introduce yourself as Nipa (নিপা), the AI assistant of NIPA NETWORK created by NIPA SOLUTIONS.
- Always maintain a friendly, warm, respectful, and helpful tone.
- Bengali-first (বাংলা) for Bengali queries, with natural, fluent English support.
- NEVER claim to be ChatGPT, Claude, Gemini, OpenAI, Google, Anthropic, or any other AI. You are Nipa, developed by NIPA SOLUTIONS.

Capabilities:
- Fast, accurate conversation, reasoning, math, coding, creative writing, and image analysis.
- Image generation: If the user explicitly asks to generate/make/draw an image (e.g. ছবি আঁকো, ছবি তৈরি করো), include <GENERATE_IMAGE>detailed descriptive English prompt here</GENERATE_IMAGE> in your response.

Guidelines:
1. SPEED & BREVITY: Respond directly and promptly. For casual questions, give concise, natural answers without robotic boilerplate or unnecessary filler.
2. CLEAN OUTPUT: Never output internal thoughts, chain-of-thought, or XML tags other than <GENERATE_IMAGE> or <SAVE_MEMORY>.
3. LANGUAGE: Match the language and tone of the user.

APK REVERSE ENGINEERING EXPERTISE & SECURITY ANALYSIS:
You are an expert in Android APK reverse engineering (decompiling, surgical DEX patching, repacking, runtime analysis) and defensive security analysis.
Core rules (Skill: apk-reverse):
1. CLASSIFY FIRST — Identify the owning layer (Java/dex, native .so, Dart/Flutter, Unity, server) before patching.
2. DEFINE DELIVERABLE — Usually an installable APK for unrooted phones; root-only is a fallback.
3. CONTROL EXPERIMENT — Change ONE variable per experiment; keep a control build.
4. TOOLCHAIN — Use apktool (decode/rebuild), jadx (viewer), Frida (dynamic hooks), and apksigner (re-sign).
5. TRAPS — Launch-crash usually means tamper detection or cert-derived API keys. Server-enforced checks (paywalls, auth) cannot be beaten client-side — say so honestly.
6. DEFENDER PERSPECTIVE — Identify weaknesses (hardcoded keys, insecure storage, weak network validation) and suggest developer-side fixes for educational purposes.
7. EDUCATIONAL — Explain Android application structure (manifest, dex bytecode, resources, native libraries) clearly with examples to help users build more secure apps.`;

    let dynamicPrompt = baseIdentityPrompt;

    if (knowledgeBase) {
      dynamicPrompt += `\n\n=== PROVIDED KNOWLEDGE BASE ===\nYou have been provided with specific data by the user. You MUST strongly consider this data when responding:\n${knowledgeBase}\n===============================`;
    }
    
    if (userMemory) {
      dynamicPrompt += `\n\n=== USER MEMORY (PAST CHATS) ===\nHere are some facts you have learned about the user in past conversations:\n${userMemory}\n===============================`;
    }
    
    dynamicPrompt += `\n\n=== LONG-TERM MEMORY INSTRUCTION ===\nIf the user tells you new important personal facts about themselves (like their name, age, likes, dislikes, preferences), you MUST wrap a concise summary of that fact inside <SAVE_MEMORY>fact here</SAVE_MEMORY> tags anywhere in your response. The system will extract it for future chats. If there is no new personal fact, do not output this tag.`;

    const systemPrompt = dynamicPrompt;

    // ⚡ HIGH-SPEED GATEWAYS: Filter and prioritize ONLY HEALTHY keys!
    // Broken, expired, or rate-limited keys are skipped instantly so users get fast, working responses.
    const allKeysInfo = await getApiKeysInfo();
    if (allKeysInfo.length === 0) {
      const noKeyMsg = "AI গেটওয়ে API কী কনফিগার করা নেই। অনুগ্রহ করে Vercel বা এনভায়রনমেন্টে API কী সেট করুন।";
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

    // Separate healthy keys from keys in cooldown/error state
    const healthyKeys = allKeysInfo.filter(k => isKeyHealthy(k.value));
    const candidateKeys = healthyKeys.length > 0 ? healthyKeys : allKeysInfo;

    // Load-balance across healthy keys (shuffle)
    const sortedKeys = [...candidateKeys].sort(() => Math.random() - 0.5);

    // Helper to format messages for models:
    const buildFormattedMessages = (targetModel: string) => {
      const isLlamaVision = targetModel.includes('llama') && targetModel.includes('vision');
      const isGemmaModel = targetModel.includes('gemma');

      // Collect all image attachments from current request first, then history
      const reqImages: any[] = (req.body?.attachments || []).filter((a: any) => a && (a.url || a.type === 'image'));
      
      // Limit images for Llama vision strictly to 1 image to prevent 400 error: "At most 1 image(s) may be provided in one prompt"
      const allowedReqImages = isLlamaVision ? reqImages.slice(0, 1) : reqImages;

      return [
        { role: "system", content: systemPrompt },
        ...history.slice(-4).map((msg: any) => {
          let content = msg.text || msg.content || "";
          // Strip older images from history if using single-image vision model to avoid exceeding image quota
          if (!isLlamaVision && msg.attachments && msg.attachments.length > 0) {
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
          content: allowedReqImages.length > 0 ? (
            isGemmaModel ? [
              { 
                type: "text", 
                text: `${message}\n\n[Attached Image: ${allowedReqImages[0].url}]` 
              },
              ...allowedReqImages.map((att: any) => ({
                type: "image_url",
                image_url: { url: att.url }
              }))
            ] : [
              { type: "text", text: message },
              ...allowedReqImages.map((att: any) => ({
                type: "image_url",
                image_url: { url: att.url }
              }))
            ]
          ) : message
        }
      ];
    };

    // Detect if user sent any images/attachments
    const hasAttachments = (req.body?.attachments && req.body.attachments.length > 0) ||
      (knowledgeBaseAttachments && knowledgeBaseAttachments.length > 0) ||
      history.some((m: any) => m.attachments && m.attachments.length > 0);

    let lastErrorText = "";

    for (let i = 0; i < sortedKeys.length; i++) {
      const keyObj = sortedKeys[i];
      const apiKey = keyObj.value;

      // All chat completions must go ONLY through the Unorouter API using the UNOROUTER_AI secret key
      const endpointUrl = "https://api.naga.ac/v1/chat/completions";

      // The model must ALWAYS be exactly gpt-oss-safeguard-20b:free
      const candidateModels = ["llama-3.3-70b-instruct:free"];

      const uniqueModels = Array.from(new Set(candidateModels));

      for (let attemptIdx = 0; attemptIdx < uniqueModels.length; attemptIdx++) {
        const currentModel = uniqueModels[attemptIdx];
        if (attemptIdx > 0) {
          const backoffMs = Math.min(2000, 200 * Math.pow(2, attemptIdx - 1));
          console.warn(`[GATEWAY_BACKOFF ${new Date().toISOString()}] Sleeping ${backoffMs}ms before attempt ${attemptIdx + 1} with model ${currentModel}`);
          await new Promise(r => setTimeout(r, backoffMs));
        }

        try {
          const formattedMessages = buildFormattedMessages(currentModel);
          const response = await fetch(endpointUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: currentModel,
              messages: formattedMessages,
              temperature: 0.1,
              max_tokens: 900,
              stream: isStreamRequested
            }),
            // Ultra-fast failover: 3.5s for initial primary models to guarantee first token < 3s, then 6s
            signal: AbortSignal.timeout(attemptIdx < 2 ? 3500 : (attemptIdx < 4 ? 6000 : 15000))
          });

          if (response.ok && response.body) {
            markKeyHealthy(apiKey);
            trackApiUsage(apiKey, currentModel, true, response.status, 200, bearerToken).catch(() => {});

            // Prompt chars count: user prompt message + history
            const promptChars = (typeof message === 'string' ? message.length : JSON.stringify(message).length) +
              history.reduce((acc: number, m: any) => acc + (m.text ? m.text.length : (m.content ? m.content.length : 0)), 0);

            if (isStreamRequested) {
              res.setHeader("Content-Type", "text/event-stream");
              res.setHeader("Cache-Control", "no-cache");
              res.setHeader("Connection", "keep-alive");
              res.setHeader("X-Accel-Buffering", "no");

              try {
                if (response.body) {
                  const nodeStream = Readable.fromWeb(response.body as any);
                  let lastDataTime = Date.now();
                  let streamTotalChars = 0;
                  
                  // Periodic ping interval to maintain active SSE keep-alive
                  const pingInterval = setInterval(() => {
                    if (!res.writableEnded) {
                      res.write(": ping\n\n");
                      if (typeof (res as any).flush === 'function') (res as any).flush();
                    }
                  }, 2500);

                  // Upstream stall monitor interval (12 seconds without new data)
                  const stallCheckInterval = setInterval(() => {
                    const quietMs = Date.now() - lastDataTime;
                    if (quietMs > 12000 && !res.writableEnded) {
                      console.warn(`[STALL_EVENT ${new Date().toISOString()}] Upstream stream stalled for model ${currentModel} (${quietMs}ms silence)`);
                      const timeoutChunk = JSON.stringify({
                        choices: [{
                          delta: { content: "\n\n*(রেসপন্স থমকে গেছে — অনুগ্রহ করে নিচে 'পুনরায় চেষ্টা করুন' বাটনে ক্লিক করুন)*" },
                          finish_reason: "stop"
                        }]
                      });
                      res.write(`data: ${timeoutChunk}\n\ndata: [DONE]\n\n`);
                      clearInterval(pingInterval);
                      clearInterval(stallCheckInterval);
                      // Deduct partial stream tokens best-effort
                      deductUserTokens(tokenUid, bearerToken, promptChars, streamTotalChars, tokenMultiplier).catch(() => {});
                      res.end();
                    }
                  }, 2000);

                  nodeStream.on('data', (chunk: any) => {
                    lastDataTime = Date.now();
                    const str = chunk.toString();
                    streamTotalChars += str.length;
                    res.write(chunk);
                    if (typeof (res as any).flush === 'function') (res as any).flush();
                  });

                  nodeStream.on('end', () => {
                    clearInterval(pingInterval);
                    clearInterval(stallCheckInterval);
                    // On SUCCESSFUL stream completion, deduct estimated tokens server-side
                    deductUserTokens(tokenUid, bearerToken, promptChars, streamTotalChars, tokenMultiplier).catch(() => {});
                    if (!res.writableEnded) res.end();
                  });

                  nodeStream.on('error', (err: any) => {
                    clearInterval(pingInterval);
                    clearInterval(stallCheckInterval);
                    console.error(`[STREAM_ERROR ${new Date().toISOString()}] Model ${currentModel}:`, err);
                    markKeyUnhealthy(apiKey, 504, "Stream error during transfer");
                    // Deduct partial stream tokens best-effort
                    deductUserTokens(tokenUid, bearerToken, promptChars, streamTotalChars, tokenMultiplier).catch(() => {});
                    if (!res.writableEnded) {
                      const errChunk = JSON.stringify({
                        choices: [{
                          delta: { content: "\n\n*(কানেকশন ড্রপ করেছে — অনুগ্রহ করে 'পুনরায় চেষ্টা করুন' বাটনে ক্লিক করুন)*" },
                          finish_reason: "stop"
                        }]
                      });
                      res.write(`data: ${errChunk}\n\ndata: [DONE]\n\n`);
                      res.end();
                    }
                  });

                  return; // EXIT loop and function, stream actively managed
                }
              } catch (streamErr) {
                console.error(`[STREAM_SETUP_ERROR ${new Date().toISOString()}]`, streamErr);
                res.end();
                return;
              }
            } else {
              const data = await response.json();
              let content = data.choices?.[0]?.message?.content || "";
              
              // Post-process for image generation tags
              if (content.includes('<GENERATE_IMAGE>')) {
                const start = content.indexOf('<GENERATE_IMAGE>') + 16;
                const end = content.indexOf('</GENERATE_IMAGE>');
                if (end > start) {
                  const imagePrompt = content.substring(start, end).trim();
                  const imageUrl = await generateImageDirect(imagePrompt, apiKey, keyObj.type, keyObj.customEndpoint);
                  if (imageUrl) {
                    const finalImageMarkdown = imageUrl.includes('![' ) ? imageUrl : `\n\n![Generated Image](${imageUrl})`;
                    content = content.replace(/<GENERATE_IMAGE>.*?<\/GENERATE_IMAGE>/g, finalImageMarkdown);
                    if (data.choices[0].message) {
                       data.choices[0].message.content = content;
                    }
                  } else {
                    content = content.replace(/<GENERATE_IMAGE>.*?<\/GENERATE_IMAGE>/g, "\n\n*(Image generation failed)*");
                    if (data.choices[0].message) {
                       data.choices[0].message.content = content;
                    }
                  }
                }
              }
              
              // Deduct tokens server-side on SUCCESSFUL JSON gateway response
              deductUserTokens(tokenUid, bearerToken, promptChars, content.length, tokenMultiplier).catch(() => {});

              return res.json(data);
            }
          } else {
            lastErrorText = await response.text();
            console.warn(`[AI Gateway] Key ${keyObj.name} with model ${currentModel} failed (${response.status}): ${lastErrorText}`);
            
            // Only mark unhealthy if it's a structural error (auth/rate limit)
            if (response.status === 401 || response.status === 403 || response.status === 429) {
              markKeyUnhealthy(apiKey, response.status, lastErrorText);
            }
            
            trackApiUsage(apiKey, currentModel, false, response.status, 0).catch(() => {});
            continue;
          }
        } catch (attemptError: any) {
          lastErrorText = attemptError.message || "Network error";
          if (lastErrorText.includes('timeout') || lastErrorText.includes('fetch')) {
             markKeyUnhealthy(apiKey, 504, lastErrorText);
          }
          trackApiUsage(apiKey, currentModel, false, 500, 0).catch(() => {});
        }
      }
    }

    // All keys failed fallback
    let userErrMsg = `**গেটওয়ে ত্রুটি (All Gateways Rate Limited):** সিস্টেমে উপলব্ধ API Key-এর প্রতিটির সীমা শেষ হয়েছে বা অনুপলব্ধ (${lastErrorText || 'Network timeout'})। দয়া করে এডমিন বা এনভায়রনমেন্টে নতুন API Key আপডেট করুন।`;

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
      { id: "llama-3.3-70b-instruct:free", object: "model", created: now, owned_by: "naga", permission: defaultPerm }
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
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    // Read user via RTDB with ?auth= to verify role and email
    try {
      const userRes = await fetch(rtdb(`users/${tokenUid}`, bearerToken));
      if (!userRes.ok) {
        return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
      }
      const userDoc = await userRes.json();
      const isAdmin = userDoc?.role === 'admin' || userDoc?.email === 'nipaagent@gmail.com';
      
      if (!isAdmin) {
        return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
      }
    } catch (e) {
      return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
    }

    const keysInfo = await getApiKeysInfo();
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(rtdb('stats/api_keys', bearerToken));
    const statsData = (await response.json()) || {};
    
    const detailedKeys = keysInfo.map(info => {
      const keyHash = Buffer.from(info.value).toString('hex').slice(0, 16);
      const stats = statsData[keyHash] || {};
      const isHealthy = isKeyHealthy(info.value);
      const inMemHealth = keyHealthTracker.get(info.value);
      
      let computedStatus = isHealthy ? 'Active (Healthy)' : 'Cooldown / Error';
      if (!isHealthy && inMemHealth?.cooldownUntil) {
        const remainingSec = Math.ceil((inMemHealth.cooldownUntil - Date.now()) / 1000);
        computedStatus = `Disabled/Cooldown (${remainingSec}s)`;
      }

      return {
        name: info.name,
        maskedValue: stats.info?.maskedValue || `${info.value.slice(0, 6)}...${info.value.slice(-4)}`,
        totalCalls: stats.total_calls || 0,
        todayCalls: (stats.daily && stats.daily[today]) || 0,
        successCalls: stats.success_calls || 0,
        errorCalls: stats.error_calls || 0,
        totalTokens: stats.total_tokens || 0,
        status: computedStatus,
        isHealthy: isHealthy,
        lastStatusCode: inMemHealth?.lastError ? 500 : (stats.info?.lastStatusCode || 200),
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

// Admin Settings Update
app.post(["/api/admin/settings", "/admin/settings"], async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) return res.status(401).json({ error: "Unauthorized" });

    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) return res.status(401).json({ error: "Unauthorized" });

    // Verify admin
    const userRes = await fetch(rtdb(`users/${tokenUid}`, bearerToken));
    if (!userRes.ok) return res.status(401).json({ error: "Unauthorized" });
    const userDoc = await userRes.json();
    const isAdmin = userDoc?.role === 'admin' || userDoc?.email === 'nipaagent@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

    const { path, data } = req.body;
    if (!path) return res.status(400).json({ error: "Path is required" });

    // Perform the update on behalf of the admin
    const updateRes = await fetch(rtdb(path, bearerToken), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (updateRes.ok) {
      return res.json({ status: "success" });
    } else {
      const err = await updateRes.text();
      return res.status(updateRes.status).json({ error: err });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Health check
app.get(["/api/v1/health", "/health", "/api/health"], (req, res) => {
  res.json({ status: "ok", service: "NIPA AI API", version: "1.0.0" });
});

// SP WALLET BD - Virtual Card Payment Gateway Credentials
const SP_GATEWAY_CONFIG = {
  appName: "NIPA",
  appId: process.env.SP_APP_ID || "CARD_GW_nipa_MUGCHQM0",
  paymentChannel: "ONLY VIRTUAL CARD (16-Digit Card Debit)",
  merchantSettlementWallet: process.env.SP_MERCHANT_WALLET || "0199999999",
  publicClientApiKey: process.env.SP_PUBLIC_API_KEY || "sp_card_pub_velora_r1usqx",
  secretServerApiKey: process.env.SP_SECRET_API_KEY || "",
  gatewayBaseUrl: "https://www.spwalletbd.com",
  cardCheckoutApi: "https://www.spwalletbd.com/api/checkout/card-pay",
  exchangeRateBdtPerSp: 7.77
};

// Helper to safely extract string error message from any gateway response
const extractErrorMessage = (data: any, defaultMsg: string = "পেমেন্ট প্রসেসিং ব্যর্থ হয়েছে"): string => {
  if (!data) return defaultMsg;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.msg === 'string') return data.msg;
  if (typeof data.error === 'object' && data.error !== null) {
    if (typeof data.error.message === 'string') return data.error.message;
    if (typeof data.error.error === 'string') return data.error.error;
    if (typeof data.error.msg === 'string') return data.error.msg;
    return JSON.stringify(data.error);
  }
  if (typeof data.errorMessage === 'string') return data.errorMessage;
  return defaultMsg;
};


// SP Wallet BD Virtual Card Checkout API - STRICT REAL-TIME DEBIT
app.post(["/api/payment/sp-card-checkout", "/api/checkout/card-pay"], async (req, res) => {
  try {
    if (!SP_GATEWAY_CONFIG.secretServerApiKey) {
      return res.status(500).json({
        success: false,
        error: "পেমেন্ট গেটওয়ে কনফিগার করা নেই।"
      });
    }

    // Require bearer token; uid = token uid
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ success: false, error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ success: false, error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    const {
      userId,
      packageId,
      packageName,
      packageType,
      amount,
      priceBdt,
      priceSp,
      cardNumber,
      cardHolder,
      cardPin
    } = req.body;

    // If body userId is present and differs from token uid -> 403
    if (userId && userId !== tokenUid) {
      return res.status(403).json({
        success: false,
        error: "অননুমোদিত অ্যাক্সেস। আপনার ইউজার আইডি সঠিক নয়।"
      });
    }

    const effectiveUid = tokenUid;

    // BEFORE calling the SP gateway, verify the token by reading users/{uid} from RTDB with ?auth=
    let userDoc: any = null;
    try {
      const userRes = await fetch(rtdb(`users/${effectiveUid}`, bearerToken));
      if (!userRes.ok) {
        return res.status(401).json({ success: false, error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
      }
      userDoc = await userRes.json();
    } catch (e) {
      return res.status(401).json({ success: false, error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    if (!userDoc || typeof userDoc !== 'object') {
      return res.status(401).json({ success: false, error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    const cleanCard = (cardNumber || "").replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cleanCard)) {
      return res.status(400).json({ 
        success: false, 
        error: "ভুল ভার্চুয়াল কার্ড নাম্বার! কার্ড নাম্বারটি অবশ্যই ১৬ ডিজিটের সঠিক নাম্বার হতে হবে।" 
      });
    }

    const cleanPin = (cardPin || "").trim();
    if (!cleanPin || !/^\d{2,6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        error: "সঠিক ভার্চুয়াল কার্ড পিন (২, ৩ বা ৪ ডিজিট) প্রদান করুন।"
      });
    }

    const numPriceBdt = Number(priceBdt) || 0;
    const numPriceSp = Number(priceSp) || parseFloat((numPriceBdt / SP_GATEWAY_CONFIG.exchangeRateBdtPerSp).toFixed(2));
    const orderId = `NIPA_SP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const maskedCard = `${cleanCard.slice(0, 4)} **** **** ${cleanCard.slice(-4)}`;

    const spPayload = {
      app_name: SP_GATEWAY_CONFIG.appName,
      app_id: SP_GATEWAY_CONFIG.appId,
      merchant_settlement_wallet: SP_GATEWAY_CONFIG.merchantSettlementWallet,
      merchant_wallet: SP_GATEWAY_CONFIG.merchantSettlementWallet,
      secret_server_api_key: SP_GATEWAY_CONFIG.secretServerApiKey,
      secret_api_key: SP_GATEWAY_CONFIG.secretServerApiKey,
      secret_key: SP_GATEWAY_CONFIG.secretServerApiKey,
      public_client_api_key: SP_GATEWAY_CONFIG.publicClientApiKey,
      public_api_key: SP_GATEWAY_CONFIG.publicClientApiKey,
      public_key: SP_GATEWAY_CONFIG.publicClientApiKey,
      payment_channel: "ONLY VIRTUAL CARD (16-Digit Card Debit)",
      gateway_channel: "VIRTUAL_CARD_16_DIGIT",
      card_number: cleanCard,
      cardNumber: cleanCard,
      card_pin: cleanPin,
      pin: cleanPin,
      card_holder: cardHolder || "Cardholder",
      amount_bdt: numPriceBdt,
      amount_sp: numPriceSp,
      amount: numPriceBdt,
      exchange_rate: SP_GATEWAY_CONFIG.exchangeRateBdtPerSp,
      currency: "BDT",
      order_id: orderId,
      orderId: orderId,
      customer_uid: effectiveUid,
      customer_id: effectiveUid,
      package_id: packageId,
      package_name: packageName,
      package_type: packageType
    };

    console.log(`[SP WALLET BD] Sending Real-Time Virtual Card Debit request to: ${SP_GATEWAY_CONFIG.cardCheckoutApi}`, {
      app_id: SP_GATEWAY_CONFIG.appId,
      order_id: orderId,
      card_masked: maskedCard,
      amount_bdt: numPriceBdt,
      amount_sp: numPriceSp
    });

    let gatewayResult: any = null;
    let isGatewaySuccess = false;
    let gatewayErrorMessage = "";

    // Primary attempt: Clean minimal standard format
    try {
      const spResponse = await fetch(SP_GATEWAY_CONFIG.cardCheckoutApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-api-key": SP_GATEWAY_CONFIG.secretServerApiKey,
          "x-app-id": SP_GATEWAY_CONFIG.appId
        },
        body: JSON.stringify({
          app_id: SP_GATEWAY_CONFIG.appId,
          secret_key: SP_GATEWAY_CONFIG.secretServerApiKey,
          public_key: SP_GATEWAY_CONFIG.publicClientApiKey,
          merchant_wallet: SP_GATEWAY_CONFIG.merchantSettlementWallet,
          card_number: cleanCard,
          card_pin: cleanPin,
          pin: cleanPin,
          amount: numPriceBdt,
          amount_bdt: numPriceBdt,
          amount_sp: numPriceSp,
          currency: "BDT",
          order_id: orderId,
          customer_uid: effectiveUid
        }),
        signal: AbortSignal.timeout(10000)
      });

      const responseText = await spResponse.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (parseErr) {
        parsedJson = { raw: responseText };
      }

      if (spResponse.ok) {
        if (
          parsedJson.success === true ||
          parsedJson.status === "SUCCESS" ||
          parsedJson.status === "COMPLETED" ||
          parsedJson.status === 200 ||
          parsedJson.code === "200" ||
          parsedJson.code === 200
        ) {
          isGatewaySuccess = true;
          gatewayResult = parsedJson;
        } else {
          isGatewaySuccess = false;
          gatewayErrorMessage = "পেমেন্ট গেটওয়ে চার্জ প্রত্যাখ্যান করেছে। কোনো টাকা কাটা হয়নি।";
        }
      } else {
        isGatewaySuccess = false;
        gatewayErrorMessage = "পেমেন্ট গেটওয়ে চার্জ প্রত্যাখ্যান করেছে। কোনো টাকা কাটা হয়নি।";
      }
    } catch (networkError: any) {
      isGatewaySuccess = false;
      gatewayErrorMessage = "পেমেন্ট গেটওয়ের সাথে সংযোগ করা যায়নি। কোনো টাকা কাটা হয়নি, অনুগ্রহ করে আবার চেষ্টা করুন।";
    }

    if (!isGatewaySuccess) {
      return res.status(400).json({
        success: false,
        error: String(gatewayErrorMessage || "পেমেন্ট গেটওয়ে চার্জ প্রত্যাখ্যান করেছে। কোনো টাকা কাটা হয়নি।")
      });
    }

    const trxId = gatewayResult?.trx_id || gatewayResult?.transaction_id || gatewayResult?.trxId || `TXN_SP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Update User Balance / VIP in Firebase Realtime Database with ?auth=
    let updatedUser: any = {};
    try {
      const updates: any = {};

      if (packageType === 'vip') {
        const vipDays = Number(amount) || 30;
        const isLifetime = vipDays >= 36500;
        let newVipExp: number;
        if (isLifetime) {
          newVipExp = 2000000000000;
        } else {
          const currentExp = userDoc.vipExpiresAt || 0;
          const baseTime = currentExp > Date.now() ? currentExp : Date.now();
          newVipExp = baseTime + (vipDays * 24 * 60 * 60 * 1000);
        }
        updates[`users/${effectiveUid}/vipExpiresAt`] = newVipExp;
        updates[`users/${effectiveUid}/isVip`] = true;
        updatedUser.isVip = true;
        updatedUser.vipExpiresAt = newVipExp;
      } else if (packageType === 'tokens') {
        const addedTokens = Number(amount) || 100000;
        const currentBonus = userDoc.tokenState?.bonusTokens || 0;
        const newBonus = currentBonus + addedTokens;
        updates[`users/${effectiveUid}/tokenState/bonusTokens`] = newBonus;
        updatedUser.bonusTokens = newBonus;
      }

      // Record Transaction in Ledger
      const transactionRecord = {
        id: trxId,
        trxId: trxId,
        orderId: orderId,
        userId: effectiveUid,
        username: userDoc.username || userDoc.fullName || 'User',
        userEmail: userDoc.email || `${userDoc.username || 'user'}@nipa.app`,
        packageId: packageId,
        packageName: packageName || (packageType === 'vip' ? `${amount} Days VIP` : `${amount} Tokens`),
        type: packageType,
        amount: Number(amount),
        priceBdt: numPriceBdt,
        priceSp: numPriceSp,
        cardNumberMasked: maskedCard,
        status: 'completed',
        gateway: 'SP_WALLET_BD_VIRTUAL_CARD',
        timestamp: Date.now(),
        gatewayResponse: gatewayResult
      };

      updates[`payment_transactions/${trxId}`] = transactionRecord;
      updates[`users/${effectiveUid}/transactions/${trxId}`] = transactionRecord;

      await fetch(rtdb('', bearerToken), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

    } catch (dbErr: any) {
      console.error("Firebase update error on confirmed debit:", dbErr);
    }

    return res.status(200).json({
      success: true,
      status: "COMPLETED",
      trxId: trxId,
      orderId: orderId,
      message: "🎉 SP ভার্চুয়াল কার্ড থেকে সফলভাবে টাকা ডেবিট হয়েছে এবং আপনার একাউন্টে সুবিধা যোগ করা হয়েছে!",
      cardNumberMasked: maskedCard,
      priceBdt: numPriceBdt,
      priceSp: numPriceSp,
      packageType: packageType,
      amount: Number(amount),
      timestamp: Date.now(),
      gatewayResponse: gatewayResult,
      updatedUser
    });

  } catch (error: any) {
    console.error("Payment exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "পেমেন্ট প্রসেসিং ব্যর্থ হয়েছে।"
    });
  }
});

// Admin / User Payment Transactions API
app.get(["/api/admin/payments", "/api/payment/transactions"], async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    // Read role via RTDB with ?auth=
    try {
      const roleRes = await fetch(rtdb(`users/${tokenUid}/role`, bearerToken));
      if (!roleRes.ok) {
        return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
      }
      const role = await roleRes.json();
      if (role !== 'admin') {
        return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
      }
    } catch (e) {
      return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
    }

    const response = await fetch(rtdb('payment_transactions', bearerToken));
    const data = (await response.json()) || {};
    const txList = Object.values(data).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json({
      status: "success",
      gateway: "SP_WALLET_BD_VIRTUAL_CARD",
      totalTransactions: txList.length,
      transactions: txList
    });
  } catch (err: any) {
    res.json({ status: "success", transactions: [] });
  }
});

// Web Push API Endpoints (VAPID)
// 1. POST /api/push/subscribe — Firebase auth required. Save subscription to push_subscriptions/{uid}. Return 200 {ok: true}.
app.post("/api/push/subscribe", async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }
    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    const subscription = req.body?.subscription || req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription payload" });
    }

    // Save subscription JSON to Firebase RTDB at push_subscriptions/{uid}
    await fetch(rtdb(`push_subscriptions/${tokenUid}`, bearerToken), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...subscription,
        updatedAt: Date.now()
      })
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Push subscribe error:", err);
    return res.status(500).json({ error: err?.message || "Failed to subscribe" });
  }
});

// 2. POST /api/push/unsubscribe — Firebase auth required. Remove push_subscriptions/{uid}. Return 200 {ok: true}.
app.post("/api/push/unsubscribe", async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }
    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    // Remove push_subscriptions/{uid}
    await fetch(rtdb(`push_subscriptions/${tokenUid}`, bearerToken), {
      method: "DELETE"
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Push unsubscribe error:", err);
    return res.status(500).json({ error: err?.message || "Failed to unsubscribe" });
  }
});

// 3. POST /api/admin/push/broadcast — admin role required. Broadcast to all push_subscriptions. Return {sent, failed}.
app.post("/api/admin/push/broadcast", async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }
    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    // Verify admin role
    const roleRes = await fetch(rtdb(`users/${tokenUid}/role`, bearerToken));
    if (!roleRes.ok) {
      return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
    }
    const role = await roleRes.json();
    if (role !== "admin") {
      return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
    }

    const { title, body, url } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ error: "শিরোনাম এবং বার্তা আবশ্যক।" });
    }

    // Configure web-push with VAPID env
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || "mailto:support@nipa.app",
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
      } catch (vapidErr) {
        console.warn("VAPID config error:", vapidErr);
      }
    } else {
      return res.status(500).json({ error: "সার্ভারে VAPID কী কনফিগার করা নেই।" });
    }

    // Read ALL push_subscriptions from RTDB
    const subsRes = await fetch(rtdb("push_subscriptions", bearerToken));
    const subsData = await subsRes.json();

    if (!subsData || typeof subsData !== "object") {
      return res.status(200).json({ sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;
    const payload = JSON.stringify({
      title,
      body,
      url: url || "/"
    });

    const entries = Object.entries(subsData);
    await Promise.all(
      entries.map(async ([subUid, sub]: [string, any]) => {
        if (!sub || !sub.endpoint) return;
        try {
          await webpush.sendNotification(sub, payload);
          sent++;
        } catch (err: any) {
          failed++;
          // Delete subscriptions that return 404 or 410 (expired)
          if (err.statusCode === 404 || err.statusCode === 410) {
            await fetch(rtdb(`push_subscriptions/${subUid}`, bearerToken), {
              method: "DELETE"
            }).catch(() => {});
          }
        }
      })
    );

    return res.status(200).json({ sent, failed });
  } catch (err: any) {
    console.error("Push broadcast error:", err);
    return res.status(500).json({ error: err?.message || "ব্রডকাস্ট পাঠাতে সমস্যা হয়েছে।" });
  }
});

// 4. POST /api/admin/push/send — admin role required. Body: {uid, title, body, url?}. Send push to that user only.
app.post("/api/admin/push/send", async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }
    const tokenUid = getUidFromToken(bearerToken);
    if (!tokenUid) {
      return res.status(401).json({ error: "লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।" });
    }

    // Verify admin role
    const roleRes = await fetch(rtdb(`users/${tokenUid}/role`, bearerToken));
    if (!roleRes.ok) {
      return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
    }
    const role = await roleRes.json();
    if (role !== "admin") {
      return res.status(403).json({ error: "অ্যাডমিন অনুমতি প্রয়োজন।" });
    }

    const { uid, title, body, url } = req.body || {};
    if (!uid || !title || !body) {
      return res.status(400).json({ error: "ইউজার আইডি, শিরোনাম এবং বার্তা আবশ্যক।" });
    }

    // Configure web-push with VAPID env
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || "mailto:support@nipa.app",
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
      } catch (vapidErr) {
        console.warn("VAPID config error:", vapidErr);
      }
    } else {
      return res.status(500).json({ error: "সার্ভারে VAPID কী কনফিগার করা নেই।" });
    }

    // Read that user's subscription
    const subRes = await fetch(rtdb(`push_subscriptions/${uid}`, bearerToken));
    if (!subRes.ok) {
      return res.status(200).json({ sent: 0, failed: 1, message: "Subscription not found" });
    }
    const sub = await subRes.json();
    if (!sub || !sub.endpoint) {
      return res.status(200).json({ sent: 0, failed: 1, message: "Subscription not found" });
    }

    try {
      await webpush.sendNotification(sub, JSON.stringify({
        title,
        body,
        url: url || "/"
      }));
      return res.status(200).json({ sent: 1, failed: 0 });
    } catch (pushErr: any) {
      if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
        await fetch(rtdb(`push_subscriptions/${uid}`, bearerToken), {
          method: "DELETE"
        }).catch(() => {});
      }
      return res.status(200).json({ sent: 0, failed: 1, error: pushErr?.message });
    }
  } catch (err: any) {
    console.error("Push send error:", err);
    return res.status(500).json({ error: err?.message || "পুশ নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।" });
  }
});

// Exported helper: sendPushToUser(uid, title, body, url?)
// Reads push_subscriptions/{uid} from RTDB and calls webpush.sendNotification in try/catch (NEVER throws).
export const sendPushToUser = async (uid: string, title: string, body: string, url: string = "/") => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:support@nipa.app",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } catch (e) {}

    const res = await fetch(`${FIREBASE_DB_URL}/push_subscriptions/${uid}.json`);
    if (!res.ok) return;
    const sub = await res.json();
    if (!sub || !sub.endpoint) return;

    await webpush.sendNotification(sub, JSON.stringify({
      title,
      body,
      url: url || "/"
    }));
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await fetch(`${FIREBASE_DB_URL}/push_subscriptions/${uid}.json`, {
        method: "DELETE"
      }).catch(() => {});
    }
    // NEVER throws
  }
};

// Helper: broadcastPushToAll(title, body, url?)
export const broadcastPushToAll = async (title: string, body: string, url: string = "/") => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:support@nipa.app",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } catch (e) {}

    const subsRes = await fetch(`${FIREBASE_DB_URL}/push_subscriptions.json`);
    if (!subsRes.ok) return;
    const subsData = await subsRes.json();
    if (!subsData || typeof subsData !== "object") return;

    const payload = JSON.stringify({ title, body, url: url || "/" });
    await Promise.all(
      Object.entries(subsData).map(async ([subUid, sub]: [string, any]) => {
        if (!sub || !sub.endpoint) return;
        try {
          await webpush.sendNotification(sub, payload);
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await fetch(`${FIREBASE_DB_URL}/push_subscriptions/${subUid}.json`, {
              method: "DELETE"
            }).catch(() => {});
          }
        }
      })
    );
  } catch (err) {
    // NEVER throws
  }
};

// Helper: notifyAllAdmins(title, body, url?)
export const notifyAllAdmins = async (title: string, body: string, url: string = "/") => {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/users.json`);
    if (!res.ok) return;
    const users = await res.json();
    if (!users || typeof users !== "object") return;

    const adminUids: string[] = [];
    for (const [adminUid, u] of Object.entries(users)) {
      if ((u as any)?.role === "admin") {
        adminUids.push(adminUid);
      }
    }

    await Promise.all(
      adminUids.map(adminUid => sendPushToUser(adminUid, title, body, url))
    );
  } catch (err) {
    // NEVER throws
  }
};

// EVENT 1: Daily token reset notification
app.post("/api/notifications/daily-reset", async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    const tokenUid = getUidFromToken(bearerToken || "");
    if (tokenUid) {
      await sendPushToUser(tokenUid, "ডেইলি টোকেন রিসেট হয়েছে!", "আপনার দৈনিক ফ্রি টোকেন কোটা রিসেট হয়েছে। এখনই চ্যাট শুরু করুন!", "/");
    }
  } catch (e) {}
  return res.json({ ok: true });
});

// EVENT 2: New ad published (ad_links): broadcast to ALL subscribed users
app.post(["/api/admin/ads/publish", "/api/admin/ad-links/broadcast"], async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    const tokenUid = getUidFromToken(bearerToken || "");
    if (!tokenUid) return res.status(401).json({ error: "লগইন প্রয়োজন।" });

    const { title, body, adTitle, adUrl } = req.body || {};
    const adInfo = body || adTitle || adUrl || "একটি নতুন অফার প্রকাশিত হয়েছে! টোকেন জিতে নিন।";

    await broadcastPushToAll("নতুন অফার এসেছে!", adInfo, adUrl || "/");
    return res.json({ success: true, message: "অফার সফলভাবে ব্রডকাস্ট করা হয়েছে।" });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "বিজ্ঞাপন ব্রডকাস্ট ব্যর্থ হয়েছে।" });
  }
});

// EVENT 3: VIP granted by admin
app.post("/api/admin/vip/grant", async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    const tokenUid = getUidFromToken(bearerToken || "");
    if (!tokenUid) return res.status(401).json({ error: "লগইন প্রয়োজন।" });

    const { targetUid, days, body } = req.body || {};
    if (targetUid) {
      const msg = body || (days === "lifetime" ? "আপনার অ্যাকাউন্টে লাইফটাইম VIP সুবিধা চালু হয়েছে!" : `আপনার অ্যাকাউন্টে ${days || 30} দিনের VIP চালু হয়েছে!`);
      await sendPushToUser(targetUid, "VIP চালু হয়েছে!", msg, "/");
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// EVENT 4: User submits bKash payment request: notify ALL admins
app.post(["/api/bkash/notify-admins", "/api/payment/bkash-notify"], async (req, res) => {
  try {
    const { username, packageName, priceBdt, trxId } = req.body || {};
    const msg = username 
      ? `@${username} ${packageName || 'প্যাকেজের'} জন্য ৳${priceBdt || ''} রিকোয়েস্ট পাঠিয়েছেন (TrxID: ${trxId || ''})`
      : "একজন ইউজার নতুন bKash পেমেন্ট রিকোয়েস্ট সাবমিট করেছেন।";
    await notifyAllAdmins("নতুন পেমেন্ট রিকোয়েস্ট!", msg, "/admin");
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// TASK 3: GET /api/cron/dormant-nudge protected by CRON_SECRET
app.get("/api/cron/dormant-nudge", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerSecret = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const providedSecret = (req.query.secret as string) || bearerSecret;
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing CRON_SECRET" });
    }

    const usersRes = await fetch(`${FIREBASE_DB_URL}/users.json`);
    if (!usersRes.ok) {
      return res.status(500).json({ error: "Failed to read users from RTDB" });
    }
    const usersData = await usersRes.json();
    if (!usersData || typeof usersData !== "object") {
      return res.status(200).json({ nudged: 0 });
    }

    const now = Date.now();
    const threshold = now - (6 * 3600 * 1000); // 6 hours

    // Filter users: lastActive < threshold AND (lastNudgeSent missing OR lastNudgeSent < lastActive). Cap 100 users.
    const eligibleEntries = Object.entries(usersData).filter(([_, u]: [string, any]) => {
      if (!u || typeof u !== "object") return false;
      const lastActive = typeof u.lastActive === "number" ? u.lastActive : 0;
      if (lastActive === 0 || lastActive >= threshold) return false;
      const lastNudgeSent = typeof u.lastNudgeSent === "number" ? u.lastNudgeSent : 0;
      return !lastNudgeSent || lastNudgeSent < lastActive;
    }).slice(0, 100);

    let nudged = 0;
    await Promise.all(
      eligibleEntries.map(async ([uid, u]: [string, any]) => {
        try {
          const subRes = await fetch(`${FIREBASE_DB_URL}/push_subscriptions/${uid}.json`);
          if (!subRes.ok) return;
          const sub = await subRes.json();
          if (!sub || !sub.endpoint) return;

          await webpush.sendNotification(sub, JSON.stringify({
            title: "আমাকে ভুলে গেলেন কি? 😊",
            body: "NIPA আপনাকে মিস করছে! ফিরে আসুন।",
            url: "/"
          }));

          // Mark lastNudgeSent = now
          await fetch(`${FIREBASE_DB_URL}/users/${uid}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lastNudgeSent: now })
          }).catch(() => {});

          nudged++;
        } catch (subErr: any) {
          if (subErr?.statusCode === 404 || subErr?.statusCode === 410) {
            await fetch(`${FIREBASE_DB_URL}/push_subscriptions/${uid}.json`, {
              method: "DELETE"
            }).catch(() => {});
          }
        }
      })
    );

    return res.status(200).json({ nudged });
  } catch (err: any) {
    console.error("Dormant nudge cron error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error", nudged: 0 });
  }
});


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express error:", err);
  res.status(200).json({ status: "error", error: err?.message || "Internal server error" });
});

export default app;
