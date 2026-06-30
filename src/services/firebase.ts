import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (with custom database ID)
const dbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-inventorymanagem-c5bce93c-0adf-40f6-b6bc-ab716c92d16f';
export const firestore = getFirestore(app, dbId);
