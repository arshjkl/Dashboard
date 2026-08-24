import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SESSION_COOKIE =
  "bgmi_session";

const authSecret =
  process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error(
    "AUTH_SECRET is not defined in the environment."
  );
}

const secret =
  new TextEncoder().encode(
    authSecret
  );

export const USER_ROLES = [
  "OWNER",
  "MANAGER",
  "PLAYER",
  "COACH",
  "ANALYST",
] as const;

export type UserRole =
  (typeof USER_ROLES)[number];

export type SessionPayload = {
  userId: string;
  teamId: string;
  roles: UserRole[];
};

export async function hashPassword(
  password: string
) {
  return bcrypt.hash(
    password,
    12
  );
}

export async function verifyPassword(
  password: string,
  passwordHash: string
) {
  return bcrypt.compare(
    password,
    passwordHash
  );
}

export async function createSession(
  payload: SessionPayload
) {
  const token =
    await new SignJWT({
      userId:
        payload.userId,

      teamId:
        payload.teamId,

      roles:
        payload.roles,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge:
        60 * 60 * 24 * 7,
    }
  );
}

export async function getSession(): Promise<
  SessionPayload | null
> {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        SESSION_COOKIE
      )?.value;

    if (!token) {
      return null;
    }

    const { payload } =
      await jwtVerify(
        token,
        secret
      );

    if (
      typeof payload.userId !==
        "string" ||
      typeof payload.teamId !==
        "string" ||
      !Array.isArray(
        payload.roles
      )
    ) {
      return null;
    }

    const roles =
      payload.roles.filter(
        (
          role
        ): role is UserRole =>
          typeof role ===
            "string" &&
          USER_ROLES.includes(
            role as UserRole
          )
      );

    if (
      roles.length === 0
    ) {
      return null;
    }

    return {
      userId:
        payload.userId,

      teamId:
        payload.teamId,

      roles,
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session =
    await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export function hasRole(
  session: SessionPayload,
  role: UserRole
) {
  return session.roles.includes(
    role
  );
}

export function isAdmin(
  session: SessionPayload
) {
  return (
    hasRole(
      session,
      "OWNER"
    ) ||
    hasRole(
      session,
      "MANAGER"
    )
  );
}

export async function requireAdmin() {
  const session =
    await requireSession();

  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireOwner() {
  const session =
    await requireSession();

  if (
    !hasRole(
      session,
      "OWNER"
    )
  ) {
    redirect("/dashboard");
  }

  return session;
}

export async function destroySession() {
  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    "",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge: 0,
    }
  );
}