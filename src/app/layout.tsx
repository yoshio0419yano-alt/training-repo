import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
