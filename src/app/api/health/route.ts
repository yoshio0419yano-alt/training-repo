import { NextResponse } from "next/server";

// 動作確認用の最小限のAPIルートです。
// 第1章のセットアップ演習で「npm run dev」後にこのエンドポイントへアクセスし、
// {"status":"ok"} が返ってくることを確認してください。
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
