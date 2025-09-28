import express from "express";
import type { Response, Request, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRouter from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import articleRouter from "./routes/articles.js";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dev platforms API",
      version: "1.0.0",
      description: "A simple API for managing users and articles",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            email: { type: "string" },
          },
        },
        Article: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            content: { type: "string" },
            submitted_by: { type: "integer" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ArticleWithUser: {
          allOf: [
            { $ref: "#/components/schemas/Article" },
            {
              type: "object",
              properties: {
                username: { type: "string" },
                email: { type: "string" },
              },
            },
          ],
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
// Middleware
app.use(express.json());
app.use(cors());

// API routes
app.use("/users", usersRouter);
app.use("/articles", articleRouter);
app.use("/auth", authRoutes);

// API documentation endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// Basic route
app.get("/", (req, res) => {
  res.json("Hello World!");
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
