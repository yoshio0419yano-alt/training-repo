export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold">チーム向けタスク管理システム（雛形）</h1>
      <p className="mt-4 text-gray-600">
        この画面はプレースホルダーです。研修の Module 4（設計フェーズ）・
        Module 5（実装フェーズ）で、Claude Code と一緒にログイン画面や
        プロジェクト一覧、タスク管理画面を実装していきます。
      </p>
      <ul className="mt-6 list-disc pl-5 text-sm text-gray-500">
        <li>TODO: GitHub OAuthによるログイン導線を追加する（Module 3）</li>
        <li>TODO: プロジェクト一覧・作成画面を追加する（Module 5）</li>
        <li>
          TODO: <code>/dashboard</code> にタスク一覧・ステータス更新機能を実装する（Module 5）
        </li>
      </ul>
    </main>
  );
}
