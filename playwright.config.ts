import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E テスト設定
 * プロジェクト: Mental-Base MVP
 *
 * 主な設定:
 * - ヘッドレスモード: true (CI/CD環境対応)
 * - ベースURL: http://localhost:3247
 * - タイムアウト: 30秒
 * - リトライ: CI環境で2回、ローカルは0回
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './tests/e2e',

  // テストタイムアウト（30秒）
  timeout: 30 * 1000,

  // 各テストの前後に実行する処理のタイムアウト
  expect: {
    timeout: 5000,
  },

  // 並列実行設定
  fullyParallel: true,

  // CI環境ではfailFastを有効化
  forbidOnly: !!process.env.CI,

  // リトライ設定（CI環境でのみ2回リトライ）
  retries: process.env.CI ? 2 : 0,

  // ワーカー数（CI環境では1、ローカルは未定義で並列実行）
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 共通設定
  use: {
    // ベースURL
    baseURL: 'http://localhost:3247',

    // トレース設定（失敗時のみ）
    trace: 'on-first-retry',

    // スクリーンショット設定（失敗時のみ）
    screenshot: 'only-on-failure',

    // ビデオ設定（失敗時のみ）
    video: 'retain-on-failure',

    // ヘッドレスモード: true（ブラウザUIを非表示）
    // CI/CD環境、自動テスト環境で必須
    headless: true,

    // タイムアウト設定
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // プロジェクト設定（複数ブラウザ対応）
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 認証スキップ用の環境変数をブラウザコンテキストに渡す
        launchOptions: {
          env: {
            VITE_SKIP_AUTH: process.env.VITE_SKIP_AUTH || 'false',
          },
        },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          env: {
            VITE_SKIP_AUTH: process.env.VITE_SKIP_AUTH || 'false',
          },
        },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          env: {
            VITE_SKIP_AUTH: process.env.VITE_SKIP_AUTH || 'false',
          },
        },
      },
    },

    // モバイルブラウザ（オプション）
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Webサーバー設定（テスト実行前に自動起動）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3247',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2分
  },
});
