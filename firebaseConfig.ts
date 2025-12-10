
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUjO51jLPP206CmFIbjSPO36B47hgP9S8",
  authDomain: "tra-lich-lam.firebaseapp.com",
  projectId: "tra-lich-lam",
  storageBucket: "tra-lich-lam.firebasestorage.app",
  messagingSenderId: "693163270024",
  appId: "1:693163270024:web:cc93c5798aa16d41d8643d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
