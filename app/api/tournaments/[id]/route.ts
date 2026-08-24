import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function canManage(roles: string[]) {
  return (
    roles.includes("OWNER") ||
    roles.includes("MANAGER")
  );
}

/*
 * Tournament form times are entered as
 * India Standard Time (Asia/Kolkata).
 *
 * Example:
 * 2026-08-25T20:20
 *
 * means:
 * 25 August 2026, 8:20 PM IST
 *
 * PostgreSQL stores the corresponding UTC instant.
 */

const INDIA_OFFSET_MINUTES = 330;

function parseIndiaDate(
  value: string | null | undefined
): Date | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const input = value.trim();

  /*
   * If a timezone is already included,
   * respect it.
   */
  if (
    /Z$/i.test(input) ||
    /[+-]\d{2}:\d{2}$/.test(input)
  ) {
    const date = new Date(input);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  /*
   * datetime-local format:
   *
   * YYYY-MM-DDTHH:mm
   *
   * Optional seconds are supported too.
   */
  const match = input.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(
    match[6] || "0"
  );

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  /*
   * Convert IST → UTC.
   *
   * 20:20 IST
   * - 5:30
   * = 14:50 UTC
   */
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    ) -
      INDIA_OFFSET_MINUTES *
        60 *
        1000
  );
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ================================================== */
/* GET SINGLE TOURNAMENT */
/* ================================================== */

export async function GET(
  request: Request,
  context: RouteContext
) {
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
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const tournament =
      await db.tournament.findFirst({
        where: {
          id,
          teamId:
            session.teamId,
        },
        include: {
          rounds: {
            orderBy: {
              roundNumber:
                "asc",
            },
          },
        },
      });

    if (!tournament) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tournament not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error(
      "GET tournament error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load tournament.",
      },
      { status: 500 }
    );
  }
}

/* ================================================== */
/* PATCH TOURNAMENT */
/* ================================================== */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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
        { status: 401 }
      );
    }

    if (
      !canManage(
        session.roles
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only the Owner or Manager can manage tournaments.",
        },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const existing =
      await db.tournament.findFirst({
        where: {
          id,
          teamId:
            session.teamId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tournament not found.",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    const action =
      body.action;

    /* ================================================ */
    /* MARK LIVE */
    /* ================================================ */

    if (action === "live") {
      const updated =
        await db.tournament.update({
          where: {
            id,
          },
          data: {
            status: "LIVE",
          },
          include: {
            rounds: {
              orderBy: {
                roundNumber:
                  "asc",
              },
            },
          },
        });

      return NextResponse.json({
        success: true,
        tournament:
          updated,
      });
    }

    /* ================================================ */
    /* COMPLETE */
    /* ================================================ */

    if (
      action === "complete"
    ) {
      const position =
        Number(
          body.finalPosition
        );

      const points =
        Number(
          body.totalPoints
        );

      if (
        !Number.isInteger(
          position
        ) ||
        position < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Final position must be a positive number.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isFinite(
          points
        ) ||
        points < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Total points must be zero or greater.",
          },
          { status: 400 }
        );
      }

      const updated =
        await db.tournament.update({
          where: {
            id,
          },
          data: {
            status:
              "COMPLETED",
            finalPosition:
              position,
            totalPoints:
              points,
          },
          include: {
            rounds: {
              orderBy: {
                roundNumber:
                  "asc",
              },
            },
          },
        });

      return NextResponse.json({
        success: true,
        tournament:
          updated,
      });
    }

    /* ================================================ */
    /* QUALIFY FOR NEXT ROUND */
    /* ================================================ */

    if (
      action === "qualify"
    ) {
      const roundName =
        typeof body.roundName ===
        "string"
          ? body.roundName.trim()
          : "";

      /*
       * IMPORTANT:
       * datetime-local values are interpreted
       * explicitly as IST.
       */
      const startAt =
        typeof body.startAt ===
        "string"
          ? parseIndiaDate(
              body.startAt
            )
          : null;

      const endAt =
        typeof body.endAt ===
          "string" &&
        body.endAt.length > 0
          ? parseIndiaDate(
              body.endAt
            )
          : null;

      const slotNumber =
        typeof body.slotNumber ===
        "string"
          ? body.slotNumber.trim() ||
            null
          : null;

      const pointSystem =
        typeof body.pointSystem ===
        "string"
          ? body.pointSystem.trim() ||
            null
          : null;

      const roomId =
        typeof body.roomId ===
        "string"
          ? body.roomId.trim() ||
            null
          : null;

      const roomPassword =
        typeof body.roomPassword ===
        "string"
          ? body.roomPassword.trim() ||
            null
          : null;

      if (!roundName) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Next round name is required.",
          },
          { status: 400 }
        );
      }

      if (
        !startAt ||
        Number.isNaN(
          startAt.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A valid next-round start date is required.",
          },
          { status: 400 }
        );
      }

      if (
        endAt &&
        Number.isNaN(
          endAt.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Next-round end date is invalid.",
          },
          { status: 400 }
        );
      }

      if (
        endAt &&
        endAt < startAt
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Next-round end date cannot be before its start date.",
          },
          { status: 400 }
        );
      }

      const lastRound =
        await db.tournamentRound.findFirst(
          {
            where: {
              tournamentId:
                id,
            },
            orderBy: {
              roundNumber:
                "desc",
            },
          }
        );

      const nextRoundNumber =
        (lastRound?.roundNumber ??
          0) + 1;

      const result =
        await db.$transaction(
          async (tx) => {
            const round =
              await tx.tournamentRound.create(
                {
                  data: {
                    tournamentId:
                      id,
                    name:
                      roundName,
                    roundNumber:
                      nextRoundNumber,
                    startAt,
                    endAt,
                    slotNumber,
                    pointSystem,
                    roomId,
                    roomPassword,
                  },
                }
              );

            const updated =
              await tx.tournament.update({
                where: {
                  id,
                },
                data: {
                  status:
                    "QUALIFIED",
                },
                include: {
                  rounds: {
                    orderBy: {
                      roundNumber:
                        "asc",
                    },
                  },
                },
              });

            return {
              tournament:
                updated,
              round,
            };
          }
        );

      return NextResponse.json({
        success: true,
        tournament:
          result.tournament,
        nextRound:
          result.round,
      });
    }

    /* ================================================ */
    /* EDIT */
