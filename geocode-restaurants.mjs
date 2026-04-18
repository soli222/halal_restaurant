/**
 * One-time script to populate lat/lng on existing restaurant Firestore documents.
 * Uses Nominatim (OpenStreetMap) — free, no API key required.
 * Respects the 1 req/sec rate limit.
 *
 * Run: node geocode-restaurants.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
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

async function geocode(name, location) {
  const q = encodeURIComponent(`${name} ${location}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HalalSpot-geocoder/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const snap = await getDocs(collection(db, "restaurants"));
  const docs = snap.docs.filter((d) => d.data().lat == null || d.data().lng == null);
  console.log(`Found ${docs.length} restaurants without coordinates.`);

  let ok = 0, failed = 0;
  for (const d of docs) {
    const { name, location } = d.data();
    if (!name || !location) { failed++; continue; }
    try {
      const coords = await geocode(name, location);
      if (coords) {
        await updateDoc(doc(db, "restaurants", d.id), coords);
        console.log(`  ✓ ${name} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        ok++;
      } else {
        console.log(`  ✗ ${name} — no result from Nominatim`);
        failed++;
      }
    } catch (e) {
      console.log(`  ✗ ${name} — error: ${e.message}`);
      failed++;
    }
    await sleep(1100); // stay under 1 req/sec
  }

  console.log(`\nDone: ${ok} geocoded, ${failed} failed/skipped.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
