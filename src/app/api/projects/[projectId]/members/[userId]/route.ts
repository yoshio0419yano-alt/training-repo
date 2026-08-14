import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApi, requireUserId, requireProjectMembership } from "@/lib/api";

export async function DELETE(
  _request: Request,
  { params }: { params: { projectId: string; userId: string } }
) {
  return handleApi(async () => {
    const currentUserId = await requireUserId();

    const project = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!project) throw new ApiError(404, "プロジェクトが見つかりません");

    await requireProjectMembership(params.projectId, currentUserId);

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.projectId, userId: params.userId } },
    });
    if (!member) throw new ApiError(404, "指定されたメンバーが見つかりません");

    const assignedTaskCount = await prisma.task.count({
      where: { projectId: params.projectId, assigneeId: params.userId },
    });
    if (assignedTaskCount > 0) {
      throw new ApiError(
        409,
        "担当中のタスクが残っているため削除できません。先に担当を外してください"
      );
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: params.projectId, userId: params.userId } },
    });

    return new NextResponse(null, { status: 204 });
  });
}
