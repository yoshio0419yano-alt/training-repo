import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handleApi,
  requireUserId,
  requireTeamAdmin,
  readJsonBody,
  requireNonEmptyString,
  optionalString,
} from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  return handleApi(async () => {
    const userId = await requireUserId();

    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) throw new ApiError(404, "チームが見つかりません");

    await requireTeamAdmin(params.teamId, userId);

    const body = await readJsonBody(request);
    const targetUserId = requireNonEmptyString(body.userId, "userId");
    const roleInput = optionalString(body.role, "role");
    let role: "ADMIN" | "MEMBER" = "MEMBER";
    if (roleInput !== undefined) {
      if (roleInput !== "ADMIN" && roleInput !== "MEMBER") {
        throw new ApiError(400, "roleはADMINまたはMEMBERで指定してください");
      }
      role = roleInput;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new ApiError(404, "指定されたユーザーが見つかりません");

    const existingMembership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId: targetUserId } },
    });
    if (existingMembership) throw new ApiError(409, "既にこのチームのメンバーです");

    const membership = await prisma.teamMembership.create({
      data: { teamId: params.teamId, userId: targetUserId, role },
    });

    return NextResponse.json(
      { userId: membership.userId, role: membership.role, createdAt: membership.createdAt },
      { status: 201 }
    );
  });
}
