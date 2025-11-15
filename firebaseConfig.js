// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyDFzZawnLH4Jk5BJAXtBbj8Hp3KIbqyGV0",
  authDomain: "lba-job-portal.firebaseapp.com",
  projectId: "lba-job-portal",
  storageBucket: "lba-job-portal.firebasestorage.app",
  messagingSenderId: "771419022744",
  appId: "1:771419022744:web:72d23feef8d6c3d20577ed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Export the services you'll need in other files
export const auth = getAuth(app);
export const db = getFirestore(app);