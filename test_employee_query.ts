import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
    import("firebase/auth").then(async ({ createUserWithEmailAndPassword, deleteUser }) => {
        let user;
        const email = "test_get_" + Date.now() + "@test.com";
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, "123456");
            user = cred.user;
            await user.getIdToken(true);
        } catch(e) {
            console.error(e);
            return;
        }

        try {
            const q = query(collection(db, "employees"), where("email", "==", email));
            const qs = await getDocs(q);
            console.log("Got query:", qs.size);
        } catch(e) {
            console.error("QUERY FAIL:", e.message);
        }

        if (user) await deleteUser(user);
        process.exit(0);
    });
}
run();
