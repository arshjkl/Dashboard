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

export async function GET() {
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

    const tournaments =
      await db.tournament.findMany({
        where: {
          teamId: session.teamId,
        },
        include: {
          rounds: {
            orderBy: {
              roundNumber: "asc",
            },
          },
        },
        orderBy: {
          startAt: "asc",
        },
      });

    const now = new Date();

    for (const tournament of tournaments) {
      if (tournament.status !== "QUALIFIED") {
        continue;
      }

      const rounds = Array.isArray(
        tournament.rounds
      )
        ? tournament.rounds
        : [];

      if (rounds.length === 0) {
        continue;
      }

      const latestRound =
        rounds[rounds.length - 1];

      const roundStart = new Date(
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
        threeDaysBefore.getDate() - 3
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

        tournament.status = "UPCOMING";
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

    if (!canManage(session.roles)) {
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
      typeof body.name === "string"
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

    const startAt =
      typeof body.startAt === "string"
        ? new Date(body.startAt)
        : null;

    const endAt =
      typeof body.endAt === "string" &&
      body.endAt.length > 0
        ? new Date(body.endAt)
        : null;

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
            "A valid start date and time are required.",
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
      typeof body.organizer === "string"
        ? body.organizer.trim() || null
        : null;

    const description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;

    const slotNumber =
      typeof body.slotNumber === "string"
        ? body.slotNumber.trim() || null
        : null;

    const pointSystem =
      typeof body.pointSystem === "string"
        ? body.pointSystem.trim() || null
        : null;

    const roomId =
      typeof body.roomId === "string"
        ? body.roomId.trim() || null
        : null;

    const roomPassword =
      typeof body.roomPassword === "string"
        ? body.roomPassword.trim() || null
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
                status: "UPCOMING",
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

          return tx.tournament.findUnique({
            where: {
              id: created.id,
            },
            include: {
              rounds: {
                orderBy: {
                  roundNumber: "asc",
                },
              },
            },
          });
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
