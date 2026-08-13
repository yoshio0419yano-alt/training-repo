import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handleApi,
  requireUserId,
  requireTeamAdmin,
  readJsonBody,
  requireNonEmptyString,
} from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: { teamId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: { memberships: { include: { user: true } } },
    });
    if (!team) throw new ApiError(404, "チームが見つかりません");

    const isMember = team.memberships.some((m) => m.userId === userId);
    if (!isMember) throw new ApiError(403, "このチームのメンバーではありません");

    return NextResponse.json({
      id: team.id,
      name: team.name,
      createdAt: team.createdAt,
      members: team.memberships.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        role: m.role,
      })),
    });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const existing = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!existing) throw new ApiError(404, "チームが見つかりません");

    await requireTeamAdmin(params.teamId, userId);

    const body = await readJsonBody(request);
    const name = requireNonEmptyString(body.name, "name");

    const team = await prisma.team.update({
      where: { id: params.teamId },
      data: { name },
    });

    return NextResponse.json({ id: team.id, name: team.name, updatedAt: team.updatedAt });
  });
}
