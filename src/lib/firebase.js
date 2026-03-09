import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPawC7OPXmvzu2Fj8Uzfj1ZXQI3v-6VL8",
  authDomain: "topsecret-9ae10.firebaseapp.com",
  databaseURL: "https://topsecret-9ae10-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "topsecret-9ae10",
  storageBucket: "topsecret-9ae10.firebasestorage.app",
  messagingSenderId: "946145195302",
  appId: "1:946145195302:web:a25c392b7efde11137fde7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
