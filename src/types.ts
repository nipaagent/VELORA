export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thinking?: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface TokenState {
  maxDailyTokens: number;
  bonusTokens: number;
  tokensUsedToday: number;
  lastResetDate: string;
  adsWatchedToday: number;
}

export interface UserProfile {
  uid: string;
  email?: string;
  fullName: string;
  username: string;
  password?: string;
  role?: 'admin' | 'user';
  status?: 'approved' | 'pending' | 'banned';
  isBanned?: boolean;
  isVip?: boolean;
  vipExpiresAt?: number;
  apiAccessEnabled?: boolean;
  apiKey?: string;
  createdAt: number;
  avatarUrl?: string;
  avatarIndex?: number;
  themeColor?: string;
  themeGlow?: number;
  tokenState?: TokenState;
  referralCode?: string;
  referredBy?: string;
  referredByCode?: string;
  referredByName?: string;
  referralCount?: number;
  adsWatchedCount?: number;
  knowledgeBases?: { id: string; title: string; content: string; createdAt: number; attachments?: Attachment[]; }[];
  activeKnowledgeBaseId?: string;
  userMemory?: string;
}

export type RedeemRewardType = 'tokens' | 'vip_days';

export interface RedeemCode {
  id: string;
  code: string;
  rewardType: RedeemRewardType;
  tokenAmount?: number; // e.g., 50000
  vipDays?: number; // e.g., 1, 7, 30
  maxUses: number; // e.g. 100
  usedCount: number; // usages so far
  usedBy?: { [uid: string]: number }; // uid -> timestamp
  createdAt: number;
  isActive: boolean;
  expiresAt?: number; // optional timestamp expiration
}

export interface SystemAnnouncement {
  isActive: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'promo';
  linkUrl?: string;
  linkText?: string;
  updatedAt?: number;
}

export interface SystemControl {
  maintenanceMode: boolean;
  maintenanceNotice?: string;
  allowRegistration: boolean;
  aiChatEnabled: boolean;
  adRewardsEnabled: boolean;
  updatedAt?: number;
}

export interface PaymentTransaction {
  id: string;
  trxId: string;
  orderId: string;
  userId: string;
  username?: string;
  userEmail?: string;
  packageId: string;
  packageName: string;
  type: 'vip' | 'tokens';
  amount: number;
  priceBdt: number;
  priceSp: number;
  cardNumberMasked: string;
  status: 'completed' | 'failed' | 'pending';
  gateway: string;
  timestamp: number;
  gatewayResponse?: any;
}

