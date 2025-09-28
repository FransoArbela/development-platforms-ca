import { Router } from "express";
import { pool } from "../database.js";
import type { Article } from "../interfaces.js";
import { authenticateToken } from "../middleware/auth-validation.js";

export const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Article:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         body:
 *           type: string
 *         submitted_by:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         category:
 *           type: string
 *     CreateArticle:
 *       type: object
 *       required:
 *         - title
 *         - body
 *       properties:
 *         title:
 *           type: string
 *         body:
 *           type: string
 *         category:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Get all articles with user info
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: List of articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 *       500:
 *         description: Failed to fetch articles
 */
// get all articles with user info
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        articles.id,
        articles.title,
        articles.body,
        articles.submitted_by,
        articles.created_at,
        users.username,
        users.email,
        articles.category
      FROM articles 
      INNER JOIN users ON articles.submitted_by = users.id
      ORDER BY articles.created_at DESC
    `);

    const articles = rows as Article[];
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get single article by id with user info
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       404:
 *         description: Article not found
 *       500:
 *         description: Failed to fetch article
 */
// Get single article by id with user info
router.get("/:id", async (req, res) => {
  const articleId = req.params.id;
  console.log("Fetching article with ID:", articleId);
  try {
    const [rows] = await pool.execute(
      "SELECT articles.id, articles.title, articles.body, articles.submitted_by, articles.created_at, users.username, users.email, articles.category FROM articles INNER JOIN users ON articles.submitted_by = users.id WHERE articles.id = ? ",
      [articleId]
    );

    const article = (rows as Article[])[0];
    if (!article) {
      return res.status(404).json({ error: "article not found" });
    }
    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create new article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArticle'
 *     responses:
 *       201:
 *         description: Article created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 body:
 *                   type: string
 *                 submitted_by:
 *                   type: integer
 *                 category:
 *                   type: string
 *       400:
 *         description: Title and body are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create article
 */
// create new article
router.post("/", authenticateToken, async (req, res) => {
  const { title, body, category } = req.body;
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }
  try {
    const [result] = await pool.execute(
      "INSERT INTO articles (title, body, submitted_by, category) VALUES (?, ?, ?, ?)",
      [title, body, userId, category]
    );
    const insertId = (result as any).insertId;
    res
      .status(201)
      .json({ id: insertId, title, body, submitted_by: userId, category });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({ error: "Failed to create article" });
  }
});

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: Update article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArticle'
 *     responses:
 *       200:
 *         description: Article updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 body:
 *                   type: string
 *                 submitted_by:
 *                   type: integer
 *       400:
 *         description: Title and body are required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found or unauthorized
 *       500:
 *         description: Failed to update article
 */
// update article
router.put("/:id", authenticateToken, async (req, res) => {
  const articleId = req.params.id;
  const { title, body, category } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }
  try {
    const [result] = await pool.execute(
      "UPDATE articles SET title = ?, body = ? WHERE id = ? AND submitted_by = ?",
      [title, body, articleId, userId]
    );
    if ((result as any).affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Article not found or unauthorized" });
    }
    res.json({ id: articleId, title, body, submitted_by: userId });
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).json({ error: "Failed to update article" });
  }
});

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     responses:
 *       204:
 *         description: Article deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found or unauthorized
 *       500:
 *         description: Failed to delete article
 */
// delete article
router.delete("/:id", authenticateToken, async (req, res) => {
  const articleId = req.params.id;
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [result] = await pool.execute(
      "DELETE FROM articles WHERE id = ? AND submitted_by = ?",
      [articleId, userId]
    );
    if ((result as any).affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Article not found or unauthorized" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ error: "Failed to delete article" });
  }
});

export default router;
