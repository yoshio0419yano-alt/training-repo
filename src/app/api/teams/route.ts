import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApi, requireUserId, readJsonBody, requireNonEmptyString } from "@/lib/api";

export async function GET() {
  return handleApi(async () => {
    const userId = await requireUserId();

    const memberships = await prisma.teamMembership.findMany({
      where: { userId },
      include: { team: true },
      orderBy: { createdAt: "asc" },
    });

    const teams = memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      role: m.role,
      createdAt: m.team.createdAt,
    }));

    return NextResponse.json({ teams });
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const userId = await requireUserId();
    const body = await readJsonBody(request);
    const name = requireNonEmptyString(body.name, "name");

    const team = await prisma.team.create({
      data: {
        name,
        memberships: {
          create: { userId, role: "ADMIN" },
        },
      },
    });

    return NextResponse.json(
      { id: team.id, name: team.name, createdAt: team.createdAt },
      { status: 201 }
    );
  });
}
