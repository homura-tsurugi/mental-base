// Data Access Layer (DAL)
// CVE-2025-29927対応: Middleware認証の代わりにDALパターンを使用
// フェーズ2: ロールベース認証機能追加
// E2Eテスト対応: VITE_SKIP_AUTH環境変数で認証スキップ可能

import 'server-only';
import { auth } from '@/lib/auth';
import { cache } from 'react';
import { redirect } from 'next/navigation';

type UserRole = 'client' | 'mentor' | 'admin';

/**
 * 認証スキップ判定（E2Eテスト用）
 * VITE_SKIP_AUTH=true の場合、認証をスキップしてモックユーザーを返す
 */
const shouldSkipAuth = (): boolean => {
  return process.env.VITE_SKIP_AUTH === 'true';
};

/**
 * モックユーザーセッション（E2Eテスト用）
 * 認証スキップ時に使用されるダミーユーザー情報
 */
const getMockSession = () => {
  return {
    userId: 'test-user-id',
    userEmail: 'test@mentalbase.local',
    userName: 'Test User',
    userRole: 'client' as UserRole,
  };
};

/**
 * セッション検証（キャッシュ付き）
 * Server ComponentやServer Actionsで使用
 *
 * @throws {Error} 認証されていない場合
 * @returns {Promise<{ userId: string; userEmail: string; userName: string; userRole: UserRole }>}
 */
export const verifySession = cache(async () => {
  // E2Eテスト用: 認証スキップモード
  if (shouldSkipAuth()) {
    console.warn('[DAL] 認証スキップモード有効: E2Eテスト用モックユーザーを使用');
    return getMockSession();
  }

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email || '',
    userName: session.user.name || '',
    userRole: session.user.role,
  };
});

/**
 * セッション取得（認証不要）
 * 認証状態を確認したいが、リダイレクトしたくない場合に使用
 *
 * @returns {Promise<{ userId: string; userEmail: string; userName: string; userRole: UserRole } | null>}
 */
export const getSession = cache(async () => {
  // E2Eテスト用: 認証スキップモード
  if (shouldSkipAuth()) {
    console.warn('[DAL] 認証スキップモード有効: E2Eテスト用モックユーザーを使用');
    return getMockSession();
  }

  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email || '',
    userName: session.user.name || '',
    userRole: session.user.role,
  };
});

/**
 * ロール検証（汎用）
 * 指定されたロールを持っているか検証
 *
 * @param {UserRole | UserRole[]} allowedRoles - 許可されたロール（単一または配列）
 * @param {string} redirectTo - 認証失敗時のリダイレクト先（デフォルト: /auth）
 * @returns {Promise<{ userId: string; userEmail: string; userName: string; userRole: UserRole }>}
 */
export const verifyRole = cache(
  async (
    allowedRoles: UserRole | UserRole[],
    redirectTo: string = '/auth'
  ) => {
    const session = await verifySession();
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesArray.includes(session.userRole)) {
      redirect(redirectTo);
    }

    return session;
  }
);

/**
 * メンターロール検証
 * MENTORロールを持っているか検証
 *
 * @returns {Promise<{ userId: string; userEmail: string; userName: string; userRole: UserRole }>}
 */
export const verifyMentor = cache(async () => {
  // E2Eテスト用: 認証スキップモードではmentorロールのモックユーザーを返す
  if (shouldSkipAuth()) {
    console.warn('[DAL] 認証スキップモード有効: E2Eテスト用mentorモックユーザーを使用');
    return {
      userId: 'test-mentor-id',
      userEmail: 'mentor@mentalbase.local',
      userName: 'Test Mentor',
      userRole: 'mentor' as UserRole,
    };
  }
  return verifyRole('mentor', '/auth');
});

/**
 * クライアントロール検証
 * CLIENTロールを持っているか検証
 *
 * @returns {Promise<{ userId: string; userEmail: string; userName: string; userRole: UserRole }>}
 */
export const verifyClient = cache(async () => {
  return verifyRole('client', '/auth');
});

/**
 * クライアントまたはメンターロール検証
 * CLIENTまたはMENTORロールを持っているか検証
 *
 * @returns {Promise<{ userId: string; userEmail: string; userName: string; userRole: UserRole }>}
 */
export const verifyClientOrMentor = cache(async () => {
  return verifyRole(['client', 'mentor'], '/auth');
});
