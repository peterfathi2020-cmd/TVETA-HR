import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import config from './firebase-applet-config.json' with { type: "json" };
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
async function run() {
  await signInWithEmailAndPassword(auth, "test13.user.123@moe.edu.eg", "password123");
  try {
     await setDoc(doc(db, "users", "test13.user.123@moe.edu.eg"), { email: "test13.user.123@moe.edu.eg", national_id: "test", role: "EMPLOYEE" });
     console.log("USERS OK");
  } catch(e: any) {
     console.log("USERS ERR", e.message);
  }
  process.exit(0);
}
run();
