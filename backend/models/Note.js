/**
 * @file Note.js
 * @description Mongoose schema and model for Note documents.
 * Includes timestamps, tags, favorite/archive flags,
 * and a text index for full-text search.
 */

const mongoose = require("mongoose");

/**
 * @typedef {Object} Note
 * @property {string}   title       - The note's title (required)
 * @property {string}   content     - The note's main content (required)
 * @property {string[]} tags        - Array of tags for categorisation
 * @property {boolean}  isFavorite  - Whether the note is marked as favourite
 * @property {boolean}  isArchived  - Whether the note has been archived
 * @property {Date}     createdAt   - Auto-generated creation timestamp
 * @property {Date}     updatedAt   - Auto-updated modification timestamp
 */

const noteSchema = new mongoose.Schema(
  {
    // ── Core Fields ──────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title must be at least 1 character long"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [1, "Content must be at least 1 character long"],
      maxlength: [50000, "Content cannot exceed 50,000 characters"],
    },

    // ── Organisation Fields ───────────────────────────────────────────────────
    tags: {
      type: [String],
      default: [],
      // Trim and lowercase each tag for consistency
      set: (tags) =>
        tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
      validate: {
        validator: (tags) => tags.length <= 20,
        message: "A note cannot have more than 20 tags",
      },
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    // ── Schema Options ────────────────────────────────────────────────────────
    // Automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,

    // Remove __v version key from responses
    versionKey: false,

    // Transform document when converting to JSON (e.g., in API responses)
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Rename _id → id for cleaner API responses
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
// Compound text index enables fast full-text search across title and content.
// Title gets higher weight (10) than content (5) in relevance scoring.
noteSchema.index(
  { title: "text", content: "text" },
  { weights: { title: 10, content: 5 }, name: "notes_text_index" }
);

// Index on tags for fast tag-based filtering
noteSchema.index({ tags: 1 });

// Indexes for common query patterns
noteSchema.index({ isFavorite: 1, createdAt: -1 });
noteSchema.index({ isArchived: 1, createdAt: -1 });

// ── Instance Methods ─────────────────────────────────────────────────────────
/**
 * Toggles the isFavorite flag and saves the document.
 * @returns {Promise<Note>}
 */
noteSchema.methods.toggleFavorite = function () {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

/**
 * Toggles the isArchived flag and saves the document.
 * @returns {Promise<Note>}
 */
noteSchema.methods.toggleArchive = function () {
  this.isArchived = !this.isArchived;
  return this.save();
};

// ── Static Methods ────────────────────────────────────────────────────────────
/**
 * Returns the total count of notes in a collection.
 * @returns {Promise<number>}
 */
noteSchema.statics.getTotalCount = function () {
  return this.countDocuments();
};

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
