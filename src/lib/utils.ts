import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Chat } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTokenCount(num: number): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return val % 1 === 0 ? `${val}k` : `${val.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toString();
}

/**
 * Safely saves chat history to local storage.
 * If QuotaExceededError occurs, it prunes the chat list/messages and retries.
 */
export const saveChatsToLocal = (key: string, chatList: Chat[]) => {
  if (!key || !Array.isArray(chatList)) return;
  try {
    localStorage.setItem(key, JSON.stringify(chatList));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22) {
      console.warn("LocalStorage quota exceeded. Pruning chats...");
      // Try Strategy 1: Prune long message histories (keep last 15 per chat)
      const pruned = chatList.map(c => ({
        ...c,
        messages: (c.messages || []).slice(-15)
      }));
      try {
        localStorage.setItem(key, JSON.stringify(pruned));
      } catch (e2) {
        // Try Strategy 2: Keep only the most recent 10 chats total
        const ultraPruned = pruned.slice(0, 10);
        try {
          localStorage.setItem(key, JSON.stringify(ultraPruned));
        } catch (e3) {
          // If still failing, clear cache for this key and rely on state/cloud
          console.error("Fatal local storage error after extreme pruning.");
        }
      }
    }
  }
};

export const getSequentialSuffix = (index: number): string => {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
};

export const generateUniqueNipaKey = (): string => {
  const PREFIX = "NIPA";

  let usedKeys: string[] = [];
  try {
    const log = localStorage.getItem('nipa_used_keys_registry');
    if (log) usedKeys = JSON.parse(log);
  } catch (e) {
    console.error(e);
  }

  let keyCounter = parseInt(localStorage.getItem('nipa_key_gen_counter') || '0', 10);
  let candidateKey = "";

  do {
    const suffix = getSequentialSuffix(keyCounter);
    candidateKey = `${PREFIX}${suffix}`;
    keyCounter++;
  } while (usedKeys.includes(candidateKey));

  usedKeys.push(candidateKey);
  localStorage.setItem('nipa_used_keys_registry', JSON.stringify(usedKeys));
  localStorage.setItem('nipa_key_gen_counter', keyCounter.toString());

  return candidateKey;
};
