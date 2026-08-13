// ============================================================================
// 認証設定（GitHub OAuth）
//
// このファイルは【実装済み】です。研修の演習対象ではありません。
// 受講者のみなさんは、.env に GITHUB_ID / GITHUB_SECRET / NEXTAUTH_SECRET を
// 設定するだけでログインできるようになります（手順書 第1章 STEP8 を参照）。
//
// 設定が未完了の状態でもアプリが起動できるように作ってあります。
// ログインボタンを押すまではデータベースにも接続しません。
// ============================================================================

import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { prisma, isDatabaseConfigured } from "./prisma";

// GitHub OAuth の設定が済んでいるか
export const isAuthConfigured = Boolean(
  process.env.GITHUB_ID && process.env.GITHUB_SECRET
);

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  // データベースにセッションテーブルを作らずに済むよう、JWT方式を採用している。
  // これにより、受講者が第3章で設計するスキーマを Project / Task / Comment に
  // 集中させることができる。
  session: { strategy: "jwt" },

  callbacks: {
    // ログイン成功時に、User テーブルへレコードを作成／更新する。
    async signIn({ user, account }) {
      if (!account || account.provider !== "github") return false;

      // DATABASE_URL が未設定の段階（第1章〜第2章）でも動作確認できるようにする。
      if (!isDatabaseConfigured) {
        console.warn(
          "[auth] DATABASE_URL が未設定のため、Userテーブルへの登録をスキップしました。"
        );
        return true;
      }

      try {
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
      } catch (error) {
        // DBに繋がらない場合でもログイン自体は通し、原因をログに出す。
        // （マイグレーション未実行、接続文字列の誤りなどが原因になりやすい）
        console.error("[auth] Userテーブルの更新に失敗しました:", error);
      }
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
      if (!githubId || !session.user || !isDatabaseConfigured) return session;

      try {
        const dbUser = await prisma.user.findUnique({ where: { githubId } });
        if (dbUser) {
          (session.user as typeof session.user & { id?: string }).id = dbUser.id;
        }
      } catch (error) {
        // ここで例外を投げると画面全体が読み込めなくなるため、必ず握る。
        console.error("[auth] ユーザー情報の取得に失敗しました:", error);
      }
      return session;
    },
  },
};
