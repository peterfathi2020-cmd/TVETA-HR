import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser, getIdToken } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
    const email = "test_last_" + Date.now() + "@test.com";
    console.log("Registering:", email);
    
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, "123456");
        console.log("Auth user created:", cred.user.uid);
        
        const token = await getIdToken(cred.user);
        // console.log("Token:", token.slice(0, 20) + "...");

        const nationalId = "301091425" + String(Date.now()).slice(-5);
        console.log("Writing employee:", nationalId);
        
        const empDoc = doc(db, "employees", nationalId);
        await setDoc(empDoc, {
            national_id: nationalId,
            full_name_ar: "Test Name",
            email: email,
            work_place_id: 1,
            employee_type: "TEACHER",
            role: "Teacher"
        });
        console.log("SUCCESS");
        
        await deleteUser(cred.user);
    } catch(e: any) {
        console.error("FAILED:", e.message);
        if (auth.currentUser) await deleteUser(auth.currentUser);
    }
    process.exit(0);
}
run();
