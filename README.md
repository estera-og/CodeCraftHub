# CodeCraftHub - User Management Service

## User Management Service — Developer Guide

### Prerequisites
- Node 20
- MongoDB connection string
- Git and curl for local testing

### Configure
Create `.env` from `.env.example` and set:
- `MONGO_URI` e.g. `mongodb://root:<pass>@<host>:27017/userdb?authSource=admin`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`

### Install and run
```bash
npm install
npm run dev
# or: node src/config/server.js

## Project files

- `.env.example` — template of required environment variables with comments. Copy to `.env` and fill in for local runs.
- `.gitignore` — ignores environment files, dependencies, logs, and build artefacts. Keeps secrets out of Git.
- `package.json` — declares scripts and dependencies. See “Install and run” above for usage.
- `users.json` — optional sample data used to seed the API via the `/users/register` endpoint during testing.
