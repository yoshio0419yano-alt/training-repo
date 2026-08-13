# CLAUDE.md

## プロジェクト概要

チーム向けタスク管理システム（Claude Code実践研修のお題アプリ）。
GitHub OAuthでログインし、プロジェクト単位でタスク（ステータス・タグ・担当者・コメント）を
管理する社内向けWebアプリケーション。要件は `docs/requirements.md` を参照（意図的に曖昧な
部分が残っているドラフトなので、不明点はまず質問すること）。

現在の状態: 認証機能のみ実装済み。Project / Task / Comment 関連の設計・実装はこれから
（研修第3章以降で進める）。

## 技術スタック

- フレームワーク: Next.js 14（App Router）+ TypeScript
- スタイリング: Tailwind CSS
- DB / ORM: PostgreSQL（Neon/Supabase）+ Prisma
- 認証: Auth.js（NextAuth v4）+ GitHub OAuth
- テスト: Vitest + Testing Library

## ディレクトリ構成の方針

- `src/app/` 配下はNext.jsのApp Router規約に従う
- 複数箇所から使うロジックは `src/lib/` に切り出す
- Prismaのスキーマ変更は必ず `prisma/schema.prisma` を経由し、直接DBを操作しない
- `exercises/` 配下はメインアプリとは無関係の独立した演習モジュール

## コーディング規約

- コンポーネントは関数コンポーネント + TypeScriptの型を明示する
- APIルートでは、入力値のバリデーションを必ず行う
- 変更を加えたら、関連するテストを追加または更新する
- `prisma/schema.prisma` を変更したら `npx prisma migrate dev` でマイグレーションを生成する

## Claude Codeへの依頼時のお願い

- ファイルを削除する場合は、必ず事前に確認を取ってから実行すること
- 複数ファイルにまたがる大きな変更を行う前に、方針を短く説明してから進めること
- `.env` ファイルの中身を出力・記録・引用しないこと
- `src/lib/auth.ts` の認証フロー（signIn/jwt/sessionコールバック）を変更する場合は、
  何が・なぜ変わるのかを説明してから進めること

## やってほしくないこと

- 認証関連ファイル（`src/lib/auth.ts`、`src/lib/prisma.ts`、
  `src/app/api/auth/[...nextauth]/route.ts`、`src/components/providers.tsx`、
  `src/components/auth-buttons.tsx`）を、明示的に依頼されていない限り変更すること。
  これらは実装済み・演習対象外であり、意図しない変更はログイン機能を壊す。
- `prisma/schema.prisma` の `User` モデルの既存フィールド（特に `githubId`）を
  変更・削除すること。`src/lib/auth.ts` がこのフィールドでユーザーを特定しているため、
  整合性が崩れるとログインできなくなる。
- `prisma/migrations/` 配下のファイルを手動で編集すること
- `.env` / `.env.example` に実際のシークレット値（`GITHUB_ID`、`GITHUB_SECRET`、
  `NEXTAUTH_SECRET`、`DATABASE_URL`）を書き込む、またはコード中にハードコードすること
- `exercises/debug-task-status/` 配下のバグを、明示的な依頼なしに独自の判断で
  修正すること。ここは第4章のデバッグ演習用に意図的にバグを仕込んだ教材であり、
  先回りして直すと演習の意味がなくなる。
- `main` ブランチへの直接コミット。必ずブランチを切ってPull Requestを作成すること
- `package-lock.json` を安易に再生成・削除すること（依存関係のズレを招く）
