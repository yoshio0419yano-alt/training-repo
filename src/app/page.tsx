export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold">チーム向けタスク管理システム（雛形）</h1>
      <p className="mt-4 text-gray-600">
        この画面はプレースホルダーです。研修の第3章（設計と実装）で、
        Claude Code と一緒にプロジェクト一覧やタスク管理画面を実装していきます。
      </p>

      <div className="mt-6 rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-800">認証機能について</p>
        <p className="mt-1">
          GitHubログイン（画面右上のボタン）は<strong>実装済み</strong>です。演習の対象外なので、
          みなさんは設計・実装・テストに集中してください。
          ログインすると <code>User</code> テーブルにレコードが作成されます。
        </p>
      </div>

      <ul className="mt-6 list-disc pl-5 text-sm text-gray-500">
        <li>TODO: プロジェクト一覧・作成画面を追加する（第3章）</li>
        <li>
          TODO: <code>/dashboard</code> にタスク一覧・ステータス更新機能を実装する（第3章）
        </li>
        <li>TODO: タスクへのコメント機能を追加する（第4章）</li>
      </ul>
    </main>
  );
}
