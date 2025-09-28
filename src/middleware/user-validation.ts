import type { Response, Request, NextFunction } from "express";
import { pool } from "../database.js";
import type { User } from "../interfaces.js";

import { z } from "zod";
const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a positive number"),
});

const requiredUserDataSchema = z.object({
  username: z
    .string("Username must be a string")
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must not exceed 50 characters"),
  email: z.email("Email must be a valid email"),
});


const partialUserDataSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must not exceed 50 characters")
    .optional(),
  email: z.email("Email must be a valid email").optional(),
});

export function validateUserId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = userIdSchema.safeParse(req.params);
  if (!result.success) {
    return res.status(404).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }
  next();
}

export function validateRequiredUserData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = requiredUserDataSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }
  next();
}

export function validatePartialUserData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = partialUserDataSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }
  next();
}

// =============================================================
export async function validateExistingEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const email = req.body.email;
  const [existingUser] = (await pool.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  )) as [User[], unknown];

  if (existingUser.length > 0) {
    return res
      .status(409)
      .json({ error: "User with this email already exists" });
  }
  next();
}
