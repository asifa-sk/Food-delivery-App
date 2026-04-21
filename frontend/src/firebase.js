import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDSWFAgRkbOpI5Kp4NT_fuJAK5aO3Ew7zc",
  authDomain: "foodyy-75762.firebaseapp.com",
  projectId: "foodyy-75762",
  storageBucket: "foodyy-75762.firebasestorage.app",
  messagingSenderId: "188719364711",
  appId: "1:188719364711:web:f1a05d1a69e7ad2d5ef2c2",
  measurementId: "G-WWTWJYNQHR",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics is optional and only available in supported browser environments.
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics initialization failures in dev/local environments.
  });
}
