import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handleApi,
  requireUserId,
  requireProjectMembership,
  readJsonBody,
  requireNonEmptyString,
  optionalString,
  optionalStringArray,
} from "@/lib/api";

function parseStatus(value: unknown): "TODO" | "IN_PROGRESS" | "DONE" {
  if (value !== "TODO" && value !== "IN_PROGRESS" && value !== "DONE") {
    throw new ApiError(400, "statusはTODO、IN_PROGRESS、DONEのいずれかで指定してください");
  }
  return value;
}

export async function GET(
  _request: Request,
  { params }: { params: { taskId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: { _count: { select: { comments: true } } },
    });
    if (!task) throw new ApiError(404, "タスクが見つかりません");

    await requireProjectMembership(task.projectId, userId);

    return NextResponse.json({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      tags: task.tags,
      assigneeId: task.assigneeId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      commentCount: task._count.comments,
    });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const existing = await prisma.task.findUnique({ where: { id: params.taskId } });
    if (!existing) throw new ApiError(404, "タスクが見つかりません");

    await requireProjectMembership(existing.projectId, userId);

    const body = await readJsonBody(request);
    const data: {
      title?: string;
      description?: string | null;
      status?: "TODO" | "IN_PROGRESS" | "DONE";
      tags?: string[];
      assigneeId?: string | null;
    } = {};

    if (body.title !== undefined) {
      data.title = requireNonEmptyString(body.title, "title");
    }
    if (body.description !== undefined) {
      data.description =
        body.description === null ? null : optionalString(body.description, "description");
    }
    if (body.status !== undefined) {
      data.status = parseStatus(body.status);
    }
    if (body.tags !== undefined) {
      data.tags = optionalStringArray(body.tags, "tags") ?? [];
    }
    if (body.assigneeId !== undefined) {
      if (body.assigneeId === null) {
        data.assigneeId = null;
      } else {
        const assigneeId = requireNonEmptyString(body.assigneeId, "assigneeId");
        const assigneeMembership = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: existing.projectId, userId: assigneeId } },
        });
        if (!assigneeMembership) {
          throw new ApiError(400, "assigneeIdはこのプロジェクトのメンバーである必要があります");
        }
        data.assigneeId = assigneeId;
      }
    }

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data,
    });

    return NextResponse.json({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      tags: task.tags,
      assigneeId: task.assigneeId,
      updatedAt: task.updatedAt,
    });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { taskId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const task = await prisma.task.findUnique({ where: { id: params.taskId } });
    if (!task) throw new ApiError(404, "タスクが見つかりません");

    await requireProjectMembership(task.projectId, userId);

    await prisma.task.delete({ where: { id: params.taskId } });

    return new NextResponse(null, { status: 204 });
  });
}
