// Auth.js (NextAuth v5) 型定義拡張
// フェーズ2: ロール管理機能追加

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'client' | 'mentor' | 'admin';
      isMentor: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'client' | 'mentor' | 'admin';
    isMentor: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'client' | 'mentor' | 'admin';
    isMentor: boolean;
  }
}
