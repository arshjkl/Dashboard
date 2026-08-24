import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

type UpdateBody = {
  ign?: string;
  username?: string;
  characterId?: string | null;
  password?: string;
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const existing = await db.teamMember.findFirst({
      where: {
        userId: session.userId,
        teamId: session.teamId,
        role: "PLAYER",
      },
      include: {
        user: true,
      },
    });

    if (!existing || !existing.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Player profile not found.",
        },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateBody;

    const requestedIgn =
      body.ign !== undefined
        ? body.ign.trim()
        : existing.ign ?? existing.user.username;

    if (!requestedIgn || requestedIgn.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "IGN / username must be at least 2 characters.",
        },
        { status: 400 }
      );
    }

    const username = normalizeUsername(
      body.username !== undefined
        ? body.username
        : requestedIgn
    );

    if (username.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Username must be at least 2 characters.",
        },
        { status: 400 }
      );
    }

    if (
      body.password !== undefined &&
      body.password.length > 0 &&
      body.password.length < 6
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const duplicate = await db.user.findFirst({
      where: {
        teamId: session.teamId,
        username,
        NOT: {
          id: existing.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "That IGN / username is already in use.",
        },
        { status: 409 }
      );
    }

    const passwordHash =
      body.password && body.password.length > 0
        ? await hashPassword(body.password)
        : undefined;

    const userId = existing.user.id;
    const displayName = existing.user.displayName;

    const updated = await db.$transaction(async (tx) => {
      const member = await tx.teamMember.update({
        where: {
          id: existing.id,
        },
        data: {
          ign: requestedIgn,
          characterId:
            body.characterId !== undefined
              ? body.characterId?.trim() || null
              : existing.characterId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      });

      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          username,
          displayName,
          ...(passwordHash
            ? {
                passwordHash,
              }
            : {}),
        },
      });

      return member;
    });

    return NextResponse.json({
      success: true,
      member: updated,
    });
  } catch (error) {
    console.error("PATCH player profile error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update player profile.",
      },
      { status: 500 }
    );
  }
}