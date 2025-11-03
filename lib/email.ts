// メール送信ユーティリティ
// Resend APIを使用

import { Resend } from 'resend';

// Resend クライアント初期化
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// 送信者情報
const FROM_EMAIL = process.env.EMAIL_FROM || 'COM:PASS <noreply@mentalbase.local>';

// メール送信の結果型
export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * クライアント登録完了メール送信
 */
export async function sendClientRegistrationEmail(
  to: string,
  clientName: string,
  temporaryPassword: string,
  mentorName: string
): Promise<EmailResult> {
  // RESEND_API_KEY が設定されていない場合はスキップ（開発環境用）
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY が設定されていません。メール送信をスキップします。');
    return {
      success: false,
      error: 'RESEND_API_KEY not configured',
    };
  }

  try {
    const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3247';

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '【COM:PASS】アカウントが作成されました',
      html: getClientRegistrationEmailHTML({
        clientEmail: to,
        clientName,
        temporaryPassword,
        mentorName,
        loginUrl,
      }),
    });

    if (error) {
      console.error('メール送信エラー:', error);
      return {
        success: false,
        error: error.message || 'メール送信に失敗しました',
      };
    }

    console.log('✓ メール送信成功:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('メール送信エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メール送信に失敗しました',
    };
  }
}

/**
 * クライアント登録メールのHTMLテンプレート
 */
function getClientRegistrationEmailHTML(params: {
  clientEmail: string;
  clientName: string;
  temporaryPassword: string;
  mentorName: string;
  loginUrl: string;
}): string {
  const { clientEmail, clientName, temporaryPassword, mentorName, loginUrl } = params;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>COM:PASSアカウント作成のお知らせ</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .credentials-box {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .credentials-box strong {
      display: block;
      margin-bottom: 5px;
      color: #667eea;
    }
    .password {
      font-family: 'Courier New', monospace;
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      background: #f3f4f6;
      padding: 10px;
      border-radius: 5px;
      letter-spacing: 2px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 COM:PASS</h1>
    <p>ライフ・ワークガバナンス プラットフォーム</p>
  </div>

  <div class="content">
    <p>こんにちは、${clientName}さん</p>

    <p><strong>${mentorName}</strong>さんによってCOM:PASSアカウントが作成されました。</p>

    <p>以下のログイン情報を使用してCOM:PASSにアクセスできます。</p>

    <div class="credentials-box">
      <strong>メールアドレス:</strong>
      <p style="margin: 5px 0;">${clientEmail}</p>

      <strong>初期パスワード:</strong>
      <p class="password">${temporaryPassword}</p>
    </div>

    <div class="warning">
      <strong>⚠️ 重要:</strong>
      <ul style="margin: 10px 0;">
        <li>初回ログイン後、必ずパスワードを変更してください</li>
        <li>このメールは他の人に転送しないでください</li>
        <li>パスワードは安全な場所に保管してください</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${loginUrl}/auth" class="button">COM:PASSにログイン</a>
    </div>

    <h3>COM:PASSについて</h3>
    <p>COM:PASSは、目標設定から振り返りまでをサポートするライフ・ワークガバナンス プラットフォームです。</p>
    <ul>
      <li>📋 目標とタスクの管理</li>
      <li>📝 日々の活動記録</li>
      <li>🔍 振り返りと改善</li>
      <li>🤖 AIアシスタントによるサポート</li>
    </ul>

    <p>ご不明な点がございましたら、メンターの${mentorName}さんにお問い合わせください。</p>
  </div>

  <div class="footer">
    <p>このメールは自動送信されています。</p>
    <p>© 2025 COM:PASS. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * パスワードリセットメール送信（将来実装用）
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetToken: string
): Promise<EmailResult> {
  // TODO: パスワードリセット機能実装時に追加
  return {
    success: false,
    error: 'Not implemented yet',
  };
}

/**
 * メンター招待メール送信（将来実装用）
 */
export async function sendMentorInvitationEmail(
  to: string,
  clientName: string,
  invitationUrl: string
): Promise<EmailResult> {
  // TODO: メンター招待機能実装時に追加
  return {
    success: false,
    error: 'Not implemented yet',
  };
}
