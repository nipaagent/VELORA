import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBtNGvRl53fE0EWjbcyBeSYhSYJEsxLMJg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "v-e-l-o-r-a.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "v-e-l-o-r-a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "v-e-l-o-r-a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "315704367890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:315704367890:web:c72de9be2259f14393b1cb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8D4YEPV40W",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
