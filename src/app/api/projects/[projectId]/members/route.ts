import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handleApi,
  requireUserId,
  requireProjectMembership,
  readJsonBody,
  requireNonEmptyString,
} from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const project = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!project) throw new ApiError(404, "プロジェクトが見つかりません");

    await requireProjectMembership(params.projectId, userId);

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.projectId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        image: m.user.image,
      })),
    });
  });
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const project = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!project) throw new ApiError(404, "プロジェクトが見つかりません");

    await requireProjectMembership(params.projectId, userId);

    const body = await readJsonBody(request);
    const targetUserId = requireNonEmptyString(body.userId, "userId");

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new ApiError(404, "指定されたユーザーが見つかりません");

    const teamMembership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId: targetUserId } },
    });
    if (!teamMembership) {
      throw new ApiError(
        403,
        "対象のユーザーはこのプロジェクトが属するチームのメンバーではありません"
      );
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.projectId, userId: targetUserId } },
    });
    if (existing) throw new ApiError(409, "既にこのプロジェクトのメンバーです");

    const member = await prisma.projectMember.create({
      data: { projectId: params.projectId, userId: targetUserId },
    });

    return NextResponse.json(
      { userId: member.userId, createdAt: member.createdAt },
      { status: 201 }
    );
  });
}
