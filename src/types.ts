export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thinking?: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  password?: string;
  role?: 'admin' | 'user';
  status?: 'approved' | 'pending' | 'banned';
  isBanned?: boolean;
  apiAccessEnabled?: boolean;
  apiKey?: string;
  createdAt: number;
}
