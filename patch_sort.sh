#!/bin/bash
sed -i '/const chatsList: Chat\[\] = Object.values(data);/a\
              chatsList.sort((a, b) => b.updatedAt - a.updatedAt);' src/App.tsx
