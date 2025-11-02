/**
 * テスト用認証ヘルパー
 * Auth.js v5のCredentials Providerと統合
 */

/**
 * テストユーザーでログインし、認証Cookieを取得
 * @param email ユーザーのメールアドレス
 * @param password ユーザーのパスワード
 * @returns 認証Cookie文字列
 */
export async function loginForTest(
  email: string,
  password: string
): Promise<string> {
  const baseUrl = 'http://localhost:3247';

  // 1. CSRFトークンを取得
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  // 2. Get the CSRF cookie from the response
  const csrfCookies = csrfResponse.headers.get('set-cookie');
  let csrfCookie = '';
  if (csrfCookies) {
    // Auth.js v5 uses "authjs.csrf-token"
    const csrfCookieMatch = csrfCookies.match(/authjs\.csrf-token=([^;]+)/);
    if (csrfCookieMatch) {
      csrfCookie = `authjs.csrf-token=${csrfCookieMatch[1]}`;
    }
  }

  // 3. Credentials Providerのcallbackエンドポイントにログイン
  const loginResponse = await fetch(
    `${baseUrl}/api/auth/callback/credentials`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookie,
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken,
        redirect: 'false',
      }).toString(),
      redirect: 'manual', // リダイレクトを手動で処理
    }
  );

  // 4. レスポンスを確認とCookie収集
  const allCookies: string[] = [];

  // Collect cookies from the login response
  const loginCookies = loginResponse.headers.get('set-cookie');
  if (loginCookies) {
    // Split multiple Set-Cookie headers and extract cookie name=value
    const parsedLoginCookies = loginCookies.split(',').map(c => c.trim().split(';')[0]);
    allCookies.push(...parsedLoginCookies);
  }

  // If we got a redirect (302), follow it to collect more cookies
  if (loginResponse.status === 302 || loginResponse.status === 303) {
    const location = loginResponse.headers.get('location');
    if (location) {
      // Follow the redirect with existing cookies
      const cookieHeader = [csrfCookie, ...allCookies].filter(Boolean).join('; ');

      const redirectResponse = await fetch(
        location.startsWith('http') ? location : `${baseUrl}${location}`,
        {
          headers: {
            Cookie: cookieHeader,
          },
          redirect: 'manual',
        }
      );

      // Get cookies from the redirect response
      const redirectCookies = redirectResponse.headers.get('set-cookie');
      if (redirectCookies) {
        const parsedRedirectCookies = redirectCookies.split(',').map(c => c.trim().split(';')[0]);
        allCookies.push(...parsedRedirectCookies);
      }
    }
  }

  // 5. Check if we have any cookies
  if (allCookies.length === 0) {
    const body = await loginResponse.text();
    const location = loginResponse.headers.get('location');
    throw new Error(`ログインに失敗しました: Cookieが取得できませんでした。Status: ${loginResponse.status}, Location: ${location}, Body: ${body.substring(0, 200)}`);
  }

  // Join all cookies for searching
  const cookies = allCookies.join(',');

  // 6. 複数のCookieから認証関連のCookieのみを抽出
  // Auth.js v5では、session tokenは"authjs.session-token"または"__Secure-authjs.session-token"
  const sessionCookie = cookies
    .split(',')
    .map((c) => c.trim())
    .find(
      (c) =>
        c.startsWith('authjs.session-token=') ||
        c.startsWith('__Secure-authjs.session-token=') ||
        c.startsWith('next-auth.session-token=') ||
        c.startsWith('__Secure-next-auth.session-token=')
    );

  if (!sessionCookie) {
    throw new Error(
      `ログインに失敗しました: セッションCookieが見つかりませんでした。Cookies: ${cookies.substring(0, 200)}`
    );
  }

  // Cookie属性（Path, HttpOnly等）を除去し、Cookie名と値のみを返す
  const cookieNameValue = sessionCookie.split(';')[0];

  return cookieNameValue;
}

/**
 * 認証Cookieをリクエストヘッダー形式で取得
 * @param email ユーザーのメールアドレス
 * @param password ユーザーのパスワード
 * @returns Cookieヘッダー用の文字列
 */
export async function getAuthCookie(
  email: string,
  password: string
): Promise<string> {
  return await loginForTest(email, password);
}

/**
 * 認証Cookieを使用してAPIリクエストを実行
 * @param url APIエンドポイントURL
 * @param options fetchオプション
 * @param authCookie 認証Cookie
 * @returns fetchレスポンス
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit,
  authCookie: string
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: authCookie,
    },
  });
}
