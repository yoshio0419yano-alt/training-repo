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

export async function PATCH(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
    if (!comment) throw new ApiError(404, "コメントが見つかりません");

    const task = await prisma.task.findUnique({ where: { id: comment.taskId } });
    if (!task) throw new ApiError(404, "コメントが見つかりません");

    await requireProjectMembership(task.projectId, userId);

    const body = await readJsonBody(request);
    const commentBody = requireNonEmptyString(body.body, "body");

    const updated = await prisma.comment.update({
      where: { id: params.commentId },
      data: { body: commentBody },
    });

    return NextResponse.json({
      id: updated.id,
      body: updated.body,
      updatedAt: updated.updatedAt,
    });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { commentId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
    if (!comment) throw new ApiError(404, "コメントが見つかりません");

    const task = await prisma.task.findUnique({ where: { id: comment.taskId } });
    if (!task) throw new ApiError(404, "コメントが見つかりません");

    await requireProjectMembership(task.projectId, userId);

    await prisma.comment.delete({ where: { id: params.commentId } });

    return new NextResponse(null, { status: 204 });
  });
}
