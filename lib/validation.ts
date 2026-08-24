import { z } from "zod";

export const teamRegistrationSchema =
  z.object({
    teamName: z
      .string()
      .trim()
      .min(
        2,
        "Team name must be at least 2 characters."
      )
      .max(
        80,
        "Team name cannot exceed 80 characters."
      ),

    ownerName: z
      .string()
      .trim()
      .min(
        2,
        "Owner name must be at least 2 characters."
      )
      .max(50),

    managerName: z
      .string()
      .trim()
      .min(
        2,
        "Manager name must be at least 2 characters."
      )
      .max(50),
  });

export const adminAccountSchema =
  z.object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Username can only contain letters, numbers, dots, underscores and hyphens."
      ),

    email: z
      .string()
      .trim()
      .email()
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(
        6,
        "Password must be at least 6 characters."
      )
      .max(100),
  });

export const playerSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(50),

    ign: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "IGN contains invalid characters."
      ),

    characterId: z
      .string()
      .trim()
      .max(50)
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(6)
      .max(100),
  });

export const staffSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(50),

    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Username contains invalid characters."
      ),

    email: z
      .string()
      .trim()
      .email()
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(6)
      .max(100),
  });