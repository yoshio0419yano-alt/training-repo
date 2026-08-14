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
  { params }: { params: { taskId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const task = await prisma.task.findUnique({ where: { id: params.taskId } });
    if (!task) throw new ApiError(404, "タスクが見つかりません");

    await requireProjectMembership(task.projectId, userId);

    const comments = await prisma.comment.findMany({
      where: { taskId: params.taskId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        authorId: c.authorId,
        authorName: c.author.name,
        body: c.body,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  });
}

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const task = await prisma.task.findUnique({ where: { id: params.taskId } });
    if (!task) throw new ApiError(404, "タスクが見つかりません");

    await requireProjectMembership(task.projectId, userId);

    const body = await readJsonBody(request);
    const commentBody = requireNonEmptyString(body.body, "body");

    const comment = await prisma.comment.create({
      data: {
        taskId: params.taskId,
        authorId: userId,
        body: commentBody,
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        body: comment.body,
        createdAt: comment.createdAt,
      },
      { status: 201 }
    );
  });
}
