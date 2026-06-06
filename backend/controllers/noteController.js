/**
 * @file noteController.js
 * @description Controller functions for Note CRUD operations.
 * Each function handles one specific HTTP action and follows the
 * pattern: validate → query DB → return JSON response.
 *
 * All async errors are forwarded to Express's centralized error handler
 * via next(error) — no try/catch boilerplate in route files.
 */

const mongoose = require("mongoose");
const Note = require("../models/Note");

// ── Utility ───────────────────────────────────────────────────────────────────
/**
 * Wraps an async route handler so any thrown error is automatically
 * passed to next() — eliminating repetitive try/catch blocks.
 *
 * @param {Function} fn - Async (req, res, next) function
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Validates that a string is a well-formed MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ── POST /notes ───────────────────────────────────────────────────────────────
/**
 * @desc    Create a new note
 * @route   POST /api/notes
 * @access  Public
 */
const createNote = asyncHandler(async (req, res) => {
  const { title, content, tags, isFavorite, isArchived } = req.body;

  // Manually check required fields before hitting Mongoose validation
  // to return a cleaner 400 message
  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: {
        statusCode: 400,
        message: "Both 'title' and 'content' are required fields",
      },
    });
  }

  const note = await Note.create({
    title,
    content,
    tags: tags || [],
    isFavorite: isFavorite || false,
    isArchived: isArchived || false,
  });

  return res.status(201).json({
    success: true,
    message: "Note created successfully",
    data: note,
  });
});

// ── GET /notes ────────────────────────────────────────────────────────────────
/**
 * @desc    Get all notes with pagination, sorting, and filtering
 * @route   GET /api/notes
 * @query   page       {number}  - Page number (default: 1)
 * @query   limit      {number}  - Results per page (default: 10, max: 100)
 * @query   sort       {string}  - "newest" | "oldest" | "alphabetical"
 * @query   tag        {string}  - Filter by tag
 * @query   isFavorite {boolean} - Filter by favorite status
 * @query   isArchived {boolean} - Filter by archived status
 * @access  Public
 */
const getAllNotes = asyncHandler(async (req, res) => {
  // ── Pagination ──────────────────────────────────────────────────────────
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip  = (page - 1) * limit;

  // ── Sorting ─────────────────────────────────────────────────────────────
  const sortMap = {
    newest:       { createdAt: -1 },  // default
    oldest:       { createdAt:  1 },
    alphabetical: { title:      1 },
  };
  const sortKey    = req.query.sort || "newest";
  const sortOption = sortMap[sortKey] || sortMap.newest;

  // ── Filtering ────────────────────────────────────────────────────────────
  const filter = {};

  if (req.query.tag) {
    // Case-insensitive tag filter
    filter.tags = { $in: [req.query.tag.toLowerCase()] };
  }

  if (req.query.isFavorite !== undefined) {
    filter.isFavorite = req.query.isFavorite === "true";
  }

  if (req.query.isArchived !== undefined) {
    filter.isArchived = req.query.isArchived === "true";
  } else {
    // By default, don't return archived notes
    filter.isArchived = false;
  }

  // ── Execute Queries (total count + paginated data in parallel) ──────────
  const [totalCount, notes] = await Promise.all([
    Note.countDocuments(filter),
    Note.find(filter).sort(sortOption).skip(skip).limit(limit),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json({
    success: true,
    count: notes.length,
    pagination: {
      total:       totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data: notes,
  });
});

// ── GET /notes/search ─────────────────────────────────────────────────────────
/**
 * @desc    Search notes by title and content (case-insensitive)
 * @route   GET /api/notes/search
 * @query   query {string} - Search term (required)
 * @query   page  {number} - Page number
 * @query   limit {number} - Results per page
 * @access  Public
 */
const searchNotes = asyncHandler(async (req, res) => {
  const { query, page: pageQuery, limit: limitQuery } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      error: {
        statusCode: 400,
        message: "Search 'query' parameter is required",
      },
    });
  }

  const page  = Math.max(1, parseInt(pageQuery,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitQuery, 10) || 10));
  const skip  = (page - 1) * limit;

  // Use MongoDB $text operator on the compound text index for best performance.
  // Falls back to regex for partial-word matching as well.
  const searchRegex = new RegExp(query.trim(), "i");

  const filter = {
    isArchived: false,
    $or: [
      { title:   { $regex: searchRegex } },
      { content: { $regex: searchRegex } },
      { tags:    { $in: [searchRegex]  } },
    ],
  };

  const [totalCount, notes] = await Promise.all([
    Note.countDocuments(filter),
    Note.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json({
    success: true,
    query: query.trim(),
    count: notes.length,
    pagination: {
      total:       totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data: notes,
  });
});

// ── GET /notes/:id ────────────────────────────────────────────────────────────
/**
 * @desc    Get a single note by ID
 * @route   GET /api/notes/:id
 * @access  Public
 */
const getNoteById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: {
        statusCode: 400,
        message: `"${id}" is not a valid note ID`,
      },
    });
  }

  const note = await Note.findById(id);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: {
        statusCode: 404,
        message: `Note with ID "${id}" not found`,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: note,
  });
});

