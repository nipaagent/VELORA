#!/bin/bash
sed -i '/<button/,/<\/button>/ {
  /<\/button>/!b
  /<\/button>/ {
    a\
              <\/div>\
              {isSignUp && password.length > 0 && (\
                <div className="flex items-center gap-1.5 mt-1.5 ml-1">\
                  <div className={`h-1.5 rounded-full flex-1 transition-all ${passStrength.color.replace("text-", "bg-")}`} />\
                  <span className={`text-[10px] font-bold ${passStrength.color}`}>{passStrength.label}<\/span>\
                <\/div>\
              )}
  }
}' src/components/AuthModal.tsx
