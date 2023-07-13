// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAYrsdeUE-eZC3a7yfENOglaovVSDhRg0",
  authDomain: "nftime-a5882.firebaseapp.com",
  projectId: "nftime-a5882",
  storageBucket: "nftime-a5882.appspot.com",
  messagingSenderId: "135930073794",
  appId: "1:135930073794:web:3ad32210aa3e948d10a15b",
  measurementId: "G-XTVHPT677W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Export firestore database
// It will be imported into your react app whenever it is needed
export const db = getFirestore(app);