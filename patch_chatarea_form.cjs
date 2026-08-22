const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

const targetFormStart = `          <form 
            onSubmit={handleSubmit}`;
const replacementFormStart = `          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-1">
              {attachments.map((att) => (
                <div key={att.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-500">
                      <FileText className="w-6 h-6 mb-1" />
                      <span className="text-[8px] sm:text-[10px] text-center line-clamp-1 truncate w-full">{att.name}</span>
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form 
            onSubmit={handleSubmit}`;
code = code.replace(targetFormStart, replacementFormStart);

const targetTextarea = `            <textarea
              value={input}`;
const replacementTextarea = `            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 outline-none"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}`;
code = code.replace(targetTextarea, replacementTextarea);

const targetDisabled = `              disabled={(!input.trim() && attachments.length === 0) || isLoading}`;
const targetOldDisabled = `              disabled={!input.trim() || isLoading}`;

const replacementDisabled = `              disabled={(!input.trim() && attachments.length === 0) || isLoading}`;

if (code.includes(targetOldDisabled)) {
    code = code.replace(targetOldDisabled, replacementDisabled);
    code = code.replace(targetOldDisabled, replacementDisabled); // run twice just in case
}

const targetButtonCondition = `                input.trim() && !isLoading `;
const replacementButtonCondition = `                (input.trim() || attachments.length > 0) && !isLoading `;
code = code.replace(targetButtonCondition, replacementButtonCondition);

const targetStyleCondition = `              style={isVipActive && input.trim() && !isLoading ? { `;
const replacementStyleCondition = `              style={isVipActive && (input.trim() || attachments.length > 0) && !isLoading ? { `;
code = code.replace(targetStyleCondition, replacementStyleCondition);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Successfully patched ChatArea.tsx form");
