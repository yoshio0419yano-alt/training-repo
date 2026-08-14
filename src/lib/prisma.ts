// 型のみの import。コンパイル時に消えるため、実行時には @prisma/client を読み込まない。
import type { PrismaClient } from "@prisma/client";

// DATABASE_URL が設定されているか（第3章で設定します）
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  if (!isDatabaseConfigured) {
    throw new Error(
      "DATABASE_URL が設定されていません。.env ファイルを確認してください（手順書 第3章 STEP6）。"
    );
  }
  // 型だけを import し、実体は使用時に読み込む。
  // これにより「npm install 時に prisma generate が失敗した」場合でも、
  // アプリの起動自体は妨げられない（DBを使う画面でだけエラーになる）。
  // eslint-disable-next-line
  const { PrismaClient: Client } = require("@prisma/client");
  return new Client({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }) as PrismaClient;
}

// 【重要】遅延初期化しています。
// このファイルを import しただけでは Prisma Client を読み込みません。
// これにより、DATABASE_URL が未設定の第1章〜第2章でもアプリが起動できます。
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    const client = globalForPrisma.prisma as unknown as Record<string, unknown>;
    const value = client[prop as string];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
