import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
    import("firebase/auth").then(async ({ createUserWithEmailAndPassword, deleteUser }) => {
        let user;
        try {
            const cred = await createUserWithEmailAndPassword(auth, "test_get_" + Date.now() + "@test.com", "123456");
            user = cred.user;
            console.log("Created test user:", user.uid);
            await user.getIdToken(true);
        } catch(e) {
            console.error(e);
            return;
        }

        try {
            console.log("Auth current user:", auth.currentUser?.uid);
            const d = await getDoc(doc(db, "employees", "30109142500019"));
            console.log("Got doc:", d.exists() ? "Exists" : "Not found", d.id);
        } catch(e) {
            console.error("GET FAIL:", e.message);
        }

        if (user) await deleteUser(user);
        process.exit(0);
    });
}
run();
