import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getSession,
  hashPassword,
} from "@/lib/auth";

type AppointExistingBody = {
  action: "appoint-existing";
  userId: string;
};

type CreateManagerBody = {
  action: "create";
  username: string;
  displayName: string;
  password: string;
};

type ResignBody = {
  action: "resign";
};

type RequestBody =
  | AppointExistingBody
  | CreateManagerBody
  | ResignBody;

async function getAuthenticatedSession() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return session;
}

async function requireOwner() {
  const session =
    await getAuthenticatedSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (!session.roles.includes("OWNER")) {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Only the Owner can appoint a Manager.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    response: null,
  };
}

/*
 * =========================================================
 * GET
 * =========================================================
 *
 * Returns the current Manager and all
 * team members who can potentially be
 * appointed.
 */

export async function GET() {
  try {
    const session =
      await getAuthenticatedSession();

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

    const manager =
      await db.user.findFirst({
        where: {
          teamId: session.teamId,
          roles: {
            some: {
              role: "MANAGER",
            },
          },
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
      });

    const members =
      await db.user.findMany({
        where: {
          teamId: session.teamId,
          id: {
            not: session.userId,
          },
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
      success: true,

      manager: manager
        ? {
            id: manager.id,
            username:
              manager.username,
            displayName:
              manager.displayName,
            roles: manager.roles.map(
              (assignment) =>
                assignment.role
            ),
          }
        : null,

      members: members.map(
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
      "GET manager error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load Manager information.",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * POST
 * =========================================================
 *
 * Owner can:
 *
 * 1. Appoint an existing team member.
 * 2. Create a brand-new Manager account.
 */

export async function POST(
  request: Request
) {
  try {
    const {
      session,
      response,
    } = await requireOwner();

    if (!session) {
      return response;
    }

    const body =
      (await request.json()) as RequestBody;

    /*
     * =======================================================
     * APPOINT EXISTING MEMBER
     * =======================================================
     */

    if (
      body.action ===
      "appoint-existing"
    ) {
      if (!body.userId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Select a team member.",
          },
          { status: 400 }
        );
      }

      if (
        body.userId ===
        session.userId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You are already the Owner.",
          },
          { status: 400 }
        );
      }

      const target =
        await db.user.findFirst({
          where: {
            id: body.userId,
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
        });

      if (!target) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Team member not found.",
          },
          { status: 404 }
        );
      }

      const alreadyManager =
        target.roles.some(
          (assignment) =>
            assignment.role ===
            "MANAGER"
        );

      if (alreadyManager) {
        /*
         * Make sure an older Manager assignment
         * is also mirrored onto TeamMember.
         */
        await db.teamMember.updateMany({
          where: {
            userId: target.id,
            teamId: session.teamId,
          },
          data: {
            role: "MANAGER",
          },
        });

        return NextResponse.json({
          success: true,
          message:
            `${target.displayName} is already a Manager.`,
          manager: {
            id: target.id,
            username:
              target.username,
            displayName:
              target.displayName,
          },
        });
      }

      /*
       * IMPORTANT
       *
       * Keep the administrative role and the
       * roster role synchronized.
       *
       * The Manager API uses UserRoleAssignment.
       * The roster API reads TeamMember.
       */
      await db.$transaction(
        async (tx) => {
          /*
           * Administrative Manager role.
           */
          await tx.userRoleAssignment.create(
            {
              data: {
                userId: target.id,
                teamId:
                  session.teamId,
                role: "MANAGER",
              },
            }
          );

          /*
           * Mirror Manager role into TeamMember.
           */
          const teamMember =
            await tx.teamMember.findFirst(
              {
                where: {
                  userId: target.id,
                  teamId:
                    session.teamId,
                },
              }
            );

          if (teamMember) {
            await tx.teamMember.update({
              where: {
                id: teamMember.id,
              },
              data: {
                role: "MANAGER",
              },
            });
          }
        }
      );

      return NextResponse.json({
        success: true,

        message:
          `${target.displayName} has been appointed Manager.`,

        manager: {
          id: target.id,
          username:
            target.username,
          displayName:
            target.displayName,
        },
      });
    }

    /*
     * =======================================================
     * CREATE NEW MANAGER ACCOUNT
     * =======================================================
     */

    if (
      body.action === "create"
    ) {
      const username =
        body.username
          .trim()
          .toLowerCase();

      const displayName =
        body.displayName.trim();

      const password =
        body.password;

      if (username.length < 2) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Username must be at least 2 characters.",
          },
          { status: 400 }
        );
      }

      if (displayName.length < 2) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Display name must be at least 2 characters.",
          },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Password must be at least 6 characters.",
          },
          { status: 400 }
        );
      }

      const existingUser =
        await db.user.findFirst({
          where: {
            teamId: session.teamId,
            username,
          },
          select: {
            id: true,
          },
        });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error:
              "That username is already in use.",
          },
          { status: 409 }
        );
      }

      const passwordHash =
        await hashPassword(
          password
        );

      const result =
        await db.$transaction(
          async (tx) => {
            const user =
              await tx.user.create({
                data: {
                  username,
                  displayName,
                  passwordHash,
                  teamId:
                    session.teamId,
                },
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              });

            /*
             * Administrative Manager role.
             */
            await tx.userRoleAssignment.create(
              {
                data: {
                  userId: user.id,
                  teamId:
                    session.teamId,
                  role: "MANAGER",
                },
              }
            );

            /*
             * Create the corresponding TeamMember
             * so the Manager also appears in the roster.
             *
             * Only create if your schema allows TeamMember
             * records to be created with these fields.
             */
            await tx.teamMember.create({
              data: {
                userId: user.id,
                teamId: session.teamId,
                name: user.displayName,
                role: "MANAGER",
              },
            });

            return user;
          }
        );

      return NextResponse.json({
        success: true,

        message:
          `${result.displayName} has been created and appointed Manager.`,

        manager: result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unsupported Manager action.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "POST manager error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to appoint Manager.",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * DELETE
 * =========================================================
 *
 * Current Manager resigns.
 *
 * Owner remains Owner if the same
 * account has both roles.
 */

export async function DELETE() {
  try {
    const session =
      await getAuthenticatedSession();

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

    const isManager =
      session.roles.includes(
        "MANAGER"
      );

    if (!isManager) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not the current Manager.",
        },
        { status: 403 }
      );
    }

    await db.$transaction(
      async (tx) => {
        /*
         * Remove Manager role.
         */
        await tx.userRoleAssignment.deleteMany(
          {
            where: {
              userId:
                session.userId,
              teamId:
                session.teamId,
              role: "MANAGER",
            },
          }
        );

        /*
         * Restore roster member to PLAYER.
         *
         * Owner role remains untouched.
         */
        await tx.teamMember.updateMany({
          where: {
            userId:
              session.userId,
            teamId:
              session.teamId,
            role: "MANAGER",
          },
          data: {
            role: "PLAYER",
          },
        });
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "You have resigned as Manager. You remain an Owner if you hold the Owner role.",
    });
  } catch (error) {
    console.error(
      "DELETE manager error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to resign as Manager.",
      },
      { status: 500 }
    );
  }
}