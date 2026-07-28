import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBtNGvRl53fE0EWjbcyBeSYhSYJEsxLMJg",
  authDomain: "v-e-l-o-r-a.firebaseapp.com",
  databaseURL: "https://v-e-l-o-r-a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "v-e-l-o-r-a",
  storageBucket: "v-e-l-o-r-a.firebasestorage.app",
  messagingSenderId: "315704367890",
  appId: "1:315704367890:web:c72de9be2259f14393b1cb",
  measurementId: "G-8D4YEPV40W"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
