import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handleApi,
  requireUserId,
  requireTeamMembership,
  readJsonBody,
  requireNonEmptyString,
  optionalString,
} from "@/lib/api";

export async function GET(request: Request) {
  return handleApi(async () => {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId") ?? undefined;

    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId } },
        archivedAt: null,
        ...(teamId ? { teamId } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        teamId: p.teamId,
        name: p.name,
        description: p.description,
        archivedAt: p.archivedAt,
        createdAt: p.createdAt,
      })),
    });
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const userId = await requireUserId();
    const body = await readJsonBody(request);
    const teamId = requireNonEmptyString(body.teamId, "teamId");
    const name = requireNonEmptyString(body.name, "name");
    const description = optionalString(body.description, "description");

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new ApiError(404, "チームが見つかりません");

    await requireTeamMembership(teamId, userId);

    const project = await prisma.project.create({
      data: {
        teamId,
        name,
        description,
        members: { create: { userId } },
      },
    });

    return NextResponse.json(
      {
        id: project.id,
        teamId: project.teamId,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
      },
      { status: 201 }
    );
  });
}
