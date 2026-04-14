import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

const restaurants = [
  // ── Houston, TX ──────────────────────────────────────────────
  { name: "Brennan's of Houston",       location: "Midtown, Houston, TX" },
  { name: "Hugo's",                     location: "Montrose, Houston, TX" },
  { name: "Uchi Houston",               location: "Montrose, Houston, TX" },
  { name: "The Pit Room",               location: "Midtown, Houston, TX" },
  { name: "State of Grace",             location: "River Oaks, Houston, TX" },
  { name: "Xochi",                      location: "Downtown, Houston, TX" },
  { name: "Pappas Bros Steakhouse",     location: "Galleria, Houston, TX" },
  { name: "Bludorn",                    location: "Montrose, Houston, TX" },
  { name: "Indianola",                  location: "Montrose, Houston, TX" },
  { name: "Coltivare",                  location: "Heights, Houston, TX" },

  // ── Austin, TX ───────────────────────────────────────────────
  { name: "Franklin Barbecue",          location: "East Austin, TX" },
  { name: "Uchi Austin",                location: "South Lamar, Austin, TX" },
  { name: "Odd Duck",                   location: "South Lamar, Austin, TX" },
  { name: "Launderette",                location: "East Austin, TX" },
  { name: "Ramen Tatsu-ya",             location: "South Lamar, Austin, TX" },
  { name: "Justine's",                  location: "East Austin, TX" },
  { name: "La Barbecue",                location: "East Austin, TX" },
  { name: "Juniper",                    location: "Downtown, Austin, TX" },
  { name: "Contigo",                    location: "East Austin, TX" },
  { name: "Emmer & Rye",                location: "Rainey Street, Austin, TX" },

  // ── San Antonio, TX ──────────────────────────────────────────
  { name: "Cured",                      location: "Pearl District, San Antonio, TX" },
  { name: "Southerleigh Fine Food",     location: "Pearl District, San Antonio, TX" },
  { name: "Mixtli",                     location: "Near North Side, San Antonio, TX" },
  { name: "Bohanan's Prime Steaks",     location: "Downtown, San Antonio, TX" },
  { name: "Rosario's",                  location: "Southtown, San Antonio, TX" },
  { name: "Acenar",                     location: "Downtown, San Antonio, TX" },
  { name: "Pharm Table",                location: "Pearl District, San Antonio, TX" },
  { name: "Biga on the Banks",          location: "Downtown, San Antonio, TX" },
  { name: "Con Safos",                  location: "King William, San Antonio, TX" },
  { name: "Battalion",                  location: "Tobin Hill, San Antonio, TX" },
];

async function seed() {
  console.log(`Adding ${restaurants.length} restaurants across Houston, Austin & San Antonio...\n`);
  for (const r of restaurants) {
    await addDoc(collection(db, "restaurants"), {
      ...r,
      createdAt: serverTimestamp(),
    });
    console.log(`✅ ${r.name} — ${r.location}`);
  }
  console.log("\nAll done! 🎉 Refresh your app to see the new cities.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
