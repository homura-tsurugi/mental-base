// パスワードリセットリクエストAPI
// POST /api/auth/password-reset/request

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // セキュリティ: ユーザーが存在しない場合でも成功レスポンスを返す
    // （メールアドレスの存在確認を防ぐため）
    if (!user) {
      return NextResponse.json({
        message: 'パスワードリセットリンクを送信しました（該当するアカウントが存在する場合）',
      });
    }

    // 既存の未使用トークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        expires: { gt: new Date() }, // 有効期限内のもののみ
      },
    });

    // 新しいトークンを生成
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // トークンを保存
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // パスワードリセットURL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    // メール送信
    try {
      await resend.emails.send({
        from: 'COM:PASS <onboarding@resend.dev>',
        to: user.email,
        subject: 'パスワードリセットのご案内 - COM:PASS',
        html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2E5BA8 0%, #4A90E2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #4A90E2;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">✦ COM:PASS</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">ライフ・ワークガバナンス プラットフォーム</p>
  </div>

  <div class="content">
    <h2 style="color: #2E5BA8; margin-top: 0;">パスワードリセットのリクエスト</h2>

    <p>こんにちは、${user.name || user.email}様</p>

    <p>パスワードリセットのリクエストを受け付けました。下記のボタンをクリックして、新しいパスワードを設定してください。</p>

    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">パスワードをリセット</a>
    </div>

    <p style="font-size: 14px; color: #666;">
      ボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
      <a href="${resetUrl}" style="color: #4A90E2; word-break: break-all;">${resetUrl}</a>
    </p>

    <div class="warning">
      <strong>⚠️ 重要な注意事項：</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>このリンクの有効期限は <strong>1時間</strong> です</li>
        <li>このメールに心当たりがない場合は、無視してください</li>
        <li>パスワードリセットは、リンクをクリックするまで実行されません</li>
      </ul>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      このメールは自動送信されています。返信はできませんのでご了承ください。
    </p>
  </div>

  <div class="footer">
    <p style="margin: 0 0 10px 0;">© 2025 COM:PASS - All rights reserved</p>
    <p style="margin: 0;">
      <a href="${process.env.NEXTAUTH_URL}" style="color: #4A90E2; text-decoration: none;">ホームに戻る</a> ·
      <a href="#" style="color: #4A90E2; text-decoration: none;">プライバシーポリシー</a> ·
      <a href="#" style="color: #4A90E2; text-decoration: none;">お問い合わせ</a>
    </p>
  </div>
</body>
</html>
        `,
      });

      console.log(`✅ パスワードリセットメール送信成功: ${user.email}`);
    } catch (emailError) {
      console.error('❌ メール送信エラー:', emailError);

      // メール送信失敗時はコンソールにURLを表示（フォールバック）
      console.log('\n============ パスワードリセットリンク（メール送信失敗） ============');
      console.log(`ユーザー: ${user.email}`);
      console.log(`リセットURL: ${resetUrl}`);
      console.log(`有効期限: ${expires.toLocaleString('ja-JP')}`);
      console.log('=================================================================\n');

      // メール送信失敗でもユーザーには成功と返す（セキュリティ上の理由）
    }

    return NextResponse.json({
      message: 'パスワードリセットリンクを送信しました（該当するアカウントが存在する場合）',
    });
  } catch (error) {
    console.error('パスワードリセットリクエストエラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセットリクエストに失敗しました' },
      { status: 500 }
    );
  }
}
