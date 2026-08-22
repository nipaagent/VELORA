const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

const targetMsg = `                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}`;

const replacementMsg = `                      ) : (
                        <div className="flex flex-col gap-2">
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {msg.attachments.map((att: any) => (
                                <div key={att.id} className="relative rounded-xl overflow-hidden border border-white/20 bg-white/10 w-24 h-24 flex-shrink-0">
                                  {att.type === 'image' ? (
                                    <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-white/80">
                                      <FileText className="w-6 h-6 mb-1" />
                                      <span className="text-[10px] text-center line-clamp-2 truncate w-full">{att.name}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                      )}`;

code = code.replace(targetMsg, replacementMsg);
fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Successfully patched ChatArea.tsx messages");
