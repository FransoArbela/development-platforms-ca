import { Router } from "express";
import bcrypt from "bcrypt";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../database.js";
import {
  validateRegistration,
  validateLogin,
} from "../middleware/auth-validation.js";
import type { User, UserResponse } from "../interfaces.js";
import { generateToken } from "../utils/jwt.js";

const router = Router();

router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    const existingUsers = rows as User[];

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user in database
    const [result]: [ResultSetHeader, any] = await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    // Return user info (without password)
    const userResponse: UserResponse = {
      id: result.insertId,
      username,
      email,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Failed to register user",
    });
  }
});

// User login
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const [rows] = await pool.execute(
      "SELECT id, username, email, password FROM users WHERE email = ?",
      [email]
    );
    const users = rows as User[];

    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = users[0];

    // Verify password using bcrypt


    const validPassword = await bcrypt.compare(password, user!.password!);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user!.id);

    // Return user info and token
    const userResponse: UserResponse = {
      id: user!.id,
      username: user!.username,
      email: user!.email,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Failed to log in",
    });
  }
});
export default router;
/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 * 
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: User already exists or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */