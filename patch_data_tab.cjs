const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

const targetStr = `            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-blue-500" /> Data Management
            </h3>`;

const kbUI = `
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-blue-500" /> AI Knowledge Base & Memory
            </h3>
            
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">এআই মেমরি (AI Memory)</h4>
                <p className="text-xs text-gray-500 mb-3">এআই আপনার পূর্বের চ্যাট থেকে যেসব বিষয় মনে রেখেছে, সেগুলো এখানে দেখা যাবে।</p>
                {userProfile.userMemory ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-medium">
                    {userProfile.userMemory}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    কোনো ডাটা সেভ নেই।
                  </div>
                )}
                <button 
                  onClick={handleClearMemory}
                  disabled={!userProfile.userMemory}
                  className="mt-3 text-xs text-red-500 font-bold hover:text-red-600 disabled:opacity-50"
                >
                  ক্লিয়ার মেমরি
                </button>
              </div>
              
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-bold text-gray-900 mb-1">কাস্টম ডাটা ইনপুট</h4>
                <p className="text-xs text-gray-500 mb-4">এআইকে নতুন কোনো তথ্য বা ডাটা দিতে চাইলে নিচে লিখুন।</p>
                
                {kbSuccess && (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{kbSuccess}</span>
                  </div>
                )}
                {kbError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{kbError}</span>
                  </div>
                )}
                
                <div className="space-y-3 mb-5">
                  <input
                    type="text"
                    placeholder="ডাটার নাম (যেমন: My Website Info)"
                    value={kbTitle}
                    onChange={(e) => setKbTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  />
                  <textarea
                    placeholder="বিস্তারিত ডাটা এখানে পেস্ট করুন..."
                    value={kbContent}
                    onChange={(e) => setKbContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 custom-scrollbar resize-none"
                  />
                  <button
                    onClick={handleSaveKb}
                    disabled={isSavingKb}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSavingKb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    সেভ ডাটা
                  </button>
                </div>
                
                {userProfile.knowledgeBases && userProfile.knowledgeBases.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">সেভ করা ডাটা সমূহ</h4>
                    {userProfile.knowledgeBases.map((kb) => (
                      <div key={kb.id} className={\`p-3 rounded-xl border \${userProfile.activeKnowledgeBaseId === kb.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'} flex items-center justify-between gap-3\`}>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSetActiveKb(kb.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={\`w-2 h-2 rounded-full \${userProfile.activeKnowledgeBaseId === kb.id ? 'bg-blue-500' : 'bg-gray-300'}\`}></span>
                            <span className="text-sm font-bold text-gray-900">{kb.title}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 ml-4">{kb.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteKb(kb.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 hidden" />
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4 mt-8">
              <Database className="w-4 h-4 text-blue-500" /> Chat History Export / Import
            </h3>`;

code = code.replace(targetStr, kbUI);
fs.writeFileSync('src/components/SettingsPage.tsx', code);
