import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBn3Gax7Fz4VuiLskApL_CFI1hWPh_YBgA",
  authDomain: "roundup-6684d.firebaseapp.com",
  projectId: "roundup-6684d",
  storageBucket: "roundup-6684d.firebasestorage.app",
  messagingSenderId: "516736422205",
  appId: "1:516736422205:web:edbdaa5d80066f5d5bf554",
  measurementId: "G-WD9D9NN8T0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
