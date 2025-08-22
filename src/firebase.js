// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLTBcj6HH3i9TtVypmwMo8sCpBi-WvKL0",
  authDomain: "daily-questions-app-c7f27.firebaseapp.com",
  projectId: "daily-questions-app-c7f27",
  storageBucket: "daily-questions-app-c7f27.appspot.com",  // 🔥 fixed: `.app` → `.appspot.com`
  messagingSenderId: "516096334908",
  appId: "1:516096334908:web:edef81f497bbc78e107739"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
