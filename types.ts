
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  type?: 'text' | 'image' | 'voice' | 'doc';
  mediaUrl?: string;
}

export interface PrivacySettings {
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  profilePhoto: 'everyone' | 'contacts' | 'nobody';
  about: 'everyone' | 'contacts' | 'nobody';
  status: 'everyone' | 'contacts' | 'nobody';
}

export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  avatar: string;
  about: string;
  online: boolean;
  lastSeen?: number;
  privacy: PrivacySettings;
  blockedUsers: string[];
}

export interface Group {
  id: string;
  name: string;
  avatar: string;
  adminIds: string[];
  participantIds: string[];
  description: string;
}

export interface Chat {
  id: string;
  type: 'individual' | 'group';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isTyping?: boolean;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  timestamp: number;
  type: 'image' | 'video';
}

export interface Call {
  id: string;
  type: 'voice' | 'video';
  participantId: string;
  status: 'ongoing' | 'missed' | 'ended';
  timestamp: number;
}

export type AuthState = 'idle' | 'otp-pending' | 'authenticated';
export type ActiveTab = 'chats' | 'status' | 'calls' | 'settings';
export type Theme = 'dark' | 'light';
