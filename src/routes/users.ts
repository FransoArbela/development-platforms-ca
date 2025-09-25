import { Router } from "express";
import { type ResultSetHeader } from "mysql2";
import { pool } from "../database.js";
import type { Post, PostWithUser, User } from "../interfaces.js";
import {
  validatePartialUserData,
  validateRequiredUserData,
  validateUserId,
} from "../middleware/validation.js";

const router = Router();

/**
 * Get all users
 * @route GET /users
 * @returns {User[]} 200 - List of users
 * @returns {object} 500 - Failed to retrieve users
 */
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *         description: Failed to retrieve users
 */
router.get("/", async (req, res) => {
  try {
    const [users] = (await pool.execute("SELECT * FROM users")) as [
      User[],
      unknown
    ];
    res.json(users);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to retrieve users",
    });
  }
});

/**
 * Get user by ID
 * @route GET /users/:id
 * @param {number} id.path.required - User ID
 * @returns {User} 200 - User details
 * @returns {object} 400 - Invalid user ID
 * @returns {object} 404 - User not found
 * @returns {object} 500 - Failed to update user
 */
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
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

    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    const user = rows as User[];
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
 * Create a new user
 * @route POST /users
 * @body {string} username.body.required - Username
 * @body {string} email.body.required - Email
 * @returns {User} 201 - Created user
 * @returns {object} 500 - Failed to create user
 */
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
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
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Failed to create user
 */
router.post("/", validateRequiredUserData, async (req, res) => {
  const { username, email } = req.body;
  try {
    const [result] = (await pool.execute(
      "INSERT INTO users (username, email) VALUES (?, ?)",
      [username, email]
    )) as [ResultSetHeader, unknown];

    const newUser: User = {
      id: result.insertId,
      username,
      email,
    };

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({
      error: "Failed to create user",
    });
  }
});

/**
 * Update a user completely
 * @route PUT /users/:id
 * @param {number} id.path.required - User ID
 * @body {string} username.body.required - Username
 * @body {string} email.body.required - Email
 * @returns {User} 200 - Updated user
 * @returns {object} 400 - Invalid user ID
 * @returns {object} 404 - User not found
 * @returns {object} 500 - Failed to update user
 */
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user completely
 *     tags:
 *       - Users
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

      const user: User = { id: userId, username, email };
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
 * Partially update a user
 * @route PATCH /users/:id
 * @param {number} id.path.required - User ID
 * @body {string} [username] - Username
 * @body {string} [email] - Email
 * @returns {User} 200 - Updated user
 * @returns {object} 400 - Invalid user ID or no valid fields
 * @returns {object} 404 - User not found
 * @returns {object} 500 - Failed to update user
 */
/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Partially update a user
 *     tags:
 *       - Users
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
  validateUserId,
  validatePartialUserData,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { username, email } = req.body;

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

      const user: User = { id: userId, username, email };
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
 * Delete a user
 * @route DELETE /users/:id
 * @param {number} id.path.required - User ID
 * @returns {object} 200 - User deleted successfully
 * @returns {object} 404 - User not found
 * @returns {object} 500 - Failed to delete user
 */
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags:
 *       - Users
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
router.delete("/:id", validateUserId, async (req, res) => {
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
 * Get posts for a user
 * @route GET /users/:id/posts
 * @param {number} id.path.required - User ID
 * @returns {Post[]} 200 - List of posts
 * @returns {object} 500 - Failed to fetch user posts
 */
/**
 * @swagger
 * /users/{id}/posts:
 *   get:
 *     summary: Get posts for a user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Failed to fetch user posts
 */
router.get("/:id/posts", validateUserId, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const [rows] = await pool.execute(
      `
      SELECT 
        posts.id,
        posts.title,
        posts.content,
        posts.user_id,
        posts.created_at
      FROM posts 
      WHERE posts.user_id = ?
      ORDER BY posts.created_at DESC
    `,
      [userId]
    );

    const posts = rows as Post[];
    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

/**
 * Get posts for a user with user info
 * @route GET /users/:id/posts-with-user
 * @param {number} id.path.required - User ID
 * @returns {PostWithUser[]} 200 - List of posts with user info
 */
/**
 * @swagger
 * /users/{id}/posts-with-user:
 *   get:
 *     summary: Get posts for a user with user info
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of posts with user info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PostWithUser'
 */
router.get("/:id/posts-with-user", validateUserId, async (req, res) => {
  const userId = Number(req.params.id);

  const [rows] = await pool.execute(
    `
    SELECT posts.id, posts.title, posts.content, posts.user_id, posts.created_at,
    users.username, users.email
    FROM posts 
    INNER JOIN users ON posts.user_id = users.id
    WHERE users.id = ?
  `,
    [userId]
  );

  const posts = rows as PostWithUser[];
  res.json(posts);
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", async (req, res) => {
  // code
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 */
router.get("/:id", validateUserId, async (req, res) => {
  // code
});

export default router;
