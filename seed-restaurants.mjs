import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

// Load .env.local
const envFile = readFileSync(".env.local", "utf-8");
envFile.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// NOTE: HalalSpot only lists fully halal certified restaurants.
// Restaurants will be added by verified owners through the app's owner verification flow.
// This seed script is kept for development/testing purposes only.
// Do not seed non-halal or unverified restaurants.
const restaurants = [];

async function seed() {
  console.log("Adding restaurants to Firebase...\n");
  for (const r of restaurants) {
    await addDoc(collection(db, "restaurants"), {
      ...r,
      createdAt: serverTimestamp(),
    });
    console.log(`✅ Added: ${r.name}`);
  }
  console.log("\nAll done! 🎉 Refresh your app to see them.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
