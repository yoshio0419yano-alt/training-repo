import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handleApi,
  requireUserId,
  requireTeamAdmin,
  requireTeamMembership,
  readJsonBody,
} from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: { teamId: string; userId: string } }
) {
  return handleApi(async () => {
    const currentUserId = await requireUserId();

    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId: params.userId } },
    });
    if (!membership) throw new ApiError(404, "指定されたメンバーが見つかりません");

    await requireTeamAdmin(params.teamId, currentUserId);

    const body = await readJsonBody(request);
    const role = body.role;
    if (role !== "ADMIN" && role !== "MEMBER") {
      throw new ApiError(400, "roleはADMINまたはMEMBERで指定してください");
    }

    const updated = await prisma.teamMembership.update({
      where: { teamId_userId: { teamId: params.teamId, userId: params.userId } },
      data: { role },
    });

    return NextResponse.json({ userId: updated.userId, role: updated.role });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { teamId: string; userId: string } }
) {
  return handleApi(async () => {
    const currentUserId = await requireUserId();

    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId: params.userId } },
    });
    if (!membership) throw new ApiError(404, "指定されたメンバーが見つかりません");

    const isSelfLeave = params.userId === currentUserId;
    if (isSelfLeave) {
      await requireTeamMembership(params.teamId, currentUserId);
    } else {
      await requireTeamAdmin(params.teamId, currentUserId);
    }

    if (membership.role === "ADMIN") {
      const adminCount = await prisma.teamMembership.count({
        where: { teamId: params.teamId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new ApiError(409, "チーム唯一の管理者を削除することはできません");
      }
    }

    await prisma.teamMembership.delete({
      where: { teamId_userId: { teamId: params.teamId, userId: params.userId } },
    });

    return new NextResponse(null, { status: 204 });
  });
}
