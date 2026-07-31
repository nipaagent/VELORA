import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, Eye, EyeOff, RotateCw, Shield, ShieldAlert, Code2, 
  Settings, Terminal, Send, ArrowLeft, Lock, KeyRound, Sparkles, ShieldCheck,
  Server, Globe, Radio, Activity, Cpu, Network, Layers, ExternalLink
} from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { UserProfile } from '../types';
import TypewriterMarkdown from './TypewriterMarkdown';
import { generateUniqueVeloraKey } from '../lib/utils';

interface DeveloperPageProps {
  userProfile: UserProfile | null;
  user: any;
  onBackToChat?: () => void;
}

export default function DeveloperPage({ userProfile, user, onBackToChat }: DeveloperPageProps) {
  const [liveProfile, setLiveProfile] = useState<UserProfile | null>(userProfile);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [createdDate, setCreatedDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Tab for Code Snippets
  const [codeTab, setCodeTab] = useState<'JS' | 'PYTHON' | 'CURL'>('JS');

  // Gateway specific states
  const [copiedGwBaseUrl, setCopiedGwBaseUrl] = useState(false);
  const [copiedGwCompletionsUrl, setCopiedGwCompletionsUrl] = useState(false);
  const [isTestingGw, setIsTestingGw] = useState(false);
  const [gwTestResult, setGwTestResult] = useState<{ success?: boolean; text?: string } | null>(null);
  const [gwSnippetTab, setGwSnippetTab] = useState<'OPENAI' | 'PYTHON' | 'CURL'>('OPENAI');

  // Test input & output
  const [testMessage, setTestMessage] = useState('Hello Velora!');
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://velora-ai.render.com';

  // Listen to Firebase Realtime DB for live updates on user's profile and apiAccessEnabled status
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLiveProfile(data);
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setApiKey('');
        }
        if (data.keyCreatedAt) {
          setCreatedDate(new Date(data.keyCreatedAt).toLocaleDateString('bn-BD'));
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleGenerateKey = async () => {
    if (!user?.uid) return;
    setIsGenerating(true);
    try {
      const newKey = generateUniqueVeloraKey();
      const today = new Date().toLocaleDateString('bn-BD');
      
      setApiKey(newKey);
      setCreatedDate(today);

      // Save to Firebase RTDB in real-time
      await update(ref(db, `users/${user.uid}`), {
        apiKey: newKey,
        keyCreatedAt: Date.now(),
        updatedAt: Date.now()
      });

      localStorage.setItem(`velora_api_key_${user.uid}`, newKey);
    } catch (err) {
      console.error("Failed to save API key to Firebase:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (window.confirm("Are you sure you want to REGENERATE a new API key? The old key will stop working immediately.")) {
      try {
        const newKey = generateUniqueVeloraKey();
        await update(ref(db, `users/${user.uid}`), {
          apiKey: newKey,
          keyCreatedAt: Date.now(),
          updatedAt: Date.now()
        });
        setApiKey(newKey);
        alert("New API key has been generated successfully.");
      } catch (err) {
        console.error("Failed to regenerate key:", err);
      }
    }
  };

  const handleRevoke = async () => {
    if (!user?.uid) return;
    if (window.confirm("Are you sure you want to REVOKE and DELETE this API key?")) {
      try {
        await update(ref(db, `users/${user.uid}`), {
          apiKey: '',
          keyCreatedAt: null,
          updatedAt: Date.now()
        });
        setApiKey('');
        localStorage.removeItem(`velora_api_key_${user.uid}`);
        alert("API key has been revoked and deleted.");
      } catch (err) {
        console.error("Failed to revoke key:", err);
      }
    }
  };

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleRunTest = async () => {
    if (!testMessage.trim() || !apiKey) return;
    setIsTesting(true);
    setTestResult('');
    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ message: testMessage })
      });
      const data = await res.json();
      if (data.text) {
        setTestResult(data.text);
      } else if (data.choices?.[0]?.message?.content) {
        setTestResult(data.choices[0].message.content);
      } else if (data.error) {
        setTestResult(`Error: ${data.error}`);
      } else {
        setTestResult(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setTestResult(`Network Error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const gwBaseUrl = `${domain}/api/v1`;
  const gwCompletionsUrl = `${domain}/api/v1/chat/completions`;

  const handleRunGwTest = async () => {
    if (!apiKey) return;
    setIsTestingGw(true);
    setGwTestResult(null);
    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          stream: false,
          messages: [{ role: 'user', content: 'Velora Cloud Gateway connection test.' }]
        })
      });
      const text = await res.text();
      
      if (!res.ok) {
        setGwTestResult({ success: false, text: `HTTP ${res.status}: ${text}` });
        return;
      }

      if (text.startsWith('data:') || text.includes('data:')) {
        const lines = text.split('\n').filter(l => l.startsWith('data:'));
        let combined = '';
        for (const line of lines) {
          const raw = line.replace(/^data:\s*/, '').trim();
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || parsed.choices?.[0]?.message?.content || '';
            combined += content;
          } catch (e) {
            // continue
          }
        }
        setGwTestResult({
          success: true,
          text: combined || 'Gateway active and streaming response received!'
        });
      } else {
        try {
          const data = JSON.parse(text);
          if (data.error) {
            setGwTestResult({ success: false, text: data.error });
          } else {
            setGwTestResult({
              success: true,
              text: data.choices?.[0]?.message?.content || data.text || 'Gateway active and connected!'
            });
          }
        } catch (e) {
          setGwTestResult({ success: true, text: text || 'Gateway active!' });
        }
      }
    } catch (err: any) {
      setGwTestResult({ success: false, text: `Connection error: ${err.message}` });
    } finally {
      setIsTestingGw(false);
    }
  };

  const gwCodeExamples = {
    OPENAI: `// Velora Cloud Gateway - OpenAI SDK / Third-party Client Integration
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: '${gwBaseUrl}',
  apiKey: '${apiKey || 'YOUR_VELORA_API_KEY'}'
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'velora-v2.7',
    messages: [
      { role: 'user', content: 'হ্যালো, Velora Cloud Gateway!' }
    ]
  });

  console.log(completion.choices[0].message.content);
}

