import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDSYuBDRRbm_IxWMT0FY4FCjQBX7wqW850",
  authDomain: "fiap-mobile-b1d17.firebaseapp.com",
  databaseURL: "https://fiap-mobile-b1d17-default-rtdb.firebaseio.com/",
  projectId: "fiap-mobile-b1d17",
  storageBucket: "fiap-mobile-b1d17.firebasestorage.app",
  messagingSenderId: "48135676598",
  appId: "1:48135676598:web:ae2d5f1f979c3017a7bc17"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { db };
