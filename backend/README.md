# 📝 Notes Management System — REST API

A professional, production-ready RESTful API built with **Node.js**, **Express.js**, **MongoDB Atlas**, and **Mongoose**. Supports full CRUD, search, pagination, sorting, filtering, favorites, archiving, and stats.

---

## 🚀 Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Runtime       | Node.js ≥ 18                      |
| Framework     | Express.js 4.x                    |
| Database      | MongoDB Atlas                     |
| ODM           | Mongoose 8.x                      |
| Security      | Helmet, CORS, express-mongo-sanitize |
| Dev Tools     | Nodemon, dotenv                   |

---

## 📁 Folder Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB Atlas connection
├── controllers/
│   └── noteController.js      # Business logic for all routes
├── models/
│   └── Note.js                # Mongoose schema & model
├── routes/
│   └── noteRoutes.js          # Express router
├── middleware/
│   └── errorHandler.js        # Centralized error handling
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment template (safe to commit)
├── .gitignore
├── server.js                  # App entry point
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone / Download the project

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB Atlas connection string:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/notes_db?retryWrites=true&w=majority
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Get your MongoDB Atlas URI

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0 Sandbox)
3. Click **Connect → Connect your application**
4. Copy the connection string and paste it into `.env`
5. Replace `<password>` with your database user password

### 5. Run the server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

You should see:

```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📦 Database: notes_db

🚀 ========================================
   Notes Management API
   Environment : development
   Server      : http://localhost:5000
   API Base    : http://localhost:5000/api/notes
=========================================
```

---

## 📌 API Endpoints Reference

### Base URL
```
http://localhost:5000/api
```

---

### ✅ Create Note
**`POST /api/notes`**

```json
// Request Body
{
  "title": "React Hooks Guide",
  "content": "useState, useEffect, useContext...",
  "tags": ["react", "javascript"],
  "isFavorite": false
}

// Response 201
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "title": "React Hooks Guide",
    "content": "useState, useEffect, useContext...",
    "tags": ["react", "javascript"],
    "isFavorite": false,
    "isArchived": false,
    "createdAt": "2024-06-04T12:00:00.000Z",
    "updatedAt": "2024-06-04T12:00:00.000Z"
  }
}
```

---

### 📋 Get All Notes
**`GET /api/notes`**

Query Parameters:

| Param       | Type    | Default   | Description                              |
|-------------|---------|-----------|------------------------------------------|
| page        | number  | 1         | Page number                              |
| limit       | number  | 10        | Results per page (max 100)               |
| sort        | string  | newest    | `newest` \| `oldest` \| `alphabetical`   |
| tag         | string  | —         | Filter by tag                            |
| isFavorite  | boolean | —         | `true` \| `false`                        |
| isArchived  | boolean | false     | `true` \| `false`                        |

```
GET /api/notes?page=1&limit=5&sort=newest&tag=react
```

```json
// Response 200
{
  "success": true,
  "count": 5,
  "pagination": {
    "total": 23,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": [...]
}
```

---

### 🔍 Search Notes
**`GET /api/notes/search?query=react`**

- Searches both `title` and `content`
- Case-insensitive
- Supports pagination

```
GET /api/notes/search?query=hooks&page=1&limit=10
```

```json
// Response 200
{
  "success": true,
  "query": "hooks",
  "count": 3,
  "pagination": { ... },
  "data": [...]
}
```

---

### 🔎 Get Single Note
**`GET /api/notes/:id`**

```json
// Response 200
{
  "success": true,
  "data": { ... }
}

// Response 404
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Note with ID \"xyz\" not found"
  }
}
```

---

### ✏️ Update Note
**`PUT /api/notes/:id`**

```json
// Request Body (all fields optional)
{
  "title": "Updated Title",
  "content": "Updated content here",
  "tags": ["updated", "tag"],
  "isFavorite": true
}

// Response 200
{
  "success": true,
  "message": "Note updated successfully",
  "data": { ... }
}
```

---

### 🗑️ Delete Note
**`DELETE /api/notes/:id`**

```json
// Response 200
{
  "success": true,
  "message": "Note deleted successfully",
  "data": { "id": "665f1a2b3c4d5e6f7a8b9c0d" }
}
```

