import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Code2, Key, Copy, CheckCircle2, ShieldAlert, Terminal, Zap, ShieldCheck, Play, RefreshCw, AlertTriangle, AlertCircle, Loader2, Send } from 'lucide-react';
import { UserProfile } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { ref, update, onValue } from 'firebase/database';
import { cn } from '../lib/utils';

interface DeveloperPageProps {
  userProfile: UserProfile;
  user: FirebaseUser;
  onBackToChat: () => void;
}

export default function DeveloperPage({ userProfile, user, onBackToChat }: DeveloperPageProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [apiAccessEnabled, setApiAccessEnabled] = useState(!!userProfile.apiAccessEnabled);
  const [apiKey, setApiKey] = useState(userProfile.apiKey || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, type: 'success'|'error'} | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  // Playground state
  const [testMessage, setTestMessage] = useState('Hello, who are you?');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // Real-time listener for user profile developer settings
  useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    const unsub = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setApiAccessEnabled(!!data.apiAccessEnabled);
        setApiKey(data.apiKey || '');
      }
    });
    return () => unsub();
  }, [user]);

  const showToast = (title: string, type: 'success'|'error' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, type: 'key' | 'curl' | 'js' | 'endpoint') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'js') {
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2000);
    } else if (type === 'endpoint') {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
    showToast("Copied to clipboard!");
  };

  const generateNewKey = async () => {
    if (!window.confirm("Are you sure you want to generate a new API key? The old key will immediately stop working.")) return;
    
    setIsGenerating(true);
    try {
      const newKey = `vl_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      await update(ref(db, `users/${user.uid}`), {
        apiKey: newKey,
        keyCreatedAt: Date.now(),
        updatedAt: Date.now()
      });
      showToast("New API key generated successfully!");
    } catch (e: any) {
      showToast(e.message || "Failed to generate key", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestApi = async () => {
    if (!apiKey) {
      showToast("Please generate an API key first", "error");
      return;
    }
    
    setIsTesting(true);
    setTestResponse('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testMessage,
          stream: false
        })
      });
      
      const data = await res.json();
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  const curlSnippet = `curl -X POST ${baseUrl || 'https://your-domain.com'}/api/chat \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, who are you?",
    "stream": false
  }'`;

  const jsSnippet = `const response = await fetch('${baseUrl || 'https://your-domain.com'}/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey || 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Hello, who are you?",
    stream: false
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Header */}
      <header className="h-14 border-b border-indigo-100 bg-white px-2 sm:px-4 flex items-center shrink-0 shadow-sm relative z-10">
        <button 
          onClick={onBackToChat}
          className="p-2 -ml-1 sm:ml-0 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Developer Hub</h1>
            <p className="text-[10px] text-slate-500 font-medium">API Access & Integration</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Status Alert */}
          {!apiAccessEnabled ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-full shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">API Access Disabled</h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Your developer API access is currently disabled. Please contact the administrator to request API access. You cannot make external requests to the VELORA API without an active key.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="p-2 bg-emerald-100 rounded-full shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">API Access Enabled</h3>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Your developer account is active. You have full access to the VELORA REST API. Keep your API key secure and do not share it publicly.
                </p>
              </div>
            </div>
          )}

          {/* API Base Endpoint */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Base API Endpoint</h2>
                <p className="text-xs text-slate-500 mt-0.5">The root URL for all API requests</p>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50/50">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chat Endpoint URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 break-all select-all flex items-center justify-between">
                    {baseUrl ? `${baseUrl}/api/chat` : 'https://your-domain.com/api/chat'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(baseUrl ? `${baseUrl}/api/chat` : 'https://your-domain.com/api/chat', 'endpoint')}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shrink-0 shadow-sm"
                    title="Copy Endpoint URL"
                  >
                    {copiedEndpoint ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Authentication Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Authentication Key</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your secret key for API requests</p>
                </div>
              </div>
              {apiAccessEnabled && (
                <button
                  onClick={generateNewKey}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                  {apiKey ? 'Roll Key' : 'Generate Key'}
                </button>
              )}
            </div>
            
            <div className="p-5 bg-slate-50/50">
              {apiAccessEnabled ? (
                apiKey ? (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Secret API Key</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 break-all select-all flex items-center justify-between">
                        {apiKey}
                      </div>
                      <button
                        onClick={() => copyToClipboard(apiKey, 'key')}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shrink-0 shadow-sm"
                        title="Copy Key"
                      >
                        {copiedKey ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Never expose this key in client-side code (browsers, mobile apps). Keep it secure on your backend server.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">You don't have an API key yet</p>
                    <button
                      onClick={generateNewKey}
                      disabled={isGenerating}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                    >
                      <Key className="w-4 h-4" />
                      Generate API Key
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-6 opacity-60">
                  <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">Key hidden. API access is disabled.</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Start Integration */}
          <section className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-opacity", !apiAccessEnabled && "opacity-60 pointer-events-none")}>
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Terminal className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Quick Start</h2>
                <p className="text-xs text-slate-500 mt-0.5">Integrate VELORA AI into your app</p>
              </div>
            </div>
            
            <div className="p-5 bg-slate-900 text-slate-300 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">cURL Request</span>
                  <button
                    onClick={() => copyToClipboard(curlSnippet, 'curl')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedCurl ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCurl ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-black/40 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed text-indigo-200">
                    {curlSnippet}
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Node.js (Fetch)</span>
                  <button
                    onClick={() => copyToClipboard(jsSnippet, 'js')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedJs ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedJs ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-black/40 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed text-emerald-300">
                    {jsSnippet}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* API Tester Playground */}
          <section className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-opacity", !apiAccessEnabled && "opacity-60 pointer-events-none")}>
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">API Playground</h2>
                <p className="text-xs text-slate-500 mt-0.5">Test your API key and see the response</p>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Test Message</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter a message to test the API..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    onClick={handleTestApi}
                    disabled={isTesting || !apiKey}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                  >
                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Request
                  </button>
                </div>
              </div>

              {testResponse && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">JSON Response</span>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto relative">
                    <pre className="text-xs font-mono leading-relaxed text-blue-300">
                      {testResponse}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Endpoints Documentation */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
             <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">API Endpoints</h2>
                <p className="text-xs text-slate-500 mt-0.5">Available REST API resources</p>
              </div>
            </div>
            <div className="p-0">
              <div className="border-b border-slate-100 p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded uppercase tracking-wider">POST</span>
                  <code className="text-xs font-mono font-bold text-slate-700">/api/chat</code>
                </div>
                <p className="text-xs text-slate-600">Creates a model response for the given chat conversation. Supports non-streaming responses only via API key currently.</p>
              </div>
              <div className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase tracking-wider">GET</span>
                  <code className="text-xs font-mono font-bold text-slate-700">/api/models</code>
                </div>
                <p className="text-xs text-slate-600">Lists the currently available models, and provides basic information about each one such as the owner and availability.</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 pointer-events-none"
        >
          <div className={cn(
            "px-4 py-3 rounded-xl shadow-lg flex items-center gap-3",
            toastMessage.type === 'success' ? "bg-gray-900 text-white" : "bg-red-600 text-white"
          )}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            <span className="text-sm font-medium">{toastMessage.title}</span>
          </div>
        </motion.div>
      )}

    </div>
  );
}
