// APIルート共通のヘルパー。
//
// 認可ルールは docs/design-memo.md の決定に対応する：
//   - チームの管理者／一般メンバーは TeamMembership.role で判定する
//   - プロジェクトの参照・編集は ProjectMember であることのみを条件とする（プロジェクト単位のロールはない）

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[api] unexpected error:", error);
  return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
}

// GET/POST/PATCH/DELETEハンドラの本体をラップし、ApiErrorを一律でエラーレスポンスに変換する。
export async function handleApi(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    throw new ApiError(401, "ログインが必要です");
  }
  return userId;
}

export async function requireTeamMembership(teamId: string, userId: string) {
  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!membership) {
    throw new ApiError(403, "このチームのメンバーではありません");
  }
  return membership;
}

export async function requireTeamAdmin(teamId: string, userId: string) {
  const membership = await requireTeamMembership(teamId, userId);
  if (membership.role !== "ADMIN") {
    throw new ApiError(403, "このチームの管理者のみ実行できます");
  }
  return membership;
}

export async function requireProjectMembership(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    throw new ApiError(403, "このプロジェクトのメンバーではありません");
  }
  return membership;
}

// リクエストボディをJSONとして読み取る。不正なJSONは400として扱う。
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new Error("not an object");
    }
    return body as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "リクエストボディがJSON形式ではありません");
  }
}

export function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${fieldName}は必須です`);
  }
  return value;
}

export function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName}は文字列で指定してください`);
  }
  return value;
}

export function optionalStringArray(value: unknown, fieldName: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new ApiError(400, `${fieldName}は文字列の配列で指定してください`);
  }
  return value;
}
