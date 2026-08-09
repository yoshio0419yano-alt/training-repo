# CLAUDE.md（良い例：After）

> Module 3の演習用サンプルです。実際に使う際は、プロジェクトの実態に合わせて
> 内容を調整してください。

## プロジェクト概要

チーム向けタスク管理システム。GitHub OAuthでログインし、プロジェクト単位でタスクを
管理する社内向けWebアプリケーション。

## 技術スタック

- フレームワーク: Next.js（App Router）+ TypeScript
- スタイリング: Tailwind CSS
- DB / ORM: PostgreSQL（Neon）+ Prisma
- 認証: Auth.js（NextAuth）+ GitHub OAuth
- テスト: Vitest + Testing Library

## ディレクトリ構成の方針

- `src/app/` 配下はNext.jsのApp Router規約に従う
- 複数箇所から使うロジックは `src/lib/` に切り出す
- Prismaのスキーマ変更は必ず `prisma/schema.prisma` を経由し、直接DBを操作しない

## コーディング規約

- コンポーネントは関数コンポーネント + TypeScriptの型を明示する
- APIルートでは、入力値のバリデーションを必ず行う
- 変更を加えたら、関連するテストを追加または更新する

## Claude Codeへの依頼時のお願い

- ファイルを削除する場合は、必ず事前に確認を取ってから実行すること
- 複数ファイルにまたがる大きな変更を行う前に、方針を短く説明してから進めること
- `.env` ファイルの中身を出力・記録しないこと

## やってほしくないこと

- `prisma/migrations/` 配下のファイルを手動で編集すること
- 本番用の環境変数やAPIキーをコード中にハードコードすること
- `main` ブランチへの直接コミット（必ずブランチを切ってPull Requestを作成すること）
