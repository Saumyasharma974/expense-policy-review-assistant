# Expense Claim Assistant

## Overview
Expense Claim Assistant is a full-stack, AI-powered internal tool designed for auditing and validating corporate expense claims. It merges deterministic policy rules with AI-driven compliance checks to automatically categorize expenses, identify policy violations, and extract clarification questions—ensuring human reviewers can make fast, informed decisions.

## Architecture
```text
React
  ↓
Express API
  ↓
Deterministic Rules
  ↓
LangGraph + Groq
  ↓
PostgreSQL
  ↓
Human Review
  ↓
Review History
```

## Features
- **Deterministic policy checks:** Validates dates, required fields, receipt attachments, and duplicates before invoking AI.
- **AI classification:** Categorizes claims dynamically based on context.
- **AI compliance assessment:** Evaluates complex policies against unstructured claim descriptions.
- **Policy evidence:** Maps AI decisions explicitly to source policies.
- **Uncertainty/missing information:** Flags ambiguous claims for clarification.
- **Human approval/rejection:** Requires authoritative human action for final decisions.
- **AI classification override:** Allows reviewers to correct the AI's category.
- **Audit history:** Append-only timeline tracking every automated and human decision.

## Local Setup

### 1. Install Dependencies
Ensure you have Node.js 18+ installed.
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```

### 3. Database Setup (Docker)
Start the PostgreSQL container, push the schema, and seed the database with demo claims:
```bash
npm run docker:up
npm run prisma:push -w backend
npm run prisma:seed -w backend
```

### 4. Start Development Servers
Start both the Vite frontend and Express backend concurrently:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/expense_db?schema=public` |
| `PORT` | Backend port | `3000` |
| `GROQ_API_KEY` | Groq API Key | `gsk_...` |
| `GROQ_MODEL` | Groq LLM Model ID | `openai/gpt-oss-20b` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `VITE_API_URL` | Frontend API Target | `http://localhost:3000/api` |

## Testing
The repository enforces strict typing and uses Vitest for backend business logic.
```bash
npm run typecheck
npm test
```

## Production Deployment

### Recommended Architecture
- **Frontend (Vite/React):** Vercel or Netlify.
- **Backend (Express Node.js):** Render or Railway.
- **Database (PostgreSQL):** Supabase, Neon, or Render PostgreSQL.
- **AI Inference:** Groq API.

### Deployment Steps
1. **Database:** Deploy your managed PostgreSQL instance. Note the connection URL.
2. **Backend:** Connect your repository to Render. Set the Build Command to `npm install && npm run build -w backend` and the Start Command to `npm start -w backend`. Set the Environment Variables (`DATABASE_URL`, `FRONTEND_URL`, `GROQ_API_KEY`, `GROQ_MODEL`).
3. **Database Migrations:** Run migrations against the production database: `npx prisma migrate deploy` (do **not** run seed in production).
4. **Frontend:** Connect your repository to Vercel. Set the Root Directory to `frontend`. Set the Build Command to `npm run build` and the Install Command to `npm install`. Set the Environment Variable `VITE_API_URL` to your Render backend URL.
