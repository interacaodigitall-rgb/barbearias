import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCJI-KKRauvCjJfi4ofljWTbM2ScYy79yw",
  authDomain: "barbearias-d7df3.firebaseapp.com",
  projectId: "barbearias-d7df3",
  storageBucket: "barbearias-d7df3.firebasestorage.app",
  messagingSenderId: "708574528465",
  appId: "1:708574528465:web:1b081e8ce930e503fad6f0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
