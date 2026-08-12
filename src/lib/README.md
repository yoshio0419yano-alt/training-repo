# src/lib

Prisma Clientのインスタンス化、認証設定、共通ユーティリティなど、
複数の画面・APIルートから使い回すロジックをここに追加していきます。

第3章以降で、例えば以下のようなファイルを追加することを想定しています。

- `prisma.ts` — PrismaClientのシングルトンインスタンス
- `auth.ts` — Auth.js（NextAuth）の設定
- `tasks.ts` — タスクのステータス更新など、ビジネスロジック
