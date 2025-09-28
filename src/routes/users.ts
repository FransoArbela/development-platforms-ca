import { Router } from "express";
import { type ResultSetHeader } from "mysql2";
import { pool } from "../database.js";
import type { Article, User, UserResponse } from "../interfaces.js";
import {
  validateUserId,
  validateRequiredUserData,
  validatePartialUserData,
} from "../middleware/user-validation.js";
import { authenticateToken } from "../middleware/auth-validation.js";

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Failed to retrieve users
 */
router.get("/", async (req, res) => {
  try {
    const [users] = (await pool.execute(
      "SELECT id, username, email FROM users"
    )) as [UserResponse[], unknown];
    res.json(users);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to retrieve users",
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 */
router.get("/:id", validateUserId, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const [rows] = await pool.execute(
      "SELECT id, username, email FROM users WHERE id = ?",
      [userId]
    );

    const user = rows as UserResponse[];
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to update user",
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user completely
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 */
router.put(
  "/:id",
  authenticateToken,
  validateUserId,
  validateRequiredUserData,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { username, email } = req.body;

      const [result]: [ResultSetHeader, any] = await pool.execute(
        "UPDATE users SET username = ?, email = ? WHERE id = ?",
        [username, email, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const user: UserResponse = { id: userId, username, email };
      res.json(user);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        error: "Failed to update user",
      });
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Partially update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID or no valid fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 */
router.patch(
  "/:id",
  authenticateToken,
  validateUserId,
  validatePartialUserData,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { username, email } = req.body;

      if (req.user!.id !== userId) {
        return res
          .status(403)
          .json({ error: "Forbidden: You can only update your own profile" });
      }

      const fieldsToUpdate = [];
      const values = [];

      if (username) {
        fieldsToUpdate.push("username = ?");
        values.push(username);
      }

      if (email) {
        fieldsToUpdate.push("email = ?");
        values.push(email);
      }

      if (fieldsToUpdate.length === 0) {
        return res.status(400).json({
          error: "No valid fields to update",
        });
      }

      values.push(userId);

      const [result]: [ResultSetHeader, any] = await pool.execute(
        `UPDATE users SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const user: UserResponse = { id: userId, username, email };
      res.json(user);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        error: "Failed to update user",
      });
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */
router.delete("/:id", authenticateToken, validateUserId, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const [result]: [ResultSetHeader, any] = await pool.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    if (result.affectedRows > 0) {
      return res.json({ message: "User deleted successfully" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to delete user",
    });
  }
});

/**
 * @swagger
 * /users/{id}/articles:
 *   get:
 *     summary: Get all articles for a user with user info
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of articles with user info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 */
router.get("/:id/articles", validateUserId, async (req, res) => {
  const userId = Number(req.params.id);

  const [rows] = await pool.execute(
    `
    SELECT articles.id, articles.title, articles.body, articles.submitted_by, articles.created_at, articles.category,
    users.username, users.email
    FROM articles 
    INNER JOIN users ON articles.submitted_by = users.id
    WHERE users.id = ?
  `,
    [userId]
  );
  const articles = rows as Article[];
  res.json(articles);
});

export default router;
