# Overpass QL Generator

A minimal, ultra-fast, reliable Overpass Query Generator website with Groq.

## Project Structure

```
/
├── .env                # Environment variables (local only)
├── index.html          # Frontend entry point
├── package.json        # Dependencies and scripts
├── server.ts           # Backend server (Express + API logic)
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── src/
    ├── App.tsx         # Main React component
    ├── main.tsx        # React entry point
    └── index.css       # Global styles (Tailwind)
```

## Installation

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    In `.env` add your API keys.
    ```bash
    cp  .env
    ```
    Required keys:
    - `GROQ_API_KEY`: From [Groq Console](https://console.groq.com/keys)

## Development

Start the development server (Frontend + Backend):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Frontend (Vercel)

1.  Push your code to GitHub/GitLab/Bitbucket.
2.  Import the project in Vercel.
3.  **Build Command**: `npm run build`
4.  **Output Directory**: `dist`
5.  **Environment Variables**:
    - Add `VITE_API_URL` if you are hosting the backend separately (optional, see below).
    - If hosting frontend-only on Vercel and backend elsewhere, you need to update `src/App.tsx` to point to the full backend URL instead of `/api/generate`.

### Backend (Railway / Fly.io)

Since this is a full-stack app with a custom server, it's best deployed as a single service (Backend serving Frontend) or two separate services.

#### Option 1: Single Service (Recommended for Simplicity)
Deploy the entire app (Node.js server serving static frontend) to Railway or Fly.io.

**Railway:**
1.  Connect GitHub repo.
2.  Add variables: `GROQ_API_KEY`, `NODE_ENV=production`.
3.  Start Command: `node dist/server.js` (You need to compile server.ts first) OR use `tsx server.ts` if you want to run TS directly (easier but more memory).
    - *Better approach*: Add a `start` script to `package.json`: `"start": "tsx server.ts"`.
4.  Railway will detect `npm run start` and run it.

**Fly.io:**
1.  `fly launch`
2.  Set secrets: `fly secrets set GROQ_API_KEY=...`
3.  Deploy.

#### Option 2: Separated (Vercel + Railway)
1.  **Backend (Railway)**:
    - Deploy only the server code.
    - Enable CORS in `server.ts` to allow your Vercel domain.
2.  **Frontend (Vercel)**:
    - Update `src/App.tsx` fetch URL to your Railway URL (e.g., `https://my-api.railway.app/api/generate`).
    - Deploy to Vercel.

## Architecture

- **Frontend**: React 19, Tailwind CSS v4, Framer Motion.
- **Backend**: Express, Groq SDK.
- **AI Logic**:
    1.  Tries **Groq (Llama 3.1 70b)** first for speed.
    2.  Returns pure Overpass QL.