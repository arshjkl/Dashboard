import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      }
    );
  }

  const user = await db.user.findUnique({
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

      memberProfile: {
        select: {
          id: true,
          name: true,
          ign: true,
          characterId: true,
          role: true,
          isMainPlayer: true,
          rosterOrder: true,
          photoUrl: true,
          competitiveRole: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      }
    );
  }

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

    memberProfile:
      user.memberProfile,
  });
}