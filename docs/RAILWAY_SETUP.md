# Railway Deployment Guide - PhysioMotion

This project is optimized for deployment on **Railway** using Node.js and PostgreSQL. Follow these steps to get the "real world" application live.

## 1. Provision Resources on Railway

1.  **New Project**: Create a new project on [Railway](https://railway.app/).
2.  **Add PostgreSQL**: Add a PostgreSQL service to your project.
3.  **Connect Repo**: Connect your GitHub repository (the one you pushed from here).

## 2. Environment Variables

In your Railway service settings, add the following variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your Railway PostgreSQL connection string (auto-filled if using Railway PG). |
| `JWT_SECRET` | A secure string (at least 32 characters) for auth tokens. |
| `GEMINI_API_KEY` | Your Google AI SDK key for biomechanical insights. |
| `ALLOWED_ORIGINS` | `https://your-app-url.up.railway.app,http://localhost:3000` |
| `PORT` | `3000` (Railway usually provides this). |

## 3. Database Schema Setup

You can now initialize your database automatically using the provided script:

1.  **Local Setup**: Add your Railway `DATABASE_URL` to your local `.env` file.
2.  **Run Initialization**: Execute `npm run init-db` in your terminal.
3.  **Manual Option (Backup)**: If you prefer manual setup, execute the contents of `database/schema.sql` and `database/seed.sql` in the Railway PostgreSQL Query editor.

## 4. Why Cloudflare was Removed

The application was previously built with Cloudflare-specific bindings (D1, R2, KV). These have been replaced with:
- **D1 → PostgreSQL**: Standard relational database.
- **R2 → Database Metadata**: Currently, video uploads save metadata to the DB. For binary storage, you can later integrate AWS S3 or a local persistent volume on Railway.
- **Workers → Hono Node Server**: Running as a standard Node.js process using `tsx`.

## 5. Deployment Command

Railway will automatically detect the `package.json` and use:
`npm start` (which runs `tsx index.ts`)

---
**Status**: The codebase is now "Pure Node.js" and ready for live production.
