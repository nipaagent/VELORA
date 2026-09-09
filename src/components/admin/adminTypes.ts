import { TokenState } from '../../types';

export interface AdminUser {
  uid: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  avatarIndex?: number;
  password?: string;
  createdAt?: number;
  role?: string;
  status?: 'approved' | 'pending' | 'banned';
  isBanned?: boolean;
  isVip?: boolean;
  vipExpiresAt?: number;
  apiAccessEnabled?: boolean;
  apiKey?: string;
  referralCode?: string;
  tokenState?: TokenState;
}

export interface AdminLog {
  id: string;
  action: string;
  description: string;
  timestamp: number;
}

export interface ApiKeyDetail {
  name: string;
  maskedValue: string;
  status: string;
  lastUsed?: number;
  lastModel?: string;
  totalTokens?: number;
  todayCalls?: number;
  totalCalls?: number;
  successCalls?: number;
  errorCalls?: number;
  models?: Record<string, number>;
}
