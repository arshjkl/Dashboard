import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getSession,
  requireOwner,
} from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const team = await db.team.findUnique({
      where: {
        id: session.teamId,
      },

      include: {
        members: {
          orderBy: [
            {
              isMainPlayer: "desc",
            },
            {
              rosterOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,

                roles: {
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },

        users: {
          select: {
            id: true,
            username: true,
            displayName: true,

            roles: {
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error: "Team not found.",
        },
        {
          status: 404,
        }
      );
    }

    const owner =
      team.users.find((user) =>
        user.roles.some(
          (role) => role.role === "OWNER"
        )
      ) ?? null;

    const manager =
      team.users.find((user) =>
        user.roles.some(
          (role) => role.role === "MANAGER"
        )
      ) ?? null;

    return NextResponse.json({
      success: true,

      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logoUrl: team.logoUrl,
        description: team.description,
      },

      owner,

      manager,

      roster: team.members,

      session: {
        userId: session.userId,
        roles: session.roles,
        isOwner: session.roles.includes("OWNER"),
      },
    });
  } catch (error) {
    console.error(
      "GET team profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load team profile.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    /*
     * Only the Owner can edit
     * the Team Profile.
     */
    const session = await requireOwner();

    const body = (await request.json()) as {
      name?: string;
      logoUrl?: string | null;
      description?: string | null;
    };

    const name = body.name?.trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Team name must contain at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const updated = await db.team.update({
      where: {
        id: session.teamId,
      },

      data: {
        name,

        logoUrl:
          body.logoUrl?.trim() || null,

        description:
          body.description?.trim() || null,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
      },
    });

    return NextResponse.json({
      success: true,
      team: updated,
    });
  } catch (error) {
    console.error(
      "PATCH team profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update team profile.",
      },
      {
        status: 500,
      }
    );
  }
}