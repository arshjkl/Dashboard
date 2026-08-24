import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  createSession,
  hashPassword,
} from "@/lib/auth";
import {
  adminAccountSchema,
} from "@/lib/validation";

type SetupBody = {
  teamId: string;

  ownerName: string;
  managerName: string;

  samePerson: boolean;

  owner: {
    username: string;
    email?: string;
    password: string;
  };

  manager?: {
    username: string;
    email?: string;
    password: string;
  };
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as SetupBody;

    /*
     * Basic request validation.
     */
    if (
      !body.teamId ||
      typeof body.teamId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.samePerson !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid account configuration.",
        },
        { status: 400 }
      );
    }

    const ownerName =
      body.ownerName?.trim();

    const managerName =
      body.managerName?.trim();

    if (
      !ownerName ||
      ownerName.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Owner name is required.",
        },
        { status: 400 }
      );
    }

    if (
      !managerName ||
      managerName.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Manager name is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate Owner credentials.
     */
    const ownerParsed =
      adminAccountSchema.safeParse(
        body.owner
      );

    if (!ownerParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Owner account details.",
          details:
            ownerParsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    /*
     * Validate Manager credentials
     * only when they are separate.
     */
    let managerParsed = null;

    if (!body.samePerson) {
      if (!body.manager) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Manager account details are required.",
          },
          { status: 400 }
        );
      }

      managerParsed =
        adminAccountSchema.safeParse(
          body.manager
        );

      if (!managerParsed.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid Manager account details.",
            details:
              managerParsed.error.flatten(),
          },
          { status: 400 }
        );
      }
    }

    /*
     * Normalize usernames.
     */
    const ownerUsername =
      ownerParsed.data.username
        .trim()
        .toLowerCase();

    const managerUsername =
      !body.samePerson &&
      managerParsed
        ? managerParsed.data.username
            .trim()
            .toLowerCase()
        : null;

    /*
     * Separate Owner and Manager must
     * have different usernames.
     */
    if (
      !body.samePerson &&
      managerUsername ===
        ownerUsername
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Owner and Manager must have different usernames.",
        },
        { status: 409 }
      );
    }

    /*
     * Find the team created during
     * registration.
     */
    const team =
      await db.team.findUnique({
        where: {
          id: body.teamId,
        },

        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Team does not exist.",
        },
        { status: 404 }
      );
    }

    /*
     * Check username conflicts inside
     * this team.
     */
    const usernames =
      body.samePerson
        ? [ownerUsername]
        : [
            ownerUsername,
            managerUsername!,
          ];

    const existingUsers =
      await db.user.findMany({
        where: {
          teamId: team.id,

          username: {
            in: usernames,
          },
        },

        select: {
          username: true,
        },
      });

    if (
      existingUsers.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One of these usernames is already in use.",
        },
        { status: 409 }
      );
    }

    /*
     * Hash passwords before transaction.
     */
    const ownerPasswordHash =
      await hashPassword(
        ownerParsed.data.password
      );

    const managerPasswordHash =
      !body.samePerson &&
      managerParsed
        ? await hashPassword(
            managerParsed.data.password
          )
        : null;

    /*
     * Create accounts, roles and team
     * profiles atomically.
     */
    const result =
      await db.$transaction(
        async (tx) => {
          /*
           * OWNER USER
           */
          const owner =
            await tx.user.create({
              data: {
                teamId:
                  team.id,

                username:
                  ownerUsername,

                email:
                  ownerParsed.data.email
                    ?.trim()
                    .toLowerCase() ||
                  null,

                passwordHash:
                  ownerPasswordHash,

                displayName:
                  ownerName,
              },
            });

          /*
           * OWNER ROLE
           */
          await tx.userRoleAssignment.create({
            data: {
              userId:
                owner.id,

              teamId:
                team.id,

              role:
                "OWNER",
            },
          });

          /*
           * SAME PERSON:
           *
           * One User
           * OWNER + MANAGER
           */
          if (body.samePerson) {
            await tx.userRoleAssignment.create({
              data: {
                userId:
                  owner.id,

                teamId:
                  team.id,

                role:
                  "MANAGER",
              },
            });

            await tx.teamMember.create({
              data: {
                teamId:
                  team.id,

                userId:
                  owner.id,

                name:
                  ownerName,

                role:
                  "OWNER",

                isMainPlayer:
                  false,
              },
            });

            return {
              userId:
                owner.id,

              roles: [
                "OWNER",
                "MANAGER",
              ] as const,
            };
          }

          /*
           * SEPARATE MANAGER
           */
          const manager =
            await tx.user.create({
              data: {
                teamId:
                  team.id,

                username:
                  managerUsername!,

                email:
                  managerParsed!.data.email
                    ?.trim()
                    .toLowerCase() ||
                  null,

                passwordHash:
                  managerPasswordHash!,

                displayName:
                  managerName,
              },
            });

          /*
           * MANAGER ROLE
           */
          await tx.userRoleAssignment.create({
            data: {
              userId:
                manager.id,

              teamId:
                team.id,

              role:
                "MANAGER",
            },
          });

          /*
           * Team profiles for both admins.
           */
          await tx.teamMember.createMany({
            data: [
              {
                teamId:
                  team.id,

                userId:
                  owner.id,

                name:
                  ownerName,

                role:
                  "OWNER",

                isMainPlayer:
                  false,
              },

              {
                teamId:
                  team.id,

                userId:
                  manager.id,

                name:
                  managerName,

                role:
                  "MANAGER",

                isMainPlayer:
                  false,
              },
            ],
          });

          return {
            userId:
              owner.id,

            roles: [
              "OWNER",
            ] as const,
          };
        }
      );

    /*
     * Automatically log the Owner in.
     */
    await createSession({
      userId:
        result.userId,

      teamId:
        team.id,

      roles: [
        ...result.roles,
      ],
    });

    return NextResponse.json(
      {
        success: true,

        team: {
          id:
            team.id,

          name:
            team.name,

          slug:
            team.slug,
        },

        roles:
          result.roles,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin setup error:",
      error
    );

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (
        error.code === "P2002"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A username is already in use.",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to configure administrator accounts.",
      },
      { status: 500 }
    );
  }
}