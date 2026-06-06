/**
 * @file noteRoutes.js
 * @description Express router for all Note endpoints.
 *
 * Route map:
 *   GET    /api/notes/stats        → getStats      (must precede /:id routes)
 *   GET    /api/notes/search       → searchNotes
 *   POST   /api/notes              → createNote
 *   GET    /api/notes              → getAllNotes
 *   GET    /api/notes/:id          → getNoteById
 *   PUT    /api/notes/:id          → updateNote
 *   DELETE /api/notes/:id          → deleteNote
 *   PATCH  /api/notes/:id/favorite → toggleFavorite
 *   PATCH  /api/notes/:id/archive  → toggleArchive
 */

const express = require("express");
const router  = express.Router();

const {
  createNote,
  getAllNotes,
  searchNotes,
  getNoteById,
  updateNote,
  deleteNote,
  toggleFavorite,
  toggleArchive,
  getStats,
} = require("../controllers/noteController");

// ── Static routes FIRST (before /:id to avoid being caught as an ID) ─────────
router.get("/stats",  getStats);
router.get("/search", searchNotes);

// ── Core CRUD ─────────────────────────────────────────────────────────────────
router.route("/")
  .get(getAllNotes)
  .post(createNote);

router.route("/:id")
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

// ── Toggle endpoints ──────────────────────────────────────────────────────────
router.patch("/:id/favorite", toggleFavorite);
router.patch("/:id/archive",  toggleArchive);

module.exports = router;
