#!/bin/bash
sed -i 's/onChange={(e) => setUsername(e.target.value)}/onChange={(e) => setUsername(e.target.value.replace(\/\\s\/g, ""))}/g' src/components/AuthModal.tsx
sed -i 's/onChange={(e) => setPassword(e.target.value)}/onChange={(e) => setPassword(e.target.value.replace(\/\\s\/g, ""))}/g' src/components/AuthModal.tsx
