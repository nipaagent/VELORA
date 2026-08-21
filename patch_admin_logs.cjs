const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

// 1. Imports
code = code.replace(
  "import { ref, onValue, set, remove, update } from 'firebase/database';",
  "import { ref, onValue, set, remove, update, push, query, limitToLast } from 'firebase/database';"
);
code = code.replace(
  "LogOut, Link2",
  "LogOut, Link2, ScrollText, Activity, Terminal"
);

// 2. Interfaces
code = code.replace(
  "export interface AdminUser {",
  `export interface AdminLog {
  id: string;
  action: string;
  description: string;
  timestamp: number;
}

export interface AdminUser {`
);

// 3. activeTab type
code = code.replace(
  `const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'ads' | 'redeem' | 'apikeys'>('users');`,
  `const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'ads' | 'redeem' | 'apikeys' | 'logs'>('users');`
);

// 4. adminLogs state
code = code.replace(
  "const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);",
  `const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  // Logs state
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);`
);

// 5. logAdminAction
code = code.replace(
  /const showToast = \([\s\S]*?};\n/,
  `$&
  const logAdminAction = async (action: string, description: string) => {
    try {
      await push(ref(db, 'admin_logs'), {
        action,
        description,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Failed to log action:", e);
    }
  };
`
);

// 6. useEffect
code = code.replace(
  `const unsubscribeRedeem = onValue(redeemRef, (snapshot) => {`,
  `const logsRef = query(ref(db, 'admin_logs'), limitToLast(100));
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const logsList = Object.keys(val).map(key => ({
          id: key,
          ...val[key]
        }));
        logsList.sort((a, b) => b.timestamp - a.timestamp);
        setAdminLogs(logsList);
      } else {
        setAdminLogs([]);
      }
    });

    const unsubscribeRedeem = onValue(redeemRef, (snapshot) => {`
);

code = code.replace(
  /unsubscribeAd\(\);\s*unsubscribeConfig\(\);\s*unsubscribeRedeem\(\);/,
  `unsubscribeAd();
      unsubscribeConfig();
      unsubscribeRedeem();
      unsubscribeLogs();`
);

// 7. Inject logAdminAction
code = code.replace(
  /showToast\("গ্লোবাল টোকেন সেটিংস ১০০% সফলভাবে আপডেট করা হয়েছে\!"\);/,
  `showToast("গ্লোবাল টোকেন সেটিংস ১০০% সফলভাবে আপডেট করা হয়েছে!");
      logAdminAction('CONFIG_UPDATED', \`Global daily limit set to \${globalDailyLimitInput}, Ad reward to \${globalAdRewardInput}, Multiplier to \${globalTokenMultiplierInput}\`);`
);

code = code.replace(
  /showToast\(\`ইউজার \$\{isCurrentlyBanned \? 'আনব্যান' : 'ব্যান'\} করা হয়েছে\!\`\);/,
  `showToast(\`ইউজার \${isCurrentlyBanned ? 'আনব্যান' : 'ব্যান'} করা হয়েছে!\`);
      logAdminAction(isCurrentlyBanned ? 'USER_UNBANNED' : 'USER_BANNED', \`User @\${user.username} (\${user.fullName}) was \${isCurrentlyBanned ? 'unbanned' : 'banned'}\`);`
);

code = code.replace(
  /showToast\(\`Role changed to \$\{newRole\.toUpperCase\(\)\}\!\`\);/,
  `showToast(\`Role changed to \${newRole.toUpperCase()}!\`);
      logAdminAction('ROLE_CHANGED', \`User @\${user.username} role changed to \${newRole}\`);`
);

code = code.replace(
  /showToast\("ফায়ারবেস থেকে ইউজার ১০০% সফলভাবে ডিলিট করা হয়েছে\!"\);/,
  `showToast("ফায়ারবেস থেকে ইউজার ১০০% সফলভাবে ডিলিট করা হয়েছে!");
        logAdminAction('USER_DELETED', \`User @\${user.username} (\${user.fullName}) was deleted\`);`
);

code = code.replace(
  /showToast\("ফায়ারবেসে নতুন ইউজার ১০০% সফলভাবে তৈরি করা হয়েছে\!"\);/,
  `showToast("ফায়ারবেসে নতুন ইউজার ১০০% সফলভাবে তৈরি করা হয়েছে!");
      logAdminAction('USER_CREATED', \`User @\${cleanUsername} (\${newName.trim()}) was created\`);`
);

code = code.replace(
  /showToast\(\`\$\{amountToAdd\} টোকেন যোগ করা হয়েছে\!\`\);/,
  `showToast(\`\${amountToAdd} টোকেন যোগ করা হয়েছে!\`);
      logAdminAction('TOKEN_ADDED', \`Added \${amountToAdd} tokens to @\${tokenModalUser?.username}\`);`
);

code = code.replace(
  /showToast\("ইউজার তথ্য আপডেট করা হয়েছে।"\);/,
  `showToast("ইউজার তথ্য আপডেট করা হয়েছে।");
      logAdminAction('USER_UPDATED', \`Updated details for user @\${cleanUsername}\`);`
);

// 8. Add tab
code = code.replace(
  `{ id: 'apikeys', label: 'API Keys Status', icon: KeyRound, count: apiKeyCount, activeCls: 'bg-sky-500 text-white border-sky-600 shadow-md transform scale-105' }`,
  `{ id: 'apikeys', label: 'API Keys Status', icon: KeyRound, count: apiKeyCount, activeCls: 'bg-sky-500 text-white border-sky-600 shadow-md transform scale-105' },
              { id: 'logs', label: 'Activity Logs', icon: ScrollText, count: adminLogs.length, activeCls: 'bg-emerald-600 text-white border-emerald-700 shadow-md transform scale-105' }`
);

// 9. Add UI
const uiBlock = `
      {/* ACTIVITY LOGS TAB */}
      <AnimatePresence>
        {activeTab === 'logs' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <div className="bg-slate-900 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2 tracking-tight uppercase">
                      Admin Activity Logs
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Real-time tracker for administrative actions
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {adminLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Terminal className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No activity logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminLogs.map((log) => {
                      const logDate = new Date(log.timestamp);
                      const isRecent = Date.now() - log.timestamp < 3600000;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={log.id} 
                          className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            log.action.includes('BANNED') || log.action.includes('DELETED') ? "bg-red-100 text-red-600" :
                            log.action.includes('CREATED') || log.action.includes('ADDED') ? "bg-emerald-100 text-emerald-600" :
                            log.action.includes('UPDATED') || log.action.includes('CHANGED') ? "bg-sky-100 text-sky-600" :
                            "bg-slate-200 text-slate-600"
                          )}>
                            <Terminal className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                {log.action.replace(/_/g, ' ')}
                              </span>
                              <span className={cn(
                                "text-[10px] font-semibold",
                                isRecent ? "text-emerald-600 font-bold" : "text-slate-400"
                              )}>
                                {logDate.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {log.description}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AD LINKS & GLOBAL SETTINGS TAB */}`;

code = code.replace("{/* AD LINKS & GLOBAL SETTINGS TAB */}", uiBlock);

fs.writeFileSync('src/components/AdminPage.tsx', code);
