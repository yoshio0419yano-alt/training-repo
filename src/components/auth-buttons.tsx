"use client";

// ログイン／ログアウトのボタン（実装済み・演習対象外）
import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-gray-500">読み込み中…</span>;
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("github")}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        GitHubでログイン
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700">
        {session.user.name ?? session.user.email} さん
      </span>
      <button
        onClick={() => signOut()}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
      >
        ログアウト
      </button>
    </div>
  );
}
