const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `                  let currentText = fullResponse;
                  let currentThinking = '';
                  
                  const thinkingStart = currentText.indexOf('<thinking>');
                  const thinkStart = currentText.indexOf('<think>');
                  
                  const startIdx = thinkingStart !== -1 ? thinkingStart : (thinkStart !== -1 ? thinkStart : -1);
                  
                  if (startIdx !== -1) {
                    const tagUsed = thinkingStart !== -1 ? '<thinking>' : '<think>';
                    const closeTag = thinkingStart !== -1 ? '</thinking>' : '</think>';
                    const endIdx = currentText.indexOf(closeTag);
                    
                    if (endIdx !== -1) {
                      currentThinking = currentText.substring(startIdx + tagUsed.length, endIdx);
                      currentText = currentText.substring(0, startIdx) + currentText.substring(endIdx + closeTag.length);
                    } else {
                      currentThinking = currentText.substring(startIdx + tagUsed.length);
                      currentText = currentText.substring(0, startIdx);
                    }
                  }`;

const newLogic = `                  let currentText = fullResponse;
                  let currentThinking = '';
                  
                  // Hide SAVE_MEMORY tags during stream
                  currentText = currentText.replace(/<SAVE_MEMORY>[\\s\\S]*?(<\\/SAVE_MEMORY>)?/g, '');
                  
                  const thinkingStart = currentText.indexOf('<thinking>');
                  const thinkStart = currentText.indexOf('<think>');
                  
                  const startIdx = thinkingStart !== -1 ? thinkingStart : (thinkStart !== -1 ? thinkStart : -1);
                  
                  if (startIdx !== -1) {
                    const tagUsed = thinkingStart !== -1 ? '<thinking>' : '<think>';
                    const closeTag = thinkingStart !== -1 ? '</thinking>' : '</think>';
                    const endIdx = currentText.indexOf(closeTag);
                    
                    if (endIdx !== -1) {
                      currentThinking = currentText.substring(startIdx + tagUsed.length, endIdx);
                      currentText = currentText.substring(0, startIdx) + currentText.substring(endIdx + closeTag.length);
                    } else {
                      currentThinking = currentText.substring(startIdx + tagUsed.length);
                      currentText = currentText.substring(0, startIdx);
                    }
                  }`;

code = code.replace(oldLogic, newLogic);

fs.writeFileSync('src/App.tsx', code);
