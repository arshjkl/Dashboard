import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  createSession,
  verifyPassword,
  type UserRole,
} from "@/lib/auth";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const identifier =
      typeof body.identifier ===
      "string"
        ? body.identifier
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    if (
      !identifier ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Login ID and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Username is unique only inside a team,
     * so username alone cannot use findUnique.
     *
     * findFirst is intentional here.
     */
    let user =
      await db.user.findFirst({
        where: {
          username:
            identifier,
        },

        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          passwordHash: true,
          teamId: true,

          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },

          roles: {
            select: {
              role: true,
            },
          },

          memberProfile: {
            select: {
              id: true,
              name: true,
              ign: true,
              characterId: true,
              role: true,
              photoUrl: true,
              isMainPlayer: true,
              rosterOrder: true,
            },
          },
        },
      });

    /*
     * Email fallback.
     *
     * Useful for administrators and also
     * provides a convenient recovery path.
     */
    if (!user) {
      user =
        await db.user.findFirst({
          where: {
            email:
              identifier,
          },

          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            passwordHash: true,
            teamId: true,

            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },

            roles: {
              select: {
                role: true,
              },
            },

            memberProfile: {
              select: {
                id: true,
                name: true,
                ign: true,
                characterId: true,
                role: true,
                photoUrl: true,
                isMainPlayer: true,
                rosterOrder: true,
              },
            },
          },
        });
    }

    /*
     * Generic error prevents account enumeration.
     */
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid login ID or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordValid =
      await verifyPassword(
        password,
        user.passwordHash
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid login ID or password.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Extract all assigned roles.
     */
    const roles =
      user.roles.map(
        (assignment) =>
          assignment.role as UserRole
      );

    /*
     * A valid account must have at least
     * one role.
     */
    if (roles.length === 0) {
      console.error(
        "User has no assigned roles:",
        user.id
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "This account is not configured correctly.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Create JWT session containing the
     * complete role set.
     *
     * Example:
     *
     * ["PLAYER"]
     *
     * or:
     *
     * ["OWNER", "MANAGER"]
     */
    await createSession({
      userId:
        user.id,

      teamId:
        user.teamId,

      roles,
    });

    return NextResponse.json({
      success: true,

      user: {
        id:
          user.id,

        username:
          user.username,

        email:
          user.email,

        displayName:
          user.displayName,

        roles,

        memberProfile:
          user.memberProfile,
      },

      team:
        user.team,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to sign in. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}