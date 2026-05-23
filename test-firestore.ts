import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
const db = getFirestore(app, dbId);
const auth = getAuth(app);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'test999@gmail.com', '123456');
    console.log('Signed in as Manager', cred.user.email);
  } catch (e: any) {
    console.error('Sign in failed:', e.message);
    return;
  }
  
  const empRef = doc(db, 'employees', 'test_norm_emp_2');
  try {
      await setDoc(empRef, {
        national_id: '12341234123412',
        full_name_ar: 'Test Emp',
        email: 'test_norm_emp_2@gmail.com',
        work_place_id: 1,
        employee_type: 'TEACHER',
        governorate: 'القاهرة',
        role: 'Teacher'
      }, { merge: true });
      console.log('Manager creating normal employee: SUCCEEDED');
  } catch (e: any) {
      console.error('Manager creating employee error:', e.message);
  }
      
  try {
      const userRef = doc(db, 'users', 'test_norm_emp_2@gmail.com');
      await setDoc(userRef, {
          email: 'test_norm_emp_2@gmail.com',
          role: 'EMPLOYEE'
      }, { merge: true });
      console.log('Manager creating normal user record: SUCCEEDED');
  } catch (e: any) {
      console.error('Manager creating user error:', e.message);
  }

  try {
      await updateDoc(empRef, { full_name_ar: 'Updated Name 2' });
      console.log('Manager updating normal employee: SUCCEEDED');
  } catch (e: any) {
      console.error('Manager updating employee error:', e.message);
  }

  try {
      const otherManagerRef = doc(db, 'employees', 'new_manager_123');
      await setDoc(otherManagerRef, {
        national_id: '44444444444444',
        full_name_ar: 'Another Manager',
        email: 'test_manager3@gmail.com',
        work_place_id: 1,
        employee_type: 'TEACHER', // They could be a teacher acting as admin
        governorate: 'القاهرة',
        role: 'Administrative' // Trying to give them manager role
      });
      console.log('Manager creating another manager employee: SUCCEEDED (This is WRONG)');
  } catch (e: any) {
      console.log('Manager creating another manager employee: BLOCKED (Correcting)');
  }

  try {
      const otherManagerUserRef = doc(db, 'users', 'test_manager3@gmail.com');
      await setDoc(otherManagerUserRef, {
        email: 'test_manager3@gmail.com',
        role: 'EDU_MANAGER'
      });
      console.log('Manager creating another manager user doc: SUCCEEDED (This is WRONG)');
  } catch (e: any) {
      console.log('Manager creating another manager user doc: BLOCKED (Correcting)');
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
