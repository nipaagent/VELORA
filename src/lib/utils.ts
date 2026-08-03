import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export const getSequentialSuffix = (index: number): string => {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
};

export const generateUniqueVeloraKey = (): string => {
  const PREFIX = "VELORA";

  let usedKeys: string[] = [];
  try {
    const log = localStorage.getItem('velora_used_keys_registry');
    if (log) usedKeys = JSON.parse(log);
  } catch (e) {
    console.error(e);
  }

  let keyCounter = parseInt(localStorage.getItem('velora_key_gen_counter') || '0', 10);
  let candidateKey = "";

  do {
    const suffix = getSequentialSuffix(keyCounter);
    candidateKey = `${PREFIX}${suffix}`;
    keyCounter++;
  } while (usedKeys.includes(candidateKey));

  usedKeys.push(candidateKey);
  localStorage.setItem('velora_used_keys_registry', JSON.stringify(usedKeys));
  localStorage.setItem('velora_key_gen_counter', keyCounter.toString());

  return candidateKey;
};
