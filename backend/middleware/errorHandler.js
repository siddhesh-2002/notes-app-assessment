/**
 * @file errorHandler.js
 * @description Centralized error-handling middleware for Express.
 *
 * Intercepts errors thrown or passed via next(err) from any route handler,
 * normalises them into consistent JSON responses, and maps Mongoose/MongoDB
 * error types to meaningful HTTP status codes.
 */

const mongoose = require("mongoose");

// ── Helper: build the JSON error payload ─────────────────────────────────────
const buildErrorResponse = (statusCode, message, details = null) => {
  const payload = {
    success: false,
    error: {
      statusCode,
      message,
    },
  };
  // Attach extra details (e.g. validation field errors) only in development
  if (details && process.env.NODE_ENV === "development") {
    payload.error.details = details;
  }
  return payload;
};

// ── 404 handler — mount BEFORE the error handler ─────────────────────────────
/**
 * Catches requests to routes that don't exist and forwards a 404 error.
 * Must be registered after all valid routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// ── Main error handler ────────────────────────────────────────────────────────
/**
 * Express error-handling middleware (4-argument signature required).
 * Handles:
 *   • Mongoose ValidationError   → 400
 *   • Mongoose CastError (bad ID)→ 400
 *   • MongoDB duplicate key      → 409
 *   • Custom statusCode errors   → as set
 *   • Everything else            → 500
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full error in development for easier debugging
  if (process.env.NODE_ENV === "development") {
    console.error("🔴 Error:", {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
    });
  } else {
    // In production log only the message (no stack traces to stdout)
    console.error(`🔴 [${new Date().toISOString()}] ${err.message}`);
  }

  // ── Mongoose Validation Error (missing required fields, minlength, etc.) ──
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json(
        buildErrorResponse(
          400,
          "Validation failed: " + messages.join(". "),
          messages
        )
      );
  }

  // ── Mongoose CastError (invalid ObjectId format) ──────────────────────────
  if (err instanceof mongoose.Error.CastError && err.kind === "ObjectId") {
    return res
      .status(400)
      .json(
        buildErrorResponse(
          400,
          `Invalid ID format: "${err.value}" is not a valid MongoDB ObjectId`
        )
      );
  }

  // ── MongoDB Duplicate Key Error (e.g. unique index violation) ─────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res
      .status(409)
      .json(
        buildErrorResponse(
          409,
          `Duplicate value: a note with this ${field} already exists`
        )
      );
  }

  // ── Custom application errors (e.g. 404 thrown manually) ─────────────────
  if (err.statusCode) {
    return res
      .status(err.statusCode)
      .json(buildErrorResponse(err.statusCode, err.message));
  }

  // ── Fallback: 500 Internal Server Error ───────────────────────────────────
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : err.message || "Internal Server Error";

  return res.status(500).json(buildErrorResponse(500, message));
};

module.exports = { errorHandler, notFound };