---

### ⭐ Toggle Favorite
**`PATCH /api/notes/:id/favorite`**

```json
// Response 200
{
  "success": true,
  "message": "Note added to favorites",
  "data": { ... }
}
```

---

### 📦 Toggle Archive
**`PATCH /api/notes/:id/archive`**

```json
// Response 200
{
  "success": true,
  "message": "Note archived successfully",
  "data": { ... }
}
```

---

### 📊 Get Statistics
**`GET /api/notes/stats`**

```json
// Response 200
{
  "success": true,
  "data": {
    "total": 42,
    "active": 38,
    "favorites": 7,
    "archived": 4,
    "topTags": [
      { "tag": "react", "count": 12 },
      { "tag": "javascript", "count": 9 }
    ]
  }
}
```

---

### 🏥 Health Check
**`GET /health`**

```json
{
  "success": true,
  "status": "OK",
  "message": "Notes API is running",
  "environment": "development",
  "timestamp": "2024-06-04T12:00:00.000Z"
}
```

---

## 🗂️ Note Schema

```js
{
  title:      String,   // required, max 200 chars
  content:    String,   // required, max 50,000 chars
  tags:       [String], // max 20 tags, auto-lowercased
  isFavorite: Boolean,  // default: false
  isArchived: Boolean,  // default: false
  createdAt:  Date,     // auto-generated
  updatedAt:  Date      // auto-updated
}
```

---

## ❌ Error Response Format

All errors follow this consistent structure:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Human-readable error description"
  }
}
```

| Status | Meaning                              |
|--------|--------------------------------------|
| 400    | Bad request / validation failure     |
| 404    | Resource not found                   |
| 409    | Conflict (duplicate key)             |
| 500    | Internal server error                |

---

## 🧪 Postman Testing Examples

### Import Collection (manual setup)

Create a new Postman Collection with these requests:

#### Environment Variables
```
base_url  = http://localhost:5000
note_id   = (fill after creating a note)
```

#### 1. Create Note
- Method: `POST`
- URL: `{{base_url}}/api/notes`
- Body (JSON):
```json
{
  "title": "My First Note",
  "content": "This is the content of my note",
  "tags": ["personal", "test"]
}
```

#### 2. Get All Notes
- Method: `GET`
- URL: `{{base_url}}/api/notes?page=1&limit=10&sort=newest`

#### 3. Search Notes
- Method: `GET`
- URL: `{{base_url}}/api/notes/search?query=first`

#### 4. Get Single Note
- Method: `GET`
- URL: `{{base_url}}/api/notes/{{note_id}}`

#### 5. Update Note
- Method: `PUT`
- URL: `{{base_url}}/api/notes/{{note_id}}`
- Body (JSON):
```json
{
  "title": "Updated Title",
  "content": "Updated content"
}
```

#### 6. Toggle Favorite
- Method: `PATCH`
- URL: `{{base_url}}/api/notes/{{note_id}}/favorite`

#### 7. Delete Note
- Method: `DELETE`
- URL: `{{base_url}}/api/notes/{{note_id}}`

---

## 🛡️ Security Features

- **Helmet** — Sets secure HTTP headers
- **CORS** — Restricts allowed origins in production
- **express-mongo-sanitize** — Prevents NoSQL injection attacks
- **Input validation** — Mongoose schema validators + manual checks
- **Environment variables** — Secrets kept out of codebase
- **Payload limits** — 10MB limit on JSON bodies
- **Graceful shutdown** — Handles SIGTERM / SIGINT cleanly

---

## 📦 Dependencies

```json
{
  "express":               "^4.19.2",
  "mongoose":              "^8.4.1",
  "dotenv":                "^16.4.5",
  "cors":                  "^2.8.5",
  "helmet":                "^7.1.0",
  "express-mongo-sanitize":"^2.2.0"
}
```

```json
{
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

---

## 🏁 Quick Start (Copy-Paste)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# → Edit .env with your MONGO_URI

# 3. Run
npm run dev

# 4. Test
curl http://localhost:5000/health
curl http://localhost:5000/api/notes
```
