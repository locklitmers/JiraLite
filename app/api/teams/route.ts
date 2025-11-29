import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json([], { status: 401 });
  }

  const teams = await db.team.findMany({
    where: {
      members: {
        some: { userId: user.id },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}