/* ================================================ */

    if (action === "edit") {
      const name =
        typeof body.name ===
        "string"
          ? body.name.trim()
          : existing.name;

      const organizer =
        typeof body.organizer ===
        "string"
          ? body.organizer.trim() ||
            null
          : existing.organizer;

      const description =
        typeof body.description ===
        "string"
          ? body.description.trim() ||
            null
          : existing.description;

      /*
       * IMPORTANT:
       * datetime-local values are interpreted
       * explicitly as IST.
       */
      const startAt =
        typeof body.startAt ===
        "string"
          ? parseIndiaDate(
              body.startAt
            )
          : existing.startAt;

      const endAt =
        typeof body.endAt ===
        "string"
          ? body.endAt.length > 0
            ? parseIndiaDate(
                body.endAt
              )
            : null
          : existing.endAt;

      const slotNumber =
        typeof body.slotNumber ===
        "string"
          ? body.slotNumber.trim() ||
            null
          : existing.slotNumber;

      const pointSystem =
        typeof body.pointSystem ===
        "string"
          ? body.pointSystem.trim() ||
            null
          : existing.pointSystem;

      const roomId =
        typeof body.roomId ===
        "string"
          ? body.roomId.trim() ||
            null
          : existing.roomId;

      const roomPassword =
        typeof body.roomPassword ===
        "string"
          ? body.roomPassword.trim() ||
            null
          : existing.roomPassword;

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Tournament name is required.",
          },
          { status: 400 }
        );
      }

      if (
        !startAt ||
        Number.isNaN(
          startAt.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Start date is invalid.",
          },
          { status: 400 }
        );
      }

      if (
        endAt &&
        Number.isNaN(
          endAt.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "End date is invalid.",
          },
          { status: 400 }
        );
      }

      if (
        endAt &&
        endAt < startAt
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "End date cannot be before the start date.",
          },
          { status: 400 }
        );
      }

      const updated =
        await db.$transaction(
          async (tx) => {
            const tournament =
              await tx.tournament.update({
                where: {
                  id,
                },
                data: {
                  name,
                  organizer,
                  description,
                  startAt,
                  endAt,
                  slotNumber,
                  pointSystem,
                  roomId,
                  roomPassword,
                },
                include: {
                  rounds: {
                    orderBy: {
                      roundNumber:
                        "asc",
                    },
                  },
                },
              });

            return tournament;
          }
        );

      return NextResponse.json({
        success: true,
        tournament:
          updated,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unsupported tournament action.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "PATCH tournament error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update tournament.",
      },
      { status: 500 }
    );
  }
}

/* ================================================== */
/* DELETE TOURNAMENT */
/* ================================================== */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
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
        { status: 401 }
      );
    }

    if (
      !canManage(
        session.roles
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only the Owner or Manager can delete tournaments.",
        },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const existing =
      await db.tournament.findFirst({
        where: {
          id,
          teamId:
            session.teamId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tournament not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Delete is intentionally restricted
     * to completed tournaments.
     */
    if (
      existing.status !==
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only completed tournaments can be deleted.",
        },
        { status: 400 }
      );
    }

    await db.tournament.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Tournament deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE tournament error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to delete tournament.",
      },
      { status: 500 }
    );
  }
}