#!/bin/bash
sed -i '/const chatsList: Chat\[\] = Object.values(data);/c\
              const chatsList: Chat[] = Object.values(data);\
              chatsList.sort((a, b) => b.updatedAt - a.updatedAt);\
              \
              // 7MB Data Limit Check (approx 7,000,000 bytes)\
              let dataString = JSON.stringify(chatsList);\
              if (dataString.length > 7000000) {\
                let updated = false;\
                while (dataString.length > 7000000 && chatsList.length > 1) {\
                  const oldestChat = chatsList.pop();\
                  if (oldestChat) {\
                    remove(ref(db, `chats/${currentUser.uid}/${oldestChat.id}`));\
                    updated = true;\
                  }\
                  dataString = JSON.stringify(chatsList);\
                }\
                if (updated) console.log("Data quota exceeded (7MB). Oldest chats deleted.");\
              }' src/App.tsx

sed -i '/chatsList.sort((a, b) => b.updatedAt - a.updatedAt);/d' src/App.tsx
