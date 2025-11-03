// クライアント登録API
// POST /api/admin/register-client

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { sendClientRegistrationEmail } from '@/lib/email';

interface RegisterClientRequest {
  name: string;
  email: string;
}

// 初期パスワード生成関数（8文字のランダム文字列）
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    // E2Eテスト用: test-mentor-idユーザーが存在しない場合は作成
    if (mentorId === 'test-mentor-id' && process.env.VITE_SKIP_AUTH === 'true') {
      const testMentor = await prisma.user.findUnique({
        where: { id: mentorId },
      });

      if (!testMentor) {
        await prisma.user.create({
          data: {
            id: mentorId,
            name: 'テストメンター',
            email: 'test-mentor@example.com',
            password: await bcrypt.hash('test-password', 10),
            role: 'mentor',
            isMentor: true,
          },
        });
        console.log('[E2E] テストメンターユーザーを作成しました');
      }
    }

    const body: RegisterClientRequest = await request.json();
    const { name, email } = body;

    // バリデーション
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: '名前は2文字以上で入力してください' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // 1. メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // 2. 初期パスワード生成
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // 3. Userレコードを作成（role: client）
    const client = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'client',
        isMentor: false,
      },
    });

    // 4. MentorClientRelationshipレコードを作成（status: active）
    const relationship = await prisma.mentorClientRelationship.create({
      data: {
        mentorId,
        clientId: client.id,
        status: 'active',
        invitedBy: mentorId,
        acceptedAt: new Date(),
      },
    });

    // 5. ClientDataAccessPermissionレコードを作成（デフォルト全て許可）
    await prisma.clientDataAccessPermission.create({
      data: {
        relationshipId: relationship.id,
        clientId: client.id,
        allowGoals: true,
        allowTasks: true,
        allowLogs: true,
        allowReflections: true,
        allowAiReports: true,
        isActive: true,
      },
    });

    // 6. 通知を作成（クライアント向け）
    await prisma.notification.create({
      data: {
        userId: client.id,
        type: 'info',
        title: 'アカウントが作成されました',
        message: `${session.userName || 'メンター'}さんによってアカウントが作成されました。初期パスワードでログインし、パスワードを変更してください。`,
        read: false,
      },
    });

    // 7. メール送信
    const emailResult = await sendClientRegistrationEmail(
      email,
      name,
      temporaryPassword,
      session.userName || 'メンター'
    );

    // メール送信失敗時は警告ログを出すが、登録処理自体は成功とする
    if (!emailResult.success) {
      console.warn('⚠️ メール送信に失敗しましたが、アカウント登録は完了しました:', emailResult.error);
    }

    return NextResponse.json({
      data: {
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        temporaryPassword, // フロントエンドに返す
        relationshipId: relationship.id,
        emailSent: emailResult.success, // メール送信成功/失敗
        message: emailResult.success
          ? 'クライアントを登録し、ログイン情報をメールで送信しました'
          : 'クライアントを登録しました（メール送信に失敗しました）',
      },
    });
  } catch (error) {
    console.error('クライアント登録エラー:', error);
    return NextResponse.json(
      { error: 'クライアント登録に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
