// ============================================================================
// 認証設定（GitHub OAuth）
//
// このファイルは【実装済み】です。研修の演習対象ではありません。
// 受講者のみなさんは、.env に GITHUB_ID / GITHUB_SECRET / NEXTAUTH_SECRET を
// 設定するだけでログインできるようになります（手順書 第1章 STEP8 を参照）。
//
// 中身を読んで理解する必要はありませんが、興味があれば Claude Code に
// 「src/lib/auth.ts の処理を説明して」と聞いてみてください。
// ============================================================================

import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],

  // データベースにセッションテーブルを作らずに済むよう、JWT方式を採用している。
  // これにより、受講者が第3章で設計するスキーマを Project / Task / Comment に
  // 集中させることができる。
  session: { strategy: "jwt" },

  callbacks: {
    // ログイン成功時に、User テーブルへレコードを作成／更新する。
    async signIn({ user, account }) {
      if (!account || account.provider !== "github") return false;

      const githubId = String(account.providerAccountId);
      await prisma.user.upsert({
        where: { githubId },
        update: {
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
        },
        create: {
          githubId,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
        },
      });
      return true;
    },

    async jwt({ token, account }) {
      if (account?.provider === "github") {
        token.githubId = String(account.providerAccountId);
      }
      return token;
    },

    // 画面側から session.user.id で DB上のユーザーIDを参照できるようにする。
    // タスクの担当者アサインなどを実装する際に使う。
    async session({ session, token }) {
      const githubId = token.githubId ? String(token.githubId) : null;
      if (githubId && session.user) {
        const dbUser = await prisma.user.findUnique({ where: { githubId } });
        if (dbUser) {
          (session.user as typeof session.user & { id?: string }).id = dbUser.id;
        }
      }
      return session;
    },
  },
};
