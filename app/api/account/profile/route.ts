import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getSession,
  hashPassword,
} from "@/lib/auth";

type TransferRole =
  | "OWNER"
  | "MANAGER";

type UpdateBody = {
  displayName?: string;
  username?: string;
  password?: string;

  transferRole?: TransferRole;
  targetUserId?: string;
};

function normalizeUsername(
  value: string
) {
  return value.trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        { status: 401 }
      );
    }

    const user =
      await db.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          teamId: true,

          roles: {
            select: {
              role: true,
            },
          },

          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        { status: 401 }
      );
    }

    const teamUsers =
      await db.user.findMany({
        where: {
          teamId: session.teamId,
        },
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
        orderBy: {
          displayName: "asc",
        },
      });

    return NextResponse.json({
      authenticated: true,

      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      },

      team: user.team,

      roles: user.roles.map(
        (assignment) =>
          assignment.role
      ),

      teamUsers: teamUsers.map(
        (member) => ({
          id: member.id,
          username: member.username,
          displayName:
            member.displayName,
          roles: member.roles.map(
            (assignment) =>
              assignment.role
          ),
        })
      ),
    });
  } catch (error) {
    console.error(
      "GET account profile error:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        error:
          "Unable to load profile.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as UpdateBody;

    const currentRoles =
      session.roles;

    const isOwner =
      currentRoles.includes("OWNER");

    const isManager =
      currentRoles.includes("MANAGER");

    /*
     * --------------------------------------------------
     * NORMAL PROFILE UPDATE
     * --------------------------------------------------
     */

    if (
      body.displayName !== undefined ||
      body.username !== undefined ||
      body.password !== undefined
    ) {
      const username =
        body.username !== undefined
          ? normalizeUsername(
              body.username
            )
          : undefined;

      if (
        username !== undefined &&
        username.length < 2
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Username must be at least 2 characters.",
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
            error:
              "Password must be at least 6 characters.",
          },
          { status: 400 }
        );
      }

      if (username) {
        const duplicate =
          await db.user.findFirst({
            where: {
              teamId: session.teamId,
              username,
              NOT: {
                id: session.userId,
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
              error:
                "That username is already in use.",
            },
            { status: 409 }
          );
        }
      }

      const passwordHash =
        body.password &&
        body.password.length > 0
          ? await hashPassword(
              body.password
            )
          : undefined;

      await db.user.update({
        where: {
          id: session.userId,
        },
        data: {
          ...(username
            ? { username }
            : {}),

          ...(body.displayName !==
          undefined
            ? {
                displayName:
                  body.displayName.trim(),
              }
            : {}),

          ...(passwordHash
            ? {
                passwordHash,
              }
            : {}),
        },
      });
    }

    /*
     * --------------------------------------------------
     * ROLE TRANSFER
     * --------------------------------------------------
     */

    if (body.transferRole) {
      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only the Owner can transfer team leadership roles.",
          },
          { status: 403 }
        );
      }

      if (!body.targetUserId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Select the person receiving the role.",
          },
          { status: 400 }
        );
      }

      if (
        body.targetUserId ===
        session.userId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You already have this role.",
          },
          { status: 400 }
        );
      }

      const target =
        await db.user.findFirst({
          where: {
            id: body.targetUserId,
            teamId: session.teamId,
          },
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        });

      if (!target) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Target team member not found.",
          },
          { status: 404 }
        );
      }

      /*
       * Exactly one Owner and exactly one Manager.
       *
       * Transfer means:
       * current holder loses role
       * target receives role
       */

      await db.$transaction(
        async (tx) => {
          await tx.userRoleAssignment.deleteMany(
            {
              where: {
                userId:
                  session.userId,
                teamId:
                  session.teamId,
                role:
                  body.transferRole,
              },
            }
          );

          await tx.userRoleAssignment.deleteMany(
            {
              where: {
                userId:
                  target.id,
                teamId:
                  session.teamId,
                role:
                  body.transferRole,
              },
            }
          );

          await tx.userRoleAssignment.create(
            {
              data: {
                userId:
                  target.id,
                teamId:
                  session.teamId,
                role:
                  body.transferRole!,
              },
            }
          );

          /*
           * Keep TeamMember administrator
           * records synchronized.
           */

          await tx.teamMember.updateMany(
            {
              where: {
                teamId:
                  session.teamId,
                role:
                  body.transferRole,
              },
              data: {
                role:
                  "PLAYER",
                isMainPlayer:
                  false,
                rosterOrder:
                  null,
              },
            }
          );

          await tx.teamMember.updateMany(
            {
              where: {
                teamId:
                  session.teamId,
                userId:
                  target.id,
              },
              data: {
                role:
                  body.transferRole,
              },
            }
          );

          await tx.teamMember.updateMany(
            {
              where: {
                teamId:
                  session.teamId,
                userId:
                  session.userId,
              },
              data: {
                role:
                  "PLAYER",
                isMainPlayer:
                  false,
                rosterOrder:
                  null,
              },
            }
          );
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        body.transferRole
          ? `${body.transferRole} transferred successfully.`
          : "Profile updated successfully.",
    });
  } catch (error) {
    console.error(
      "PATCH account profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update profile.",
      },
      { status: 500 }
    );
  }
}