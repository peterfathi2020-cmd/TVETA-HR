import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
import fs from "fs";

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
    import("firebase/auth").then(async ({ createUserWithEmailAndPassword, deleteUser }) => {
        let user;
        const email = "test_create_" + Date.now() + "@test.com";
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, "123456");
            user = cred.user;
            await user.getIdToken(true);
            console.log("created user")
        } catch(e) {
            console.error(e);
            return;
        }

        try {
            const batch = writeBatch(db);
            const nationalId = "3010914250000" + Math.floor(Math.random()*9);
            
            const empDoc = doc(db, "employees", nationalId);
            batch.set(empDoc, {
                national_id: nationalId,
                full_name_ar: "Test User",
                email: email,
                employee_code: "1234",
                work_place_id: 0,
                employee_type: "TEACHER",
                role: "Teacher"
            });
            
            const userDoc = doc(db, "users", email);
            batch.set(userDoc, {
                email: email,
                role: "EMPLOYEE",
                national_id: nationalId,
                governorate: null
            }, { merge: true });

            await batch.commit();
            console.log("BATCH SUCCESS");
        } catch(e) {
            console.error("BATCH FAIL:", e.message);
        }

        if (user) await deleteUser(user);
        process.exit(0);
    });
}
run();
