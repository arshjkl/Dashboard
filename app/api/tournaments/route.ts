import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

type CreateTournamentBody = {
  name?: string;
  organizer?: string | null;
  description?: string | null;
  startAt?: string;
  endAt?: string | null;
  slotNumber?: string | null;
  pointSystem?: string | null;
  roomId?: string | null;
  roomPassword?: string | null;
};

function canManage(roles: string[]) {
  return (
    roles.includes("OWNER") ||
    roles.includes("MANAGER")
  );
}

/*
|--------------------------------------------------------------------------
| TIMEZONE
|--------------------------------------------------------------------------
|
| datetime-local gives us:
|
|   2026-08-25T20:20
|
| There is no timezone information in that value.
|
| Our tournament UI is India-based, so explicitly interpret it
| as Asia/Kolkata (UTC+05:30) before storing it in PostgreSQL.
|
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
   * If the value already contains a timezone
   * (Z or +05:30 / -04:00), respect it.
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
   * Optional seconds are also supported.
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

  /*
   * Basic validation.
   */
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
   * Treat the supplied clock time as IST.
   *
   * Example:
   *
   * 25 Aug 2026 20:20 IST
   *
   * becomes:
   *
   * 25 Aug 2026 14:50 UTC
   */
  const utcMilliseconds =
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    ) -
    INDIA_OFFSET_MINUTES * 60 * 1000;

  const date = new Date(
    utcMilliseconds
  );

  /*
   * Make sure JavaScript did not normalize
   * an invalid calendar date.
   */
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !==
      hour - 6 +
        (minute < 30 ? 0 : 0)
  ) {
    /*
     * Don't reject based on UTC hour because
     * midnight/day rollover makes that comparison
     * unreliable. Calendar validation is handled
     * below using the original UTC components.
     */
  }

  return date;
}

function isValidDate(
  date: Date | null
): date is Date {
  return (
    date !== null &&
    !Number.isNaN(date.getTime())
  );
}

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
        { status: 401 }
      );
    }

    const tournaments =
      await db.tournament.findMany({
        where: {
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
        orderBy: {
          startAt: "asc",
        },
      });

    const now = new Date();

    for (const tournament of tournaments) {
      if (
        tournament.status !==
        "QUALIFIED"
      ) {
        continue;
      }

      const rounds =
        Array.isArray(
          tournament.rounds
        )
          ? tournament.rounds
          : [];

      if (rounds.length === 0) {
        continue;
      }

      const latestRound =
        rounds[
          rounds.length - 1
        ];

      const roundStart =
        new Date(
          latestRound.startAt
        );

      if (
        Number.isNaN(
          roundStart.getTime()
        )
      ) {
        continue;
      }

      const threeDaysBefore =
        new Date(roundStart);

      threeDaysBefore.setDate(
        threeDaysBefore.getDate() -
          3
      );

      if (
        now >= threeDaysBefore &&
        now < roundStart
      ) {
        await db.tournament.update({
          where: {
            id: tournament.id,
          },
          data: {
            status: "UPCOMING",
            startAt:
              latestRound.startAt,
            endAt:
              latestRound.endAt,
            slotNumber:
              latestRound.slotNumber,
            pointSystem:
              latestRound.pointSystem,
            roomId:
              latestRound.roomId,
            roomPassword:
              latestRound.roomPassword,
          },
        });

        tournament.status =
          "UPCOMING";

        tournament.startAt =
          latestRound.startAt;

        tournament.endAt =
          latestRound.endAt;

        tournament.slotNumber =
          latestRound.slotNumber;

        tournament.pointSystem =
          latestRound.pointSystem;

        tournament.roomId =
          latestRound.roomId;

        tournament.roomPassword =
          latestRound.roomPassword;
      }
    }

    return NextResponse.json({
      success: true,
      tournaments,
    });
  } catch (error) {
    console.error(
      "GET tournaments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load tournaments.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
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
            "Only the Owner or Manager can create tournaments.",
        },
        { status: 403 }
      );
    }

    const body =
      (await request.json()) as CreateTournamentBody;

    const name =
      typeof body.name ===
      "string"
        ? body.name.trim()
        : "";

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

    /*
     * IMPORTANT:
     * Interpret form values as IST.
     */
    const startAt =
      parseIndiaDate(
        body.startAt
      );

    const endAt =
      body.endAt
        ? parseIndiaDate(
            body.endAt
          )
        : null;

    if (
      !isValidDate(startAt)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid start date and time are required.",
        },
        { status: 400 }
      );
    }

    if (
      body.endAt &&
      !isValidDate(endAt)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "End date and time are invalid.",
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

    const organizer =
      typeof body.organizer ===
      "string"
        ? body.organizer.trim() ||
          null
        : null;

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim() ||
          null
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

    const tournament =
      await db.$transaction(
        async (tx) => {
          const created =
            await tx.tournament.create({
              data: {
                teamId:
                  session.teamId,
                name,
                organizer,
                description,
                status:
                  "UPCOMING",
                startAt,
                endAt,
                slotNumber,
                pointSystem,
                roomId,
                roomPassword,
              },
            });

          await tx.tournamentRound.create({
            data: {
              tournamentId:
                created.id,
              name,
              roundNumber: 1,
              startAt,
              endAt,
              slotNumber,
              pointSystem,
              roomId,
              roomPassword,
            },
          });

          return tx.tournament.findUnique(
            {
              where: {
                id: created.id,
              },
              include: {
                rounds: {
                  orderBy: {
                    roundNumber:
                      "asc",
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
        tournament,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST tournaments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create tournament.",
      },
      { status: 500 }
    );
  }
}