main();`,

    PYTHON: `# Velora Cloud Gateway - Python Requests
import requests

url = "${gwCompletionsUrl}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey || 'YOUR_VELORA_API_KEY'}"
}
payload = {
    "messages": [
        {"role": "user", "content": "হ্যালো, Velora Cloud Gateway!"}
    ]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,

    CURL: `# Velora Cloud Gateway - cURL Call
curl -X POST "${gwCompletionsUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_VELORA_API_KEY'}" \\
  -d '{"messages": [{"role": "user", "content": "হ্যালো, Velora Cloud Gateway!"}]}'`
  };

  // Determine API Access status from live profile or role
  const isApiEnabled = liveProfile?.apiAccessEnabled === true || liveProfile?.role === 'admin' || liveProfile?.username === 'admin';

  const apiGetUrl = `${domain}/api/v1/chat?q=হ্যালো&key=${apiKey}`;

  const codeExamples = {
    JS: `// Velora API - Simple JS Fetch Request (POST)
const response = await fetch('${domain}/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}'
  },
  body: JSON.stringify({ message: 'আপনার প্রশ্ন এখানে লিখুন' })
});

const data = await response.json();
console.log(data.choices[0].message.content);`,

    PYTHON: `# Velora API - Python Requests
import requests

url = "${domain}/api/v1/chat"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
}
payload = {
    "message": "আপনার প্রশ্ন এখানে লিখুন"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print(data["choices"][0]["message"]["content"])`,

    CURL: `# Velora API - cURL Request
curl -X POST "${domain}/api/v1/chat" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"message": "আপনার প্রশ্ন এখানে লিখুন"}'`
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50/60 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Top Header Label & Back Button */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              সিস্টেম এপিআই ইন্টিগ্রেশন প্যানেল / API ACCESS
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2 mt-0.5">
              <Code2 className="w-5 h-5 text-indigo-600" />
              VELORA DEVELOPER OPTIONS
            </h2>
          </div>

          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-all shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>চ্যাটে ফিরুন</span>
            </button>
          )}
        </div>

        {/* CONDITION 1: API ACCESS IS DISABLED BY ADMIN (LOCKED STATE) */}
        {!isApiEnabled ? (
          <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-800 text-center space-y-6 my-6">
            
            {/* Background glowing effects */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Giant Lock Icon Container */}
            <div className="relative z-10 inline-flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-inner animate-pulse">
                <Lock className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2]" />
              </div>
            </div>

            {/* Status Pill */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 font-black text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>সিস্টেম লকড (System Off)</span>
              </span>
            </div>

            {/* Main Message - EXACT USER REQUIREMENT */}
            <div className="relative z-10 max-w-lg mx-auto space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                আপনার এপিআই কি জেনারেট সিস্টেম অফ আছে এডমিনের কাছে এনাবেল করে নেন
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                (API Generation is currently disabled for your account. Please contact the system administrator to enable it.)
              </p>
            </div>

            {/* Back Button */}
            {onBackToChat && (
              <div className="relative z-10 pt-2">
                <button
                  onClick={onBackToChat}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>চ্যাটে ফিরে যান</span>
                </button>
              </div>
            )}
          </div>
        ) : !apiKey ? (
          /* CONDITION 2: API ACCESS IS ENABLED BUT KEY NOT GENERATED YET */
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200/80 text-center space-y-6 my-4">
            
            <div className="inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                <KeyRound className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>এপিআই এক্সেস চালু আছে (API Enabled)</span>
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                আপনি এপিআই কি জেনারেট করুন
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনার অ্যাকাউন্টের জন্য অ্যাডমিন দ্বারা এপিআই অ্যাক্সেস অনুমোদন করা হয়েছে। সার্ভিস ব্যবহারের জন্য আপনার ইউনিক এপিআই কী তৈরি করতে নিচের বাটনে ক্লিক করুন।
              </p>
            </div>

            <div>
              <button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md hover:shadow-lg active:scale-98 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>কী জেনারেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>এপিআই কি জেনারেট করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* CONDITION 3: FULL DEVELOPER DASHBOARD */
          <>
            {/* CARD 1: API Keys */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-100/80 text-pink-600 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">API Keys</h3>
                </div>

                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  ACTIVE
                </span>
              </div>

              {/* API Key Box */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-800">
                <span className="truncate tracking-wider font-extrabold text-indigo-950">
                  {showKey ? apiKey : `${apiKey.slice(0, 6)}••••••••••••`}
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60"
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyText(apiKey, setCopiedKey)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60"
                    title="Copy key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {createdDate && (
                <div className="text-[10px] text-slate-400 font-medium px-0.5">
                  Created {createdDate}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                <button
                  onClick={handleRegenerate}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-black text-[11px] transition-colors shadow-2xs"
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>REGENERATE</span>
                </button>

                <button
                  onClick={handleRevoke}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50/50 text-pink-600 font-black text-[11px] transition-colors shadow-2xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-600" />
                  <span>REVOKE KEY</span>
                </button>
              </div>
            </div>

            {/* CARD 2: API Link */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <h3 className="font-bold text-sm text-slate-900">
                এপিআই লিংক (API Link)
              </h3>

              <div className="flex items-start justify-between bg-sky-50/70 border border-sky-100 rounded-xl p-3 font-mono text-[11px] text-sky-900 leading-relaxed">
                <span className="break-all whitespace-normal font-semibold text-left mr-2 flex-1">
                  {apiGetUrl}
                </span>
                <button
                  onClick={() => copyText(apiGetUrl, setCopiedUrl)}
                  className="p-1.5 text-sky-700 hover:text-sky-900 shrink-0 bg-white rounded-lg border border-sky-200/80 shadow-2xs mt-0.5"
                  title="Copy API Link"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* CARD 3: Test Input & Runner */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  এপিআই টেস্ট (API Tester)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Hello Velora!"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
                <button
                  onClick={handleRunTest}
                  disabled={isTesting || !testMessage.trim()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 flex items-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>রানিং...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>টেস্ট</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    রেসপন্স (Response Output):
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                    <TypewriterMarkdown text={testResult} isLatest={false} />
                  </div>
                </div>
              )}
            </div>

            {/* CARD 4: Code Examples & Tabs */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#181825] shadow-sm">
              <div className="bg-[#11111b] px-4 pt-2 pb-0 flex items-center justify-between border-b border-slate-800">
                <div className="flex gap-1.5">
                  {(['JS', 'PYTHON', 'CURL'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCodeTab(tab)}
                      className={`px-4 py-1.5 rounded-t-lg text-xs font-extrabold transition-all ${
                        codeTab === tab
                          ? 'bg-[#181825] text-white border-t-2 border-indigo-500'
                          : 'text-slate-400 hover:text-slate-200 bg-transparent'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => copyText(codeExamples[codeTab], setCopiedCode)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 overflow-x-auto text-slate-100 font-mono text-xs leading-relaxed">
                <pre className="whitespace-pre">
                  <code>{codeExamples[codeTab]}</code>
                </pre>
              </div>
            </div>

            {/* CARD 5: VELORA CLOUD GATEWAY (ক্লাউড গেটওয়ে এক্সটার্নাল এপিআই) */}
            <div className="p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-2xl border border-indigo-900/60 shadow-xl text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      VELORA CLOUD GATEWAY (ক্লাউড গেটওয়ে)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      অন্য অ্যাপ বা OpenAI Compatible ক্লায়েন্টে আপনার এই অ্যাপের AI ইন্টিগ্রেট করুন
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] tracking-wider uppercase self-start sm:self-auto">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>VELORA NATIVE ACTIVE</span>
                </span>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Model Platform</div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Velora Intelligence v2.7 <span className="text-[9px] bg-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-200">INTERNAL</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway Endpoints */}
              <div className="grid grid-cols-1 gap-3">
                {/* Model ID Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>1. Model Name (আপনার অ্যাপের "Model" ফিল্ডে এটি হুবহু লিখুন):</span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      CLAUDE-READY
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 border border-emerald-500/30 rounded-xl p-3 font-mono text-sm text-emerald-400 ring-1 ring-emerald-500/10 shadow-lg">
                    <span className="font-black tracking-wider">claude run</span>
                    <button
                      onClick={() => copyText('claude run', setCopiedCode)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'কপি হয়েছে' : 'মডেল আইডি কপি'}</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 px-1 italic">
                    * আপনার থার্ড-পার্টি ক্লায়েন্ট অ্যাপে "claude run" নামটি ব্যবহার করুন।
                  </p>
                </div>

                {/* Gateway Base URL */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>2. Gateway Base URL (OpenAI Client-এর "Base URL" ফিল্ডে দিন):</span>
                    <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      AUTO-DISCOVERY
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/90 border border-indigo-500/20 rounded-xl p-3 font-mono text-sm text-indigo-300 ring-1 ring-indigo-500/10 shadow-lg">
                    <span className="truncate mr-2 font-bold tracking-tight">{gwBaseUrl}</span>
                    <button
                      onClick={() => copyText(gwBaseUrl, setCopiedGwBaseUrl)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
                    >
                      {copiedGwBaseUrl ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedGwBaseUrl ? 'URL কপি' : 'URL কপি করুন'}</span>
                    </button>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-1">
                    <p className="text-[10px] text-amber-200 leading-tight">
                      <strong>সতর্কতা:</strong> কিছু অ্যাপ লিঙ্কের শেষে অটোমেটিক <code>/v1</code> যোগ করে। যদি আপনার অ্যাপে এরর দেখায়, তবে উপরের লিঙ্কের শেষ থেকে <code>/v1</code> টুকু মুছে দিয়ে শুধু <code>.../api</code> পর্যন্ত দিয়ে চেষ্টা করুন।
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Snippets for External Applications */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-300">
                  অন্য অ্যাপ থেকে কল করার কোড উদাহরণ (Integration Snippets):
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0f0f17]">
                  <div className="bg-[#161622] px-3 pt-2 pb-0 flex items-center justify-between border-b border-slate-800/80">
                    <div className="flex gap-1">
                      {(['OPENAI', 'PYTHON', 'CURL'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setGwSnippetTab(tab)}
                          className={`px-3 py-1 rounded-t-lg text-[11px] font-bold transition-all ${
                            gwSnippetTab === tab
                              ? 'bg-[#0f0f17] text-indigo-400 border-t-2 border-indigo-500'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => copyText(gwCodeExamples[gwSnippetTab], setCopiedCode)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy Snippet"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 overflow-x-auto text-slate-200 font-mono text-[11px] leading-relaxed max-h-48">
                    <pre className="whitespace-pre">
                      <code>{gwCodeExamples[gwSnippetTab]}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Gateway Test Button & Output */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    ক্লাউড গেটওয়ে এন্ডপয়েন্ট রেডি আছে কিনা পরীক্ষা করুন:
                  </span>

                  <button
                    onClick={handleRunGwTest}
                    disabled={isTestingGw || !apiKey}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {isTestingGw ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>টেস্ট হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5" />
                        <span>টেস্ট গেটওয়ে (Test Gateway)</span>
                      </>
                    )}
                  </button>
                </div>

                {gwTestResult && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    gwTestResult.success 
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' 
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                  }`}>
                    <div className="font-bold font-mono text-[11px] mb-0.5 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${gwTestResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{gwTestResult.success ? 'GATEWAY CONNECTED SUCCESS' : 'GATEWAY ERROR'}</span>
                    </div>
                    <div className="font-mono text-[11px] opacity-90">
                      {gwTestResult.text}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 6: Bottom Feature Cards */}
            <div className="grid grid-cols-2 gap-3 pt-1 pb-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">সিকিউর</div>
                  <div className="text-[10px] text-slate-500 font-medium">সার্ভার সাইড ব্যবহার</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">কাস্টম</div>
                  <div className="text-[10px] text-slate-500 font-medium">কোড পরিবর্তন</div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
