# AI Crypto Investor Dashboard

This project is a full-stack web app that provides a personalized crypto investor dashboard.  
Users register, complete a short onboarding quiz, and receive daily AI-curated content.  
They can also give feedback that is stored for future model improvements.  

## online app
https://moveo-coding-task-ai-crypto-advisor.vercel.app/

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
cd server &&
node index.js   # backend



├─ client                    
│  ├─ public
│  │  └─ memes               
│  ├─ src
│  │  ├─ components         
│  │  │  ├─ App.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ Register.jsx
│  │  │  ├─ Onboarding.jsx
│  │  │  └─ ProtectedRoute.jsx
│  │  ├─ context
│  │  │  └─ UserContext.jsx
│  │  ├─ styles       
│  │  │  ├─ Dashboard.css
│  │  │  ├─ form.css
│  │  │  ├─ App.css           
│  │  │  └─ index.css          
│  │  ├─ main.jsx
│  │  └─ index.html
│  └─ package.json
│  └─.env
│
└─ server                  
   ├─ index.js                  
   ├─ coingecko.js            
   ├─ .env                     
   └─ package.json


   
   
                     



