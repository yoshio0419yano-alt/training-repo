import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthButtons } from "@/components/auth-buttons";

export const metadata: Metadata = {
  title: "チーム向けタスク管理システム",
  description: "Claude Code 実践研修 お題アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          {/* ヘッダーは認証込みで実装済みです。第3章では中身の画面を作っていきます。 */}
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
              <a href="/" className="font-bold">
                タスク管理システム
              </a>
              <AuthButtons />
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
