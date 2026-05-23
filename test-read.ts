import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import config from './firebase-applet-config.json' with { type: "json" };

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
     await signInWithEmailAndPassword(auth, "test20.user.123@moe.edu.eg", "password123");
     await setDoc(doc(db, "employees", "test20.user.123@moe.edu.eg"), { email: "test20.user.123@moe.edu.eg" });
     console.log("Write success");
  } catch(e: any) {
     console.error("READ ERR:", e.message);
  }
  process.exit(0);
}
run();
