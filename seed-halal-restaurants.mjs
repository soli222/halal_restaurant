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
  // Dallas, TX
  { name: "Everything Halal",           location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "American Halal" },
  { name: "Kafi BBQ",                   location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "BBQ" },
  { name: "Cafe Izmir",                 location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Mediterranean" },
  { name: "Ariana Cuisine",             location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Afghan" },
  { name: "Cafe Laziz",                 location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Middle Eastern" },
  { name: "Chop House Gyro",            location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Mediterranean" },
  { name: "WAVA Halal Grill",           location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Grill" },
  { name: "Bali Street Cafe",           location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Indonesian" },
  { name: "Fusion Mediterranean Grill", location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Mediterranean" },
  { name: "Baboush",                    location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Middle Eastern" },
  { name: "Lyari Cafe",                 location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Pakistani" },
  { name: "The Halal Guys",             location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "American Halal" },
  { name: "Halal Mother Truckers",      location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "American Halal" },
  { name: "Cafe Madina",                location: "Dallas, TX",        city: "Dallas",      state: "TX", cuisine: "Pakistani" },

  // Houston, TX
  { name: "Aga's Restaurant and Catering", location: "Houston, TX",   city: "Houston",     state: "TX", cuisine: "Pakistani" },
  { name: "Musaafer",                   location: "Houston, TX",       city: "Houston",     state: "TX", cuisine: "Indian" },
  { name: "Burger Bodega",              location: "Houston, TX",       city: "Houston",     state: "TX", cuisine: "Burgers" },
  { name: "Levant BBQ",                 location: "Houston, TX",       city: "Houston",     state: "TX", cuisine: "Middle Eastern BBQ" },
  { name: "Kasra Persian Grill",        location: "Houston, TX",       city: "Houston",     state: "TX", cuisine: "Persian" },
  { name: "Karahi Boys",                location: "Sugar Land, TX",    city: "Sugar Land",  state: "TX", cuisine: "Pakistani" },
  { name: "Truboy BBQ Market",          location: "Houston, TX",       city: "Houston",     state: "TX", cuisine: "BBQ" },
  { name: "Big Moe's Kitchen",          location: "Houston, TX",       city: "Houston",     state: "TX", cuisine: "American Halal" },
  { name: "Abu Omar Halal",             location: "Houston, TX",       city: "Houston",     state: "TX", cuisine: "American Halal" },

  // Chicago, IL
  { name: "Sabri Nihari",               location: "Chicago, IL",       city: "Chicago",     state: "IL", cuisine: "Pakistani" },
  { name: "Tandoor Char House",         location: "Chicago, IL",       city: "Chicago",     state: "IL", cuisine: "Indian" },
  { name: "Sultan's Market",            location: "Chicago, IL",       city: "Chicago",     state: "IL", cuisine: "Middle Eastern" },
  { name: "Noon O Kabab",               location: "Chicago, IL",       city: "Chicago",     state: "IL", cuisine: "Persian" },

  // New York, NY
  { name: "The Halal Guys",             location: "Midtown, New York, NY", city: "New York", state: "NY", cuisine: "American Halal" },
  { name: "Bunna Cafe",                 location: "Brooklyn, New York, NY", city: "New York", state: "NY", cuisine: "Ethiopian" },
  { name: "Halalab",                    location: "Brooklyn, New York, NY", city: "New York", state: "NY", cuisine: "Lebanese" },
  { name: "Darbar Restaurant",          location: "New York, NY",      city: "New York",    state: "NY", cuisine: "Pakistani" },

  // Los Angeles, CA
  { name: "Fatima's Grill",             location: "Downey, CA",        city: "Downey",      state: "CA", cuisine: "American Halal" },
  { name: "Zam Zam Market",             location: "Culver City, CA",   city: "Culver City", state: "CA", cuisine: "Middle Eastern" },
  { name: "Zankou Chicken",             location: "Los Angeles, CA",   city: "Los Angeles", state: "CA", cuisine: "Lebanese" },
  { name: "Al Noor Restaurant",         location: "Los Angeles, CA",   city: "Los Angeles", state: "CA", cuisine: "Pakistani" },

  // Toronto, Canada
  { name: "Paramount Fine Foods",       location: "Toronto, Canada",   city: "Toronto",     state: "ON", cuisine: "Lebanese" },
  { name: "Lahore Tikka House",         location: "Toronto, Canada",   city: "Toronto",     state: "ON", cuisine: "Pakistani" },
  { name: "Ali Baba's",                 location: "Toronto, Canada",   city: "Toronto",     state: "ON", cuisine: "Middle Eastern" },
];

async function seed() {
  console.log(`Seeding ${restaurants.length} halal restaurants...\n`);
  for (const r of restaurants) {
    await addDoc(collection(db, "restaurants"), {
      ...r,
      halalCertified: true,
      createdAt: serverTimestamp(),
    });
    console.log(`✅ Added: ${r.name} — ${r.location}`);
  }
  console.log(`\nDone! ${restaurants.length} halal restaurants added. 🕌`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
