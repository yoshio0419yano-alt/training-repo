// Module 5（実装フェーズ）で実装する画面の雛形です。
// Module 4 の設計をもとに、以下のような機能をClaude Codeと一緒に実装してください。
//
//   - プロジェクトごとのタスク一覧表示
//   - タスクのステータス（未着手／進行中／完了）表示・更新
//   - タグ表示
//   - 担当者の表示・変更
//   - コメント機能（Module 7で追加）
//
// このファイルはあくまで開始地点です。コンポーネント分割やデータ取得方法（Server
// Component / Client Component の使い分けなど）は、設計フェーズで決めた方針に沿って
// 自由に組み替えてください。

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-xl font-bold">ダッシュボード（雛形）</h1>
      <p className="mt-2 text-sm text-gray-500">
        ここにプロジェクト／タスクの一覧を実装してください。
      </p>
    </main>
  );
}
