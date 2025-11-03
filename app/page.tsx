import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * ルートページ - 認証状態とロールに基づいてリダイレクト
 *
 * リダイレクト先:
 * - 未認証 → /auth
 * - CLIENT → /client
 * - MENTOR → /admin
 */
export default async function RootPage() {
  // E2Eテストモード: 認証スキップ
  if (process.env.VITE_SKIP_AUTH === 'true') {
    redirect('/client');
  }

  // 認証状態を取得
  const session = await auth();

  // 未認証の場合は認証ページへ
  if (!session?.user) {
    redirect('/auth');
  }

  // ロールに基づいてリダイレクト
  const userRole = session.user.role || 'client';

  if (userRole === 'mentor' || userRole === 'admin') {
    redirect('/admin');
  }

  // デフォルト: クライアントダッシュボード
  redirect('/client');
}
