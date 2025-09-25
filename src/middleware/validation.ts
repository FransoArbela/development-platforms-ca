import type { Response, Request, NextFunction } from "express";
import { pool } from "../database.js";
import type { User } from "../interfaces.js";


export function validateUserId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  next();
}

export function validateRequiredUserData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }
  next();
}

export function validatePartialUserData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { username, email } = req.body;
  if (!username && !email) {
    return res
      .status(400)
      .json({ error: "At least one of username or email is required" });
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

