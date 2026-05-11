# Complete Setup Guide

## Step 1 — Install Node.js (if not already installed)

```bash
# Check if already installed
node --version   # needs 18+
npm --version    # needs 9+
```

If not installed: https://nodejs.org/en/download (LTS version)

---

## Step 2 — Install & Start Redis (choose one option)

### Option A — Local Redis (Linux / macOS)

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu / Debian
sudo apt update && sudo apt install redis-server
sudo systemctl start redis-server

# Verify it's running
redis-cli ping   # should print: PONG
```

### Option B — Redis Cloud (Free tier, no install)

1. Go to https://redis.com/try-free/
2. Create a free database
3. Copy the connection URL → use as REDIS_URL in `.env`

### Option C — Docker

```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

---

## Step 3 — Install & Start MongoDB (choose one option)

### Option A — Local MongoDB

```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community

# Ubuntu
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update && sudo apt install mongodb-org
sudo systemctl start mongod

# Verify
mongosh --eval "db.adminCommand('ping')"
```

### Option B — MongoDB Atlas (Free tier, no install)

1. Go to https://mongodb.com/atlas
2. Create free M0 cluster
3. Click "Connect" → "Drivers" → copy connection string
4. Replace `<password>` with your password → use as MONGO_URI

### Option C — Docker

```bash
docker run -d -p 27017:27017 --name mongo mongo:6
```

---

## Step 4 — Set Up the Backend

```bash
cd collab-code/server

# Copy and edit environment variables
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/collabcode
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
```

Then install dependencies and start:

```bash
npm install
npm run dev
```

You should see:

```
✅  MongoDB connected
✅  Redis connected
✅  Server running on port 5000
```

> **Note:** If MongoDB or Redis aren't available, the server still starts with graceful fallbacks — it's not fatal during development.

---

## Step 5 — Set Up the Frontend

```bash
cd collab-code/client

cp .env.example .env
# Default VITE_SERVER_URL=http://localhost:5000 is fine for local dev

npm install
npm run dev
```

You should see:

```
  VITE v4.x.x  ready

  ➜  Local:   http://localhost:5173/
```

---

## Step 6 — Test Collaboration

1. Open **two browser windows** at http://localhost:5173
2. Enter the same username variations and **the same Room ID** in both
3. Start typing in one — it should appear in the other instantly

### Test offline recovery:

1. Open DevTools → Network tab
2. Click "Offline" to simulate disconnect
3. Type some code — the status bar will show "Offline — edits queued locally"
4. Click "Online" again — edits replay automatically to the server

---

## Deployment

### Frontend → Vercel

```bash
# 1. Push your code to GitHub

# 2. Go to vercel.com → Import project → select your repo

# 3. Set these environment variables in Vercel dashboard:
#    VITE_SERVER_URL = https://your-backend-url.onrender.com

# 4. Deploy
```

### Backend → Render

1. Go to render.com → New Web Service → connect GitHub repo
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables:
   - `MONGO_URI` = your Atlas connection string
   - `REDIS_URL` = your Redis Cloud URL
   - `CLIENT_URL` = your Vercel frontend URL
   - `PORT` = 5000

---

## Project File Map

```
collab-code/
│
├── README.md                          ← project overview + interview notes
├── SETUP.md                           ← this file
│
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                   ← Express + Socket.IO bootstrap
│       ├── models/
│       │   └── Room.js                ← Mongoose schema
│       ├── services/
│       │   ├── database.js            ← MongoDB connection
│       │   ├── redis.js               ← Redis client + in-memory fallback
│       │   └── syncService.js         ← version tracking, op buffer, user presence
│       └── sockets/
│           └── socketHandlers.js      ← all Socket.IO events
│
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                    ← routing
        ├── index.css                  ← Tailwind + global styles
        ├── socket/
        │   ├── socket.js              ← Socket.IO singleton with reconnect config
        │   └── offlineQueue.js        ← IndexedDB offline op queue
        ├── hooks/
        │   └── useCollabEditor.js     ← all sync logic in one hook
        ├── pages/
        │   ├── Home.jsx               ← room creation / join
        │   └── EditorRoom.jsx         ← editor layout
        └── components/
            ├── CollabEditor.jsx       ← Monaco wrapper
            ├── Toolbar.jsx            ← language picker, room ID copy
            ├── UserList.jsx           ← active users sidebar
            └── StatusBar.jsx          ← connection status + version
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED redis` | Redis not running — start it or set `REDIS_URL=` empty (uses in-memory fallback) |
| `MongoServerSelectionError` | MongoDB not running — start it or use Atlas. App still works without it. |
| `CORS error` in browser | Make sure `CLIENT_URL` in server `.env` matches the port your frontend runs on |
| Monaco editor flickers | Normal on first load — it lazy-loads the worker |
| Edits not syncing | Check browser console for socket errors; verify both tabs use the same Room ID |
