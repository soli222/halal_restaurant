# 🍽 ReviewSpot — Setup Guide

## What you're building
A restaurant review app where customers can:
- Search restaurants by name or location
- Leave reviews with a Good / Average / Bad rating + text + optional photo
- See an AI-generated summary of all reviews
- Sign in with Google

---

## Step 1 — Copy the project files

Move the `restaurant-reviews` folder to wherever you keep your projects, for example:
```
C:\Users\YourName\projects\restaurant-reviews
```

---

## Step 2 — Open a terminal in the project folder

1. Open **File Explorer** and go to the `restaurant-reviews` folder
2. Click the address bar at the top, type `cmd`, press Enter
3. A command prompt will open inside that folder

---

## Step 3 — Install dependencies

In the terminal, run:
```
npm install
```
This downloads all the packages the app needs. It takes about 1–2 minutes.

---

## Step 4 — Set up Firebase (free)

Firebase stores your reviews and handles Google login.

1. Go to **https://console.firebase.google.com**
2. Click **Add project**, name it `restaurant-reviews`, click through the steps
3. Once inside the project:

### Enable Google Login
- Left menu → **Authentication** → **Get started**
- Click **Google** → Enable → Save

### Create the database
- Left menu → **Firestore Database** → **Create database**
- Choose **Start in test mode** → Next → pick any location → Done

### Get your config keys
- Click the gear icon (⚙) → **Project settings**
- Scroll down to **Your apps** → click **</>** (web app)
- Name it anything → click **Register app**
- You'll see a block of code with your keys — keep this open

---

## Step 5 — Add your Firebase keys

1. In your project folder, find the file called `.env.local.example`
2. Make a **copy** of it and rename the copy to `.env.local`
3. Open `.env.local` in Notepad and fill in each value from Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=restaurant-reviews-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=restaurant-reviews-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=restaurant-reviews-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Step 6 — Add your Anthropic API key (for AI summaries)

The AI summary feature uses Claude.

1. Go to **https://console.anthropic.com**
2. Sign up / log in → go to **API Keys** → **Create Key**
3. Copy the key and add it to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Step 7 — Run the app

In your terminal, run:
```
npm run dev
```

Then open your browser and go to:
```
http://localhost:3000
```

Your app is running! 🎉

---

## Step 8 — Add Firestore indexes (if you get an error)

If you see a Firestore index error in the browser console:
1. Click the link in the error — it takes you straight to Firebase to create the index
2. Click **Create index** and wait ~1 minute

---

## How to share the app with customers

When you're ready for real customers to use it:

```
npm run build
```

Then deploy to **Vercel** (free):
1. Go to **https://vercel.com** and sign up
2. Connect your project folder
3. Add your `.env.local` values in Vercel's Environment Variables settings
4. Deploy — you'll get a public URL like `https://your-app.vercel.app`

---

## Folder structure explained

```
restaurant-reviews/
├── app/
│   ├── page.js              ← Main app (home + restaurant pages)
│   ├── layout.js            ← HTML wrapper
│   ├── globals.css          ← Dark mode styles
│   ├── lib/
│   │   └── firebase.js      ← Firebase connection
│   └── api/
│       └── summarize/
│           └── route.js     ← AI summary endpoint
├── .env.local               ← Your secret keys (never share this)
├── package.json             ← Project dependencies
└── tailwind.config.js       ← Styling config
```

---

## Need help?

If you get stuck on any step, paste the error message and I'll help you fix it!
