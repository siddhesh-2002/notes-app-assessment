/**
 * @file server.js
 * @description Entry point for the Notes Management API.
 *
 * Bootstraps Express, registers global middleware (security, parsing, CORS),
 * mounts API routes, and starts the HTTP server after a successful
 * MongoDB connection.
 */

// ── Environment ───────────────────────────────────────────────────────────────
require("dotenv").config();

// ── Core Dependencies ─────────────────────────────────────────────────────────
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// ── Internal Modules ──────────────────────────────────────────────────────────
const connectDB              = require("./config/db");
const noteRoutes             = require("./routes/noteRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ── App Initialisation ────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ───────────────────────────────────────────────────────
/**
 * helmet: sets security-related HTTP headers
 * (Content-Security-Policy, X-Frame-Options, HSTS, etc.)
 */
app.use(helmet());

/**
 * CORS: restrict which origins can call this API.
 * In development, allow all origins; in production, read from env.
 */
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim())
    : "*";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: process.env.NODE_ENV === "production",
  })
);

// ── Request Parsing ───────────────────────────────────────────────────────────
// Parse JSON request bodies (limit 10mb to prevent payload attacks)
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * express-mongo-sanitize: strip keys containing $ or . from req.body,
 * req.query, and req.params to prevent NoSQL injection attacks.
 */
app.use(mongoSanitize());

// ── Health Check ──────────────────────────────────────────────────────────────
/**
 * Simple health-check endpoint — useful for load balancers / uptime monitors.
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status:  "OK",
    message: "Notes API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/notes", noteRoutes);

// ── Root route ────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Notes Management API 📝",
    version: "1.0.0",
    docs: {
      health:  "GET  /health",
      notes:   "GET  /api/notes",
      search:  "GET  /api/notes/search?query=<term>",
      stats:   "GET  /api/notes/stats",
      create:  "POST /api/notes",
      single:  "GET  /api/notes/:id",
      update:  "PUT  /api/notes/:id",
      delete:  "DELETE /api/notes/:id",
      favorite:"PATCH /api/notes/:id/favorite",
      archive: "PATCH /api/notes/:id/archive",
    },
  });
});

// ── Error Handling (must be last) ─────────────────────────────────────────────
// Catch unknown routes → 404
app.use(notFound);

// Handle all errors forwarded by next(err)
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const startServer = async () => {
  // Connect to MongoDB Atlas first; exit on failure
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log("\n🚀 ========================================");
    console.log(`   Notes Management API`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   Server      : http://localhost:${PORT}`);
    console.log(`   API Base    : http://localhost:${PORT}/api/notes`);
    console.log("=========================================\n");
  });

  // ── Graceful Shutdown ────────────────────────────────────────────────────
  // Handle SIGTERM (e.g. from Docker / cloud platforms)
  process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      console.log("✅ HTTP server closed.");
      process.exit(0);
    });
  });

  // Handle SIGINT (Ctrl+C in terminal)
  process.on("SIGINT", () => {
    console.log("\n🛑 SIGINT received. Shutting down gracefully...");
    server.close(() => {
      console.log("✅ HTTP server closed.");
      process.exit(0);
    });
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("🔴 Unhandled Rejection at:", promise, "reason:", reason);
    server.close(() => process.exit(1));
  });
};

startServer();
