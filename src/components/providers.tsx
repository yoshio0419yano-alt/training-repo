"use client";

// 認証状態を画面全体で参照できるようにするためのラッパー（実装済み・演習対象外）
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
