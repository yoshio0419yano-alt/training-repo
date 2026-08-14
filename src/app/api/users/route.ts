import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApi, requireUserId } from "@/lib/api";

export async function GET(request: Request) {
  return handleApi(async () => {
    await requireUserId();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      select: { id: true, name: true, email: true, image: true },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json({ users });
  });
}
