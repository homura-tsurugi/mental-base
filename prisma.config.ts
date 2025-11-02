import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// .env.localファイルを読み込む（CLAUDE.md準拠）
config({ path: ".env.local" });

// マイグレーションやdb pushにはDIRECT_DATABASE_URLを使用
// アプリケーション実行時はDATABASE_URL（Session Pooler）を使用
const getDatabaseUrl = () => {
  // Prisma CLI実行時（migrate, db push, studio等）はDIRECT_URLを優先
  if (process.env.DIRECT_DATABASE_URL) {
    return process.env.DIRECT_DATABASE_URL;
  }

  // アプリケーション実行時はDATABASE_URL（Session Pooler）
  const url = process.env.DATABASE_URL || "";
  if (!url.includes("pgbouncer=true")) {
    return url.includes("?") ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`;
  }
  return url;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: getDatabaseUrl(),
  },
});
