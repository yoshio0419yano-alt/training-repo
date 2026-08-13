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
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const project = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!project) throw new ApiError(404, "プロジェクトが見つかりません");

    await requireProjectMembership(params.projectId, userId);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam ? parseStatus(statusParam) : undefined;

    const tasks = await prisma.task.findMany({
      where: {
        projectId: params.projectId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        tags: t.tags,
        assigneeId: t.assigneeId,
        createdAt: t.createdAt,
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
    const title = requireNonEmptyString(body.title, "title");
    const description = optionalString(body.description, "description");
    const tags = optionalStringArray(body.tags, "tags") ?? [];
    const status = body.status !== undefined ? parseStatus(body.status) : "TODO";

    let assigneeId: string | undefined;
    if (body.assigneeId !== undefined && body.assigneeId !== null) {
      assigneeId = requireNonEmptyString(body.assigneeId, "assigneeId");
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: params.projectId, userId: assigneeId } },
      });
      if (!assigneeMembership) {
        throw new ApiError(400, "assigneeIdはこのプロジェクトのメンバーである必要があります");
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId: params.projectId,
        title,
        description,
        status,
        tags,
        assigneeId,
      },
    });

    return NextResponse.json(
      {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        tags: task.tags,
        assigneeId: task.assigneeId,
        createdAt: task.createdAt,
      },
      { status: 201 }
    );
  });
}
