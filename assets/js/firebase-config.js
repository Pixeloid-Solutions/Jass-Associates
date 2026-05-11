// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDd143p3p9Ule-w6oF_px946y9NVvCW-Ic",
  authDomain: "jaas-associates.firebaseapp.com",
  projectId: "jaas-associates",
  storageBucket: "jaas-associates.firebasestorage.app",
  messagingSenderId: "110017904638",
  appId: "1:110017904638:web:641a90423dc999cc060aaf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
