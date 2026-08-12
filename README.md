# Claude Code 実践研修 教材リポジトリ

「Claude Code 実践研修プログラム（2日間）」の事前配布物です。
このリポジトリを起点に、研修テキストの第1章〜第6章を通じて「チーム向けタスク管理システム」を
Claude Code と一緒に設計・実装・テスト・デプロイまで進めます。

## 事前準備（研修開始前に必ず実施）

1. このリポジトリを **自分のGitHubアカウントにフォーク**してください（第5章でPull Requestを作成するため、必ず自分のアカウント配下に置く必要があります）。
2. フォークしたリポジトリをローカルにclone。
3. `.env.example` を `.env` にコピーし、値は空のままでOK（第2章・第4章で実際の値を設定します）。
4. Node.js（LTS版）、Git、Claude Codeがインストール済みであることを確認。
5. `npm install` を実行し、エラーが出ないことを確認してください（DBがまだ無いのでこの時点では起動確認まではしません）。

```bash
git clone <あなたのフォークのURL>
cd training-repo
cp .env.example .env
npm install
```

## リポジトリ構成

```
.
├── README.md                     # このファイル
├── CLAUDE.md                     # スターター（第2章で受講者が肉付けする）
├── docs/
│   ├── requirements.md           # お題アプリの要件定義書（意図的に曖昧な部分あり／第3章で使用）
│   ├── prompt-examples.md        # 章ごとのプロンプト例集
│   └── claude-md-templates/
│       ├── before.md             # CLAUDE.mdの悪い例（第2章で比較用）
│       └── after.md              # CLAUDE.mdの良い例（第2章で比較用）
├── prisma/
│   └── schema.prisma             # DBスキーマのスターター（User以外は受講者が第3章で設計）
├── src/
│   ├── app/                      # Next.js App Router（雛形のみ。主要機能は第3章で実装）
│   └── lib/                      # 共通ロジック置き場（空。第3章以降で追加）
└── exercises/
    └── debug-task-status/        # 第4章のデバッグ演習用（意図的にバグを仕込んだ独立モジュール）
```

## 研修テキストの章との対応

| 章 | 使用するもの |
|---|---|
| 第1章　Claude Codeの基礎とセットアップ | リポジトリのclone、`npm install`の疎通確認 |
| 第2章　基本操作とプロジェクト設定 | `CLAUDE.md`、`docs/claude-md-templates/` |
| 第3章　設計と実装 | `docs/requirements.md`、`prisma/schema.prisma`、`src/app/`、`src/lib/` |
| 第4章　品質保証と外部連携 | `exercises/debug-task-status/`、`.env`（DB接続情報） |
| 第5章　自動化とCI/CD・リリース | GitHubへのPull Request作成、デプロイ設定 |
| 第6章　応用と組織導入 | （これまでの成果物を振り返りながら議論） |

プロンプト例は `docs/prompt-examples.md` にまとめてあります。

## 技術スタック

Next.js（App Router）+ TypeScript / Tailwind CSS / Prisma + PostgreSQL（Neon or Supabase）/
Auth.js（GitHub OAuth）/ Vitest / GitHub Actions / Vercel

詳細は研修資料「使用技術スタックとお題アプリケーション」を参照してください。
