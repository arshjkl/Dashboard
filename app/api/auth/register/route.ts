import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamRegistrationSchema } from "@/lib/validation";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const parsed =
      teamRegistrationSchema.safeParse(
        body
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide a valid team name, owner name and manager name.",
          details:
            parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      teamName,
      ownerName,
      managerName,
    } = parsed.data;

    /*
     * Generate the initial dashboard slug.
     *
     * The user can customize this later
     * from Team Settings.
     */
    const baseSlug =
      teamName
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .slice(0, 30);

    let slug =
      baseSlug || "team";

    let suffix = 1;

    while (
      await db.team.findUnique({
        where: {
          slug,
        },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    /*
     * Create only the Team and default
     * channels.
     *
     * Admin accounts will be configured
     * immediately after this step.
     */
    const team =
      await db.team.create({
        data: {
          name:
            teamName.trim(),

          slug,

          channels: {
            create: [
              {
                name:
                  "general",

                slug:
                  "general",

                
              },

              {
                name:
                  "players-only",

                slug:
                  "players-only",

              
              },

              {
                name:
                  "strategy-management",

                slug:
                  "strategy-management",

              
              },
            ],
          },
        },

        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

    /*
     * We intentionally do not create the
     * Owner/Manager User records yet because
     * we don't have their login credentials.
     *
     * The names are returned to the setup step.
     */
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

        setup: {
          ownerName:
            ownerName.trim(),

          managerName:
            managerName.trim(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Team registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create the team.",
      },
      {
        status: 500,
      }
    );
  }
}