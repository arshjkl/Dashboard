import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  getSession,
  isAdmin,
  hashPassword,
} from "@/lib/auth";

const REQUIRED_PLAYER_SLOTS = [
  1,
  2,
  3,
  4,
] as const;

type PlayerSlot = 1 | 2 | 3 | 4 | 5;

type CreateMemberBody = {
  role: "PLAYER" | "COACH" | "ANALYST";
  name: string;
  username?: string;
  ign?: string;
  characterId?: string;
  competitiveRole?: string;
  password?: string;
  photoUrl?: string;
  rosterOrder?: PlayerSlot;
};

type UpdateMemberBody = {
  name?: string;
  ign?: string | null;
  characterId?: string | null;
  competitiveRole?: string | null;
  password?: string;
  photoUrl?: string | null;
  rosterOrder?: PlayerSlot | null;
};

function normalizeUsername(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function isPlayerSlot(
  value: unknown
): value is PlayerSlot {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

async function requireAdminSession() {
  const session =
    await getSession();

  if (!session) {
    return {
      session: null,
      response:
        NextResponse.json(
          {
            success: false,
            error:
              "Authentication required.",
          },
          {
            status: 401,
          }
        ),
    };
  }

  if (!isAdmin(session)) {
    return {
      session: null,
      response:
        NextResponse.json(
          {
            success: false,
            error:
              "Only Owner or Manager can modify the roster.",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    session,
    response: null,
  };
}

/*
|--------------------------------------------------------------------------
| GET ROSTER
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const roster =
      await db.teamMember.findMany(
        {
          where: {
            teamId:
              session.teamId,
          },

          orderBy: [
            {
              isMainPlayer:
                "desc",
            },
            {
              rosterOrder:
                "asc",
            },
            {
              createdAt:
                "asc",
            },
          ],

          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName:
                  true,
              },
            },
          },
        }
      );

    const players =
      roster.filter(
        (member) =>
          member.role ===
          "PLAYER"
      );

    const coach =
      roster.find(
        (member) =>
          member.role ===
          "COACH"
      ) ?? null;

    const analyst =
      roster.find(
        (member) =>
          member.role ===
          "ANALYST"
      ) ?? null;

    const slots =
      [1, 2, 3, 4, 5].map(
        (slot) =>
          players.find(
            (player) =>
              player.rosterOrder ===
              slot
          ) ?? null
      );

    return NextResponse.json({
      success: true,

      roster,

      players,

      slots,

      coach,

      analyst,

      playerCount:
        players.length,

      requiredPlayers: 4,

      maxPlayers: 5,

      requiredPlayerCount: 4,

      maximumPlayerCount: 5,

      /*
       * Four main slots are the
       * standard competitive roster.
       *
       * This is NOT a minimum.
       *
       * A team can have 0–5 players.
       */
      rosterComplete:
        REQUIRED_PLAYER_SLOTS.every(
          (slot) =>
            slots[
              slot - 1
            ] !== null
        ),
    });
  } catch (error) {
    console.error(
      "GET roster error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load roster.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| ADD MEMBER
|--------------------------------------------------------------------------
*/

export async function POST(
  request: Request
) {
  try {
    const {
      session,
      response,
    } =
      await requireAdminSession();

    if (!session) {
      return response;
    }

    const body =
      (await request.json()) as CreateMemberBody;

    if (
      body.role !==
        "PLAYER" &&
      body.role !==
        "COACH" &&
      body.role !==
        "ANALYST"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid member role.",
        },
        {
          status: 400,
        }
      );
    }

    const name =
      body.name?.trim();

    if (
      !name ||
      name.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member name is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PLAYER
    |--------------------------------------------------------------------------
    */

    if (
      body.role ===
      "PLAYER"
    ) {
      const ign =
        body.ign?.trim();

      if (
        !ign ||
        ign.length < 2
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "IGN is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !body.password ||
        body.password.length < 6
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Player password must be at least 6 characters.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !isPlayerSlot(
          body.rosterOrder
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Select a roster slot from Player 1 to Player 5.",
          },
          {
            status: 400,
          }
        );
      }

      const slot =
        body.rosterOrder;

      const competitiveRole =
        body.competitiveRole
          ?.trim() || null;

      const occupied =
        await db.teamMember.findFirst(
          {
            where: {
              teamId:
                session.teamId,

              role: "PLAYER",

              rosterOrder:
                slot,
            },

            select: {
              id: true,
            },
          }
        );

      if (occupied) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Player ${slot} is already occupied.`,
          },
          {
            status: 409,
          }
        );
      }

      /*
       * IGN becomes the player's
       * username/login ID.
       */
      const username =
        normalizeUsername(
          ign
        );

      const existingUser =
        await db.user.findFirst(
          {
            where: {
              teamId:
                session.teamId,

              username,
            },

            select: {
              id: true,
            },
          }
        );

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This IGN is already being used as a login ID.",
          },
          {
            status: 409,
          }
        );
      }

      const existingIgn =
        await db.teamMember.findFirst(
          {
            where: {
              teamId:
                session.teamId,

              ign: {
                equals:
                  ign,

                mode:
                  "insensitive",
              },
            },

            select: {
              id: true,
            },
          }
        );

      if (existingIgn) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This IGN is already on the roster.",
          },
          {
            status: 409,
          }
        );
      }

      const passwordHash =
        await hashPassword(
          body.password
        );

      const member =
        await db.$transaction(
          async (tx) => {
            const user =
              await tx.user.create(
                {
                  data: {
                    teamId:
                      session.teamId,

                    username,

                    email:
                      null,

                    passwordHash,

                    displayName:
                      name,
                  },
                }
              );

            await tx.userRoleAssignment.create(
              {
                data: {
                  userId:
                    user.id,

                  teamId:
                    session.teamId,

                  role:
                    "PLAYER",
                },
              }
            );

            return tx.teamMember.create(
              {
                data: {
                  teamId:
                    session.teamId,

                  userId:
                    user.id,

                  name,

                  ign,

                  characterId:
                    body.characterId
                      ?.trim() ||
                    null,

                  competitiveRole,

                  role:
                    "PLAYER",

                  photoUrl:
                    body.photoUrl
                      ?.trim() ||
                    null,

                  isMainPlayer:
                    true,

                  rosterOrder:
                    slot,
                },

                include: {
                  user: {
                    select: {
                      id: true,
                      username:
                        true,
                      displayName:
                        true,
                    },
                  },
                },
              }
            );
          }
        );

      return NextResponse.json(
        {
          success: true,
          member,
        },
        {
          status: 201,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COACH / ANALYST
    |--------------------------------------------------------------------------
    */

    const username = normalizeUsername(
      body.username || ""
    );

    if (!username || username.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!body.password || body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existingStaff = await db.teamMember.findFirst({
      where: { teamId: session.teamId, role: body.role },
      select: { id: true },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: `The team already has a ${body.role.toLowerCase()}.` },
        { status: 409 }
      );
    }

    const existingUser = await db.user.findFirst({
      where: { teamId: session.teamId, username },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "That username is already in use." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(body.password);

    const member = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          teamId: session.teamId,
          username,
          email: null,
          passwordHash,
          displayName: name,
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          teamId: session.teamId,
          role: body.role,
        },
      });

      return tx.teamMember.create({
        data: {
          teamId: session.teamId,
          userId: user.id,
          name,
          role: body.role,
          isMainPlayer: false,
          rosterOrder: null,
          photoUrl: body.photoUrl?.trim() || null,
        },
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
      });
    });

    return NextResponse.json(
      { success: true, member },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST roster error:",
      error
    );

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (
        error.code ===
        "P2002"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A member or login with these details already exists.",
          },
          {
            status: 409,
          }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to add roster member.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE MEMBER
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: Request
) {
  try {
    const {
      session,
      response,
    } =
      await requireAdminSession();

    if (!session) {
      return response;
    }

    const url =
      new URL(request.url);

    const memberId =
      url.searchParams.get(
        "id"
      );

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as UpdateMemberBody;

    const existing =
      await db.teamMember.findFirst(
        {
          where: {
            id: memberId,

            teamId:
              session.teamId,
          },

          include: {
            user: true,
          },
        }
      );

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Roster member not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Administrator accounts are
     * managed separately.
     */
    if (
      existing.role ===
        "OWNER" ||
      existing.role ===
        "MANAGER"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator accounts must be managed separately.",
        },
        {
          status: 403,
        }
      );
    }

    const name =
      body.name !==
      undefined
        ? body.name.trim()
        : existing.name;

    if (
      !name ||
      name.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member name cannot be empty.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PLAYER UPDATE
    |--------------------------------------------------------------------------
    */

    if (
      existing.role ===
      "PLAYER"
    ) {
      const newIgn =
        body.ign !==
        undefined
          ? body.ign?.trim() ||
            null
          : existing.ign;

      if (!newIgn) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Player IGN cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      const newUsername =
        normalizeUsername(
          newIgn
        );

      const newCompetitiveRole =
        body.competitiveRole !==
        undefined
          ? body.competitiveRole
              ?.trim() ||
            null
          : existing.competitiveRole;

      if (
        existing.user &&
        existing.user.username !==
          newUsername
      ) {
        const duplicate =
          await db.user.findFirst(
            {
              where: {
                teamId:
                  session.teamId,

                username:
                  newUsername,

                NOT: {
                  id:
                    existing.user.id,
                },
              },

              select: {
                id: true,
              },
            }
          );

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              error:
                "That IGN is already being used as a login ID.",
            },
            {
              status: 409,
            }
          );
        }
      }

      if (
        body.rosterOrder !==
          undefined &&
        body.rosterOrder !==
          null &&
        !isPlayerSlot(
          body.rosterOrder
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Roster slot must be between 1 and 5.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        body.rosterOrder !==
          undefined &&
        body.rosterOrder !==
          null &&
        body.rosterOrder !==
          existing.rosterOrder
      ) {
        const occupied =
          await db.teamMember.findFirst(
            {
              where: {
                teamId:
                  session.teamId,

                role:
                  "PLAYER",

                rosterOrder:
                  body.rosterOrder,

                NOT: {
                  id:
                    memberId,
                },
              },

              select: {
                id: true,
              },
            }
          );

        if (occupied) {
          return NextResponse.json(
            {
              success: false,
              error:
                `Player ${body.rosterOrder} is already occupied.`,
            },
            {
              status: 409,
            }
          );
        }
      }

      if (
        body.password &&
        body.password.length < 6
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Password must be at least 6 characters.",
          },
          {
            status: 400,
          }
        );
      }

      const passwordHash =
        body.password
          ? await hashPassword(
              body.password
            )
          : undefined;

      const updated =
        await db.$transaction(
          async (tx) => {
            const member =
              await tx.teamMember.update(
                {
                  where: {
                    id:
                      memberId,
                  },

                  data: {
                    name,

                    ign:
                      newIgn,

                    characterId:
                      body.characterId !==
                      undefined
                        ? body.characterId
                            ?.trim() ||
                          null
                        : existing.characterId,

                    competitiveRole:
                      newCompetitiveRole,

                    photoUrl:
                      body.photoUrl !==
                      undefined
                        ? body.photoUrl
                            ?.trim() ||
                          null
                        : existing.photoUrl,

                    rosterOrder:
                      body.rosterOrder !==
                      undefined
                        ? body.rosterOrder
                        : existing.rosterOrder,
                  },
                }
              );

            if (
              existing.user
            ) {
              await tx.user.update(
                {
                  where: {
                    id:
                      existing.user.id,
                  },

                  data: {
                    username:
                      newUsername,

                    displayName:
                      name,

                    ...(passwordHash
                      ? {
                          passwordHash,
                        }
                      : {}),
                  },
                }
              );
            }

            return member;
          }
        );

      return NextResponse.json(
        {
          success: true,
          member: updated,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | STAFF UPDATE
    |--------------------------------------------------------------------------
    */

    const updated =
      await db.teamMember.update(
        {
          where: {
            id: memberId,
          },

          data: {
            name,

            photoUrl:
              body.photoUrl !==
              undefined
                ? body.photoUrl
                    ?.trim() ||
                  null
                : existing.photoUrl,
          },
        }
      );

    return NextResponse.json(
      {
        success: true,
        member: updated,
      }
    );
  } catch (error) {
    console.error(
      "PATCH roster error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update roster member.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE MEMBER
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: Request
) {
  try {
    const {
      session,
      response,
    } =
      await requireAdminSession();

    if (!session) {
      return response;
    }

    const url =
      new URL(request.url);

    const memberId =
      url.searchParams.get(
        "id"
      );

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Member ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const member =
      await db.teamMember.findFirst(
        {
          where: {
            id: memberId,

            teamId:
              session.teamId,
          },
        }
      );

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Roster member not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Nobody can remove themselves.
     */
    if (
      member.userId ===
      session.userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You cannot remove your own account.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Owner cannot be removed.
     */
    if (
      member.role ===
      "OWNER"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The Owner cannot be removed from the team.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Only Owner can remove Manager.
     */
    if (
      member.role ===
      "MANAGER"
    ) {
      const isOwner =
        session.roles.includes(
          "OWNER"
        );

      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only the Owner can remove a Manager.",
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
     * There is intentionally NO
     * minimum-player restriction.
     *
     * Team can have 0–5 players.
     */
    await db.$transaction(
      async (tx) => {
        await tx.teamMember.delete(
          {
            where: {
              id:
                member.id,
            },
          }
        );

        /*
         * Remove associated login
         * for Players/Managers.
         */
        if (
          member.userId
        ) {
          await tx.user.delete(
            {
              where: {
                id:
                  member.userId,
              },
            }
          );
        }
      }
    );

    return NextResponse.json({
      success: true,

      deletedId:
        member.id,

      message:
        `${member.name} was removed from the team.`,
    });
  } catch (error) {
    console.error(
      "DELETE roster error:",
      error
    );

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (
        error.code ===
        "P2025"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Member no longer exists.",
          },
          {
            status: 404,
          }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to remove roster member.",
      },
      {
        status: 500,
      }
    );
  }
}