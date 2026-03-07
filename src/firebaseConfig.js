
// src/firebaseConfig.js

// 1. Import the functions you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-2pa1BV9M6hnkVaurpun25dPB54xDq4A",
  authDomain: "mathemix-9c8ba.firebaseapp.com",
  projectId: "mathemix-9c8ba",
  storageBucket: "mathemix-9c8ba.firebasestorage.app",
  messagingSenderId: "935229093991",
  appId: "1:935229093991:web:39c640add883cbf3a43cc2",
  measurementId: "G-0RMLEHK80H"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Lazy-load analytics (not needed at startup, saves ~50KB from initial bundle)
if (typeof window !== 'undefined') {
  import("firebase/analytics").then(({ getAnalytics }) => {
    getAnalytics(app);
  }).catch(() => { });
}

// 5. Export the services so the rest of your app can use them
export const auth = getAuth(app);
export const db = getFirestore(app);