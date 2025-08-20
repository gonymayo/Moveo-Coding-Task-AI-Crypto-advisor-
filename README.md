# AI Crypto Investor Dashboard

This project is a full-stack web app that provides a personalized crypto investor dashboard.  
Users register, complete a short onboarding quiz, and receive daily AI-curated content.  
They can also give feedback that is stored for future model improvements.  

## Features
- **Login/Signup** with JWT authentication  
- **Onboarding quiz** to collect preferences  
- **Dashboard** with 4 sections:
  - Market News (CryptoPanic API or static fallback)
  - Coin Prices (CoinGecko API)
  - AI Insight of the Day
  - Fun Crypto Meme  
- **Voting system** stored in SQLite DB  

## Tech Stack
- Frontend: React (Vite)  
- Backend: Node.js + Express  
- Database: SQLite  
- APIs: CoinGecko, CryptoPanic (with fallback)  

## Run locally
```bash
git clone https://github.com/gonymayo/Moveo-Coding-Task-AI-Crypto-advisor-.git
cd Moveo-Coding-Task-AI-Crypto-advisor-
npm install
npm run dev        # frontend
cd server && node index.js   # backend
                     
├─ client/                      # React + Vite
│  ├─ public/
│  │  └─ memes/                 # תמונות הממים
│  ├─ src/
│  │  ├─ components/ (VoteButtons.jsx ...)
│  │  ├─ context/ (UserContext.jsx)
│  │  ├─ styles/ (Dashboard.css, form.css)
│  │  ├─ App.jsx  ├─ Dashboard.jsx  ├─ Login.jsx
│  │  ├─ Register.jsx  ├─ Onboarding.jsx  ├─ ProtectedRoute.jsx
│  │  ├─ main.jsx  └─ index.css
│  └─ index.html
└─ server/                      # Express + SQLite
   ├─ index.js                  # כל ה‑endpoints
   ├─ coingecko.js              # עזר למחירים
   └─ .env                      # PORT, JWT_SECRET, CRYPTOPANIC_KEY (אופציונלי)

## Environment Variables

Create a `.env` file in the **server** directory (and optionally one in **client**) before starting the app.

### 📁 `server/.env`

| Variable         | Value (example)                |
|------------------|--------------------------------|
| `PORT`           | `4000`                         |
| `JWT_SECRET`     | `change_me`                    |
| `CRYPTOPANIC_KEY`| `your_token_here` *(optional)* |

> ללא `CRYPTOPANIC_KEY` תקבלי Fallback לחדשות – עומד בדרישות המטלה.

### 📁 `client/.env` *(אופציונלי, לנוחות דיפלוי)*

| Variable         | Value (example)                   |
|------------------|-----------------------------------|
| `VITE_API_ROOT`  | `http://localhost:4000`           |

ואז בצד לקוח השתמשי ב:
```js
const BASE = import.meta.env.VITE_API_ROOT || "http://localhost:4000";
fetch(`${BASE}/api/news`)
