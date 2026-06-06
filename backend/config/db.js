/**
 * @file db.js
 * @description MongoDB Atlas connection configuration using Mongoose.
 * Provides a reusable async function to connect to the database,
 * with proper error handling and logging.
 */

const mongoose = require("mongoose");

/**
 * Establishes a connection to MongoDB Atlas.
 * Exits the process on connection failure to prevent the server from
 * running without a database.
 *
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are the recommended defaults for Mongoose 6+
      // They prevent deprecation warnings and ensure stable connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure code — the server cannot run without DB
    process.exit(1);
  }
};

// Listen for runtime connection errors after initial connection
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected.");
});

module.exports = connectDB;