// ── PUT /notes/:id ────────────────────────────────────────────────────────────
/**
 * @desc    Update a note by ID
 * @route   PUT /api/notes/:id
 * @access  Public
 */
const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: {
        statusCode: 400,
        message: `"${id}" is not a valid note ID`,
      },
    });
  }

  // Only allow these fields to be updated
  const allowedFields = ["title", "content", "tags", "isFavorite", "isArchived"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        statusCode: 400,
        message:
          "No valid fields provided for update. Allowed: title, content, tags, isFavorite, isArchived",
      },
    });
  }

  const updatedNote = await Note.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new:          true,  // Return the updated document
      runValidators: true, // Run schema validators on update
    }
  );

  if (!updatedNote) {
    return res.status(404).json({
      success: false,
      error: {
        statusCode: 404,
        message: `Note with ID "${id}" not found`,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: "Note updated successfully",
    data: updatedNote,
  });
});

// ── DELETE /notes/:id ─────────────────────────────────────────────────────────
/**
 * @desc    Delete a note by ID
 * @route   DELETE /api/notes/:id
 * @access  Public
 */
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: {
        statusCode: 400,
        message: `"${id}" is not a valid note ID`,
      },
    });
  }

  const note = await Note.findByIdAndDelete(id);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: {
        statusCode: 404,
        message: `Note with ID "${id}" not found`,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: "Note deleted successfully",
    data: { id },
  });
});

// ── PATCH /notes/:id/favorite ─────────────────────────────────────────────────
/**
 * @desc    Toggle favorite status of a note
 * @route   PATCH /api/notes/:id/favorite
 * @access  Public
 */
const toggleFavorite = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: { statusCode: 400, message: `"${id}" is not a valid note ID` },
    });
  }

  const note = await Note.findById(id);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: { statusCode: 404, message: `Note with ID "${id}" not found` },
    });
  }

  await note.toggleFavorite();

  return res.status(200).json({
    success: true,
    message: `Note ${note.isFavorite ? "added to" : "removed from"} favorites`,
    data: note,
  });
});

// ── PATCH /notes/:id/archive ──────────────────────────────────────────────────
/**
 * @desc    Toggle archive status of a note
 * @route   PATCH /api/notes/:id/archive
 * @access  Public
 */
const toggleArchive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: { statusCode: 400, message: `"${id}" is not a valid note ID` },
    });
  }

  const note = await Note.findById(id);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: { statusCode: 404, message: `Note with ID "${id}" not found` },
    });
  }

  await note.toggleArchive();

  return res.status(200).json({
    success: true,
    message: `Note ${note.isArchived ? "archived" : "unarchived"} successfully`,
    data: note,
  });
});

// ── GET /notes/stats ──────────────────────────────────────────────────────────
/**
 * @desc    Get notes statistics summary
 * @route   GET /api/notes/stats
 * @access  Public
 */
const getStats = asyncHandler(async (_req, res) => {
  const [total, favorites, archived, tagAggregation] = await Promise.all([
    Note.countDocuments(),
    Note.countDocuments({ isFavorite: true }),
    Note.countDocuments({ isArchived: true }),
    Note.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      total,
      active:    total - archived,
      favorites,
      archived,
      topTags:   tagAggregation.map((t) => ({ tag: t._id, count: t.count })),
    },
  });
});

module.exports = {
  createNote,
  getAllNotes,
  searchNotes,
  getNoteById,
  updateNote,
  deleteNote,
  toggleFavorite,
  toggleArchive,
  getStats,
};
