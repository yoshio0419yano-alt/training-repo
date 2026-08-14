import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handleApi,
  requireUserId,
  requireProjectMembership,
  requireTeamAdmin,
  readJsonBody,
  requireNonEmptyString,
  optionalString,
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

    return NextResponse.json({
      id: project.id,
      teamId: project.teamId,
      name: project.name,
      description: project.description,
      archivedAt: project.archivedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const existing = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!existing) throw new ApiError(404, "プロジェクトが見つかりません");

    await requireProjectMembership(params.projectId, userId);

    const body = await readJsonBody(request);
    const data: { name?: string; description?: string | null } = {};
    if (body.name !== undefined) {
      data.name = requireNonEmptyString(body.name, "name");
    }
    if (body.description !== undefined) {
      data.description =
        body.description === null ? null : optionalString(body.description, "description");
    }

    const project = await prisma.project.update({
      where: { id: params.projectId },
      data,
    });

    return NextResponse.json({
      id: project.id,
      teamId: project.teamId,
      name: project.name,
      description: project.description,
      archivedAt: project.archivedAt,
      updatedAt: project.updatedAt,
    });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const project = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!project) throw new ApiError(404, "プロジェクトが見つかりません");

    await requireTeamAdmin(project.teamId, userId);

    if (project.archivedAt) {
      throw new ApiError(409, "既にアーカイブ済みです");
    }

    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: { archivedAt: new Date() },
    });

    return NextResponse.json({ id: updated.id, archivedAt: updated.archivedAt });
  });
}
