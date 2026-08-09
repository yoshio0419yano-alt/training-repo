# Claude Code 実践研修 教材リポジトリ

「Claude Code 実践研修プログラム（2日間・15時間）」の事前配布物です。
このリポジトリを起点に、研修中は Day1〜Day2 を通じて「チーム向けタスク管理システム」を
Claude Code と一緒に設計・実装・テスト・デプロイまで進めます。

## 事前準備（研修開始前に必ず実施）

1. このリポジトリを **自分のGitHubアカウントにフォーク**してください（Module 9でPull Requestを作成するため、必ず自分のアカウント配下に置く必要があります）。
2. フォークしたリポジトリをローカルにclone。
3. `.env.example` を `.env` にコピーし、値は空のままでOK（Module 3・7で実際の値を設定します）。
4. Node.js（LTS版）、Git、Claude Codeがインストール済みであることを確認（詳しくは研修資料 3.2節を参照）。
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
├── CLAUDE.md                     # スターター（Module 3で受講者が肉付けする）
├── docs/
│   ├── requirements.md           # お題アプリの要件定義書（意図的に曖昧な部分あり／Module 4で使用）
│   ├── prompt-examples.md        # 各モジュール共通プロンプト例集
│   └── claude-md-templates/
│       ├── before.md             # CLAUDE.mdの悪い例（Module 3で比較用）
│       └── after.md              # CLAUDE.mdの良い例（Module 3で比較用）
├── prisma/
│   └── schema.prisma             # DBスキーマのスターター（User以外は受講者がModule 4で設計）
├── src/
│   ├── app/                      # Next.js App Router（雛形のみ。主要機能はModule 5で実装）
│   └── lib/                      # 共通ロジック置き場（空。Module 5以降で追加）
└── exercises/
    └── debug-task-status/        # Module 6のデバッグ演習用（意図的にバグを仕込んだ独立モジュール）
```

## 研修モジュールとの対応

| モジュール | 使用するもの |
|---|---|
| M1 インストール・環境構築 | リポジトリのclone、`npm install`の疎通確認 |
| M3 プロジェクト設定・環境設定 | `CLAUDE.md`、`docs/claude-md-templates/` |
| M4 Webシステム設計フェーズ | `docs/requirements.md` |
| M5 実装フェーズ | `prisma/schema.prisma`、`src/app/`、`src/lib/` |
| M6 テスト・品質保証 | `exercises/debug-task-status/` |
| M7 MCP連携・外部ツール接続 | `.env`（DB接続情報）、`prisma/schema.prisma` |
| M9 CI/CD連携とリリース準備 | GitHubへのPull Request作成 |
| 付録 | `docs/prompt-examples.md` |

## 技術スタック

Next.js（App Router）+ TypeScript / Tailwind CSS / Prisma + PostgreSQL（Neon or Supabase）/
Auth.js（GitHub OAuth）/ Vitest / GitHub Actions / Vercel

詳細は研修資料「2. 使用技術スタックとお題アプリケーション」を参照してください。
