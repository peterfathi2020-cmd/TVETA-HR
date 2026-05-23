import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import config from './firebase-applet-config.json' with { type: "json" };

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function testSign() {
  try {
    const email = "test50.user.123@moe.edu.eg";
    const cred = await createUserWithEmailAndPassword(auth, email, "password123");
    console.log("User created:", cred.user.email);
    
    try {
        const randId = Math.floor(Math.random() * 100000000000000).toString();
        const empRef = doc(db, "employees", randId);
        await setDoc(empRef, {
            national_id: randId,
            email: email,
            role: "Teacher"
        });
        console.log("Employee setDoc successful!");
    } catch(e: any) {
        console.error("Employee FAILED:", e.message);
    }

    try {
        const userRef = doc(db, "users", email);
        await setDoc(userRef, {
            email: email,
            role: "Teacher",
            national_id: "98765432109893"
        });
        console.log("User setDoc successful!");
    } catch(e: any) {
        console.error("User FAILED:", e.message);
    }
    process.exit(0);
  } catch (err: any) {
    console.error("FAILED:", err.message);
    process.exit(1);
  }
}

testSign();
