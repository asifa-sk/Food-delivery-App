// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSWFAgRkbOpI5Kp4NT_fuJAK5aO3Ew7zc",
  authDomain: "foodyy-75762.firebaseapp.com",
  projectId: "foodyy-75762",
  storageBucket: "foodyy-75762.firebasestorage.app",
  messagingSenderId: "188719364711",
  appId: "1:188719364711:web:f1a05d1a69e7ad2d5ef2c2",
  measurementId: "G-WWTWJYNQHR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);