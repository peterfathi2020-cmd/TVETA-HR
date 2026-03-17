
import { Employee, WorkUnit, User, EmployeeType, UserRole, WorkUnitType, AuditLog, Appraisal } from "../types";
import { DB_EMPLOYEES, DB_WORK_UNITS } from "../constants";
import { db, storage, auth } from "./firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, writeBatch, limit, startAfter, orderBy, getDocFromServer 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLL_EMPLOYEES = "employees";
const COLL_WORK_UNITS = "work_units";
const COLL_AUDIT_LOGS = "audit_logs";
const COLL_APPRAISALS = "appraisals";

export const AuditLogService = {
    log: async (action: AuditLog['action'], entityType: AuditLog['entityType'], entityId: string, details?: string, changes?: AuditLog['changes']): Promise<void> => {
        if (!isFirebaseReady() || !auth?.currentUser) return;
        
        const log: Omit<AuditLog, 'id'> = {
            timestamp: new Date().toISOString(),
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email || 'unknown',
            action,
            entityType,
            entityId,
            details,
            changes
        };
        
        try {
            const logRef = doc(collection(db, COLL_AUDIT_LOGS));
            await setDoc(logRef, log);
        } catch (error) {
            console.error("Failed to log audit action:", error);
        }
    },
    getRecent: async (limitCount: number = 50): Promise<any[]> => {
        if (!isFirebaseReady()) return [];
        try {
            const q = query(collection(db, COLL_AUDIT_LOGS), orderBy("timestamp", "desc"), limit(limitCount));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, COLL_AUDIT_LOGS);
            return [];
        }
    }
};

// --- MOCK DATA STORE (For Demo Mode when Firebase is missing) ---
let MOCK_EMPLOYEES: Employee[] = Object.values(DB_EMPLOYEES);
let MOCK_WORK_UNITS: WorkUnit[] = Object.values(DB_WORK_UNITS);

const isFirebaseReady = () => !!db;

// Validation now allows any valid email format
export const validateAcademicEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const canEditEmployee = (user: User | null, employee: Employee, employeeUnit?: WorkUnit, managerGov?: string) => {
    if (!user) return false;
    if (user.role === UserRole.ACAD_ADMIN) return true;
    if (user.employee_national_id === employee.national_id) return true;
    if (user.role === UserRole.EDU_MANAGER) {
       if (!managerGov) return false;
       if (!employeeUnit) return false;
       return managerGov === employeeUnit.governorate;
    }
    return false;
};

export const StorageService = {
    uploadFile: async (file: File, path: string): Promise<string> => {
        if (!isFirebaseReady() || !storage) {
            console.warn("Storage not ready. Returning fake URL.");
            return URL.createObjectURL(file);
        }
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    },
    deleteFile: async (path: string): Promise<void> => {
        if (!isFirebaseReady() || !storage) return;
        const storageRef = ref(storage, path);
        try {
            await deleteObject(storageRef);
        } catch (error) {
            console.warn("File deletion failed or file not found:", error);
        }
    }
};

export const NotificationService = {
    sendLoginAlert: async (user: User) => { console.log("Login alert", user); }
};

export const EmployeeService = {
  getById: async (id: string): Promise<Employee | undefined> => {
    if (!isFirebaseReady()) {
        return MOCK_EMPLOYEES.find(e => e.national_id === id);
    }
    try {
      const docRef = doc(db, COLL_EMPLOYEES, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as Employee) : undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLL_EMPLOYEES}/${id}`);
    }
  },

  getAll: async (): Promise<Employee[]> => {
    if (!isFirebaseReady()) return [...MOCK_EMPLOYEES];
    try {
      const querySnapshot = await getDocs(collection(db, COLL_EMPLOYEES));
      return querySnapshot.docs.map(doc => doc.data() as Employee);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLL_EMPLOYEES);
    }
  },

  create: async (employee: Employee): Promise<void> => {
    if (!isFirebaseReady()) {
        if (MOCK_EMPLOYEES.find(e => e.national_id === employee.national_id)) {
            throw new Error("الموظف موجود بالفعل");
        }
        MOCK_EMPLOYEES.push(employee);
        return;
    }
    try {
      const docRef = doc(db, COLL_EMPLOYEES, employee.national_id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) throw new Error("الموظف موجود بالفعل");
      
      const batch = writeBatch(db);
      batch.set(docRef, employee);
      
      // Create user document for RBAC if role is Admin or Administrative
      if (employee.role === 'Admin' || employee.role === 'Administrative') {
          const userRef = doc(db, 'users', employee.email);
          batch.set(userRef, {
              email: employee.email,
              role: employee.role === 'Admin' ? 'ACAD_ADMIN' : 'EDU_MANAGER',
              national_id: employee.national_id
          });
      }
      
      await batch.commit();
      await AuditLogService.log('CREATE', 'EMPLOYEE', employee.national_id, `Created employee ${employee.full_name_ar}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLL_EMPLOYEES);
    }
  },

  update: async (id: string, data: Partial<Employee>): Promise<void> => {
    if (!isFirebaseReady()) {
        const index = MOCK_EMPLOYEES.findIndex(e => e.national_id === id);
        if (index !== -1) {
            MOCK_EMPLOYEES[index] = { ...MOCK_EMPLOYEES[index], ...data };
        }
        return;
    }
    const docRef = doc(db, COLL_EMPLOYEES, id);
    
    if (data.role || data.email) {
        const batch = writeBatch(db);
        batch.update(docRef, data);
        
        // If role or email is updated, we need to fetch the current employee to get the email if not provided
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const currentEmp = docSnap.data() as Employee;
            const email = data.email || currentEmp.email;
            const role = data.role || currentEmp.role;
            
            if (role === 'Admin' || role === 'Administrative') {
                const userRef = doc(db, 'users', email);
                batch.set(userRef, {
                    email: email,
                    role: role === 'Admin' ? 'ACAD_ADMIN' : 'EDU_MANAGER',
                    national_id: id
                }, { merge: true });
            } else if (currentEmp.role === 'Admin' || currentEmp.role === 'Administrative') {
                 // If demoted, we should ideally delete the user doc, but for now we can just update role
                 const userRef = doc(db, 'users', currentEmp.email);
                 batch.set(userRef, {
                    email: currentEmp.email,
                    role: 'EMPLOYEE',
                    national_id: id
                }, { merge: true });
            }
        }
        await batch.commit();
        await AuditLogService.log('UPDATE', 'EMPLOYEE', id, `Updated employee fields (with role/email): ${Object.keys(data).join(', ')}`);
    } else {
        await updateDoc(docRef, data);
        await AuditLogService.log('UPDATE', 'EMPLOYEE', id, `Updated employee fields: ${Object.keys(data).join(', ')}`);
    }
  },

  delete: async (id: string): Promise<void> => {
    if (!isFirebaseReady()) {
        MOCK_EMPLOYEES = MOCK_EMPLOYEES.filter(e => e.national_id !== id);
        return;
    }
    await deleteDoc(doc(db, COLL_EMPLOYEES, id));
    await AuditLogService.log('DELETE', 'EMPLOYEE', id, `Deleted employee ${id}`);
  },

  createBulk: async (newEmployees: Employee[]): Promise<{ added: number; skipped: number }> => {
     let added = 0;
     let skipped = 0;
     
     if (!isFirebaseReady()) {
         for (const emp of newEmployees) {
             const exists = MOCK_EMPLOYEES.find(e => e.national_id === emp.national_id);
             if (!exists) {
                 MOCK_EMPLOYEES.push(emp);
                 added++;
             } else {
                 skipped++;
             }
         }
         return { added, skipped };
     }

     const batch = writeBatch(db);
     let operationCount = 0;
     
     for (const emp of newEmployees) {
         const docRef = doc(db, COLL_EMPLOYEES, emp.national_id);
         batch.set(docRef, emp, { merge: true });
         
         if (emp.role === 'Admin' || emp.role === 'Administrative') {
             const userRef = doc(db, 'users', emp.email);
             batch.set(userRef, {
                 email: emp.email,
                 role: emp.role === 'Admin' ? 'ACAD_ADMIN' : 'EDU_MANAGER',
                 national_id: emp.national_id
             }, { merge: true });
             operationCount++;
         }
         
         added++;
         operationCount++;
         
         if (operationCount >= 450) {
             await batch.commit();
             operationCount = 0;
         }
     }
     if (operationCount > 0) {
         await batch.commit();
     }
     return { added, skipped };
  },

  search: async (params: { 
    q?: string, 
    type?: string, 
    workPlaceId?: string, 
    governorate?: string, 
    jobTitle?: string,
    directorate?: string, 
    dateFrom?: string, 
    dateTo?: string,
    isCertified?: boolean,
    ageMin?: number,
    ageMax?: number,
    page: number, 
    limit: number 
  }): Promise<{ data: Employee[], total: number }> => {
    
    let employees: Employee[] = [];

    if (!isFirebaseReady()) {
        employees = [...MOCK_EMPLOYEES];
    } else {
        try {
          // Limited Firestore Query
          let q = query(collection(db, COLL_EMPLOYEES));
          if (params.workPlaceId) q = query(q, where("work_place_id", "==", Number(params.workPlaceId)));
          if (params.type) q = query(q, where("employee_type", "==", params.type));
          if (params.isCertified === true) q = query(q, where("teacher_details.is_certified", "==", true));
          const querySnapshot = await getDocs(q);
          employees = querySnapshot.docs.map(doc => doc.data() as Employee);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, COLL_EMPLOYEES);
        }
    }

    // In-Memory Filtering (Common for both)
    if (params.q && params.q.trim()) {
        const term = params.q.trim().toLowerCase();
        employees = employees.filter(e => 
            e.full_name_ar.toLowerCase().includes(term) || 
            e.national_id.includes(term) ||
            (e.employee_code && e.employee_code.includes(term))
        );
    }
    
    if (params.workPlaceId && !isFirebaseReady()) {
        employees = employees.filter(e => e.work_place_id === Number(params.workPlaceId));
    }
    if (params.type && !isFirebaseReady()) {
        employees = employees.filter(e => e.employee_type === params.type);
    }

    if (params.jobTitle) {
        employees = employees.filter(e => e.job_title.includes(params.jobTitle!));
    }
    if (params.dateFrom) {
        employees = employees.filter(e => e.employment_date >= params.dateFrom!);
    }
    if (params.dateTo) {
        employees = employees.filter(e => e.employment_date <= params.dateTo!);
    }
    
    // Governorate filtering (needs WorkUnit join)
    if (params.governorate && params.governorate !== 'UNKNOWN') {
         // This is expensive in mock/client-side, but okay for demo scale
         const relevantUnits = (isFirebaseReady() ? (await WorkUnitService.getAll()) : MOCK_WORK_UNITS)
             .filter(u => u.governorate === params.governorate)
             .map(u => u.id);
         
         employees = employees.filter(e => relevantUnits.includes(e.work_place_id));
    }

    const total = employees.length;
    const startIndex = (params.page - 1) * params.limit;
    const data = employees.slice(startIndex, startIndex + params.limit);
    
    return { data, total };
  },

  getDashboardStats: async (governorate?: string) => {
      let employees: Employee[] = [];
      
      if (!isFirebaseReady()) {
          employees = [...MOCK_EMPLOYEES];
      } else {
          try {
              const querySnapshot = await getDocs(collection(db, COLL_EMPLOYEES));
              employees = querySnapshot.docs.map(d => d.data() as Employee);
          } catch (error: any) {
              handleFirestoreError(error, OperationType.LIST, COLL_EMPLOYEES);
          }
      }
      
      if (governorate) {
           const units = isFirebaseReady() ? (await WorkUnitService.getAll()) : MOCK_WORK_UNITS;
           const relevantUnitIds = units.filter(u => u.governorate === governorate).map(u => u.id);
           employees = employees.filter(e => relevantUnitIds.includes(e.work_place_id));
      }

      const total = employees.length;
      
      const teachers = employees.filter(e => e.employee_type === EmployeeType.TEACHER).length;
      const certified = employees.filter(e => e.teacher_details?.is_certified).length;
      const admins = employees.filter(e => e.employee_type === EmployeeType.ADMIN).length;
      const trainers = employees.filter(e => e.employee_type === EmployeeType.TRAINER).length;
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const newHires = employees.filter(e => new Date(e.employment_date) > oneYearAgo).length;

      const ageGroups = [
          { name: '20-30', count: Math.floor(total * 0.15) },
          { name: '30-40', count: Math.floor(total * 0.35) },
          { name: '40-50', count: Math.floor(total * 0.30) },
          { name: '50-60', count: Math.floor(total * 0.20) }
      ];

      return {
            total, teachers, certified, admins, trainers, newHires, ageGroups,
            typeDistribution: [
                { name: 'Teacher', value: teachers },
                { name: 'Admin', value: admins },
                { name: 'Trainer', value: trainers }
            ]
        };
  }
};

export const WorkUnitService = {
  getAll: async (): Promise<WorkUnit[]> => {
    if (!isFirebaseReady()) return [...MOCK_WORK_UNITS];
    try {
      const querySnapshot = await getDocs(collection(db, COLL_WORK_UNITS));
      return querySnapshot.docs.map(doc => doc.data() as WorkUnit);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLL_WORK_UNITS);
    }
  },
  
  create: async (data: Partial<WorkUnit>): Promise<WorkUnit> => {
      const newId = Date.now();
      const newUnit = { ...data, id: newId } as WorkUnit;
      
      if (!isFirebaseReady()) {
          MOCK_WORK_UNITS.push(newUnit);
          return newUnit;
      }
      
      const docRef = doc(db, COLL_WORK_UNITS, newId.toString());
      await setDoc(docRef, newUnit);
      return newUnit;
  },

  update: async (id: number, data: Partial<WorkUnit>): Promise<void> => {
    if (!isFirebaseReady()) {
        const index = MOCK_WORK_UNITS.findIndex(u => u.id === id);
        if (index !== -1) {
            MOCK_WORK_UNITS[index] = { ...MOCK_WORK_UNITS[index], ...data };
        }
        return;
    }
    const docRef = doc(db, COLL_WORK_UNITS, id.toString());
    await updateDoc(docRef, data);
  }
};

export const AuthService = {
    login: async (email: string, password: string): Promise<User> => {
        // --- MASTER ADMIN CHECK ---
        if (email === "peterfathi2020@gmail.com") {
            if (password === "pepo_1759") {
                if (isFirebaseReady() && auth) {
                    try {
                        // Try to sign in
                        await signInWithEmailAndPassword(auth, email, password);
                    } catch (error: any) {
                        // If user doesn't exist, create it
                        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                            try {
                                await createUserWithEmailAndPassword(auth, email, password);
                            } catch (createError: any) {
                                if (createError.code !== 'auth/email-already-in-use') {
                                    throw new Error("فشل إنشاء حساب المسؤول: " + createError.message);
                                }
                                // If already in use, maybe invalid-credential was just a wrong password
                                throw new Error("كلمة المرور غير صحيحة");
                            }
                        } else {
                            throw new Error("حدث خطأ أثناء تسجيل الدخول: " + error.message);
                        }
                    }
                }
                
                // Ensure user document exists for RBAC
                if (isFirebaseReady()) {
                    await setDoc(doc(db, 'users', email), {
                        email: email,
                        role: 'ACAD_ADMIN',
                        national_id: "28303012500333"
                    }, { merge: true });
                }
                
                return {
                    id: 28303012500333,
                    email: email,
                    is_staff: true,
                    is_active: true,
                    role: UserRole.ACAD_ADMIN,
                    name: "بيتر فتحي حليم",
                    employee_national_id: "28303012500333"
                };
            } else {
                throw new Error("كلمة المرور غير صحيحة");
            }
        }
        
        // Demo Admin fallback
        if (email === "admin.sys@academy.edu.eg" && password === "AdminSecure") {
             return {
                id: 1, email, is_staff: true, is_active: true, role: UserRole.ACAD_ADMIN, name: "مسؤول النظام", employee_national_id: "28303012500333"
             };
        }

        if (isFirebaseReady() && auth) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error: any) {
                throw new Error("بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.");
            }
        }

        // Logic to find user
        let emp: Employee | null = null;

        if (!isFirebaseReady()) {
            emp = MOCK_EMPLOYEES.find(e => e.email === email || e.academic_email === email) || null;
        } else {
            try {
                const q = query(collection(db, COLL_EMPLOYEES), where("email", "==", email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    emp = querySnapshot.docs[0].data() as Employee;
                } else {
                    const q2 = query(collection(db, COLL_EMPLOYEES), where("academic_email", "==", email));
                    const qs2 = await getDocs(q2);
                    if (!qs2.empty) emp = qs2.docs[0].data() as Employee;
                }
            } catch (error: any) {
                handleFirestoreError(error, OperationType.LIST, COLL_EMPLOYEES);
            }
        }
        
        if (emp) {
            return AuthService.getUserProfile(email);
        }

        throw new Error("بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني.");
    },
    
    loginWithGoogle: async (): Promise<User> => {
        if (!isFirebaseReady() || !auth) {
            return {
                 id: 28303012500333, 
                 email: "peterfathi2020@gmail.com", 
                 is_staff: true, 
                 is_active: true, 
                 role: UserRole.ACAD_ADMIN, 
                 name: "بيتر فتحي حليم", 
                 employee_national_id: "28303012500333"
            };
        }
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            if (user.email === "peterfathi2020@gmail.com") {
                // Ensure user document exists for RBAC
                try {
                    await setDoc(doc(db, 'users', user.email), {
                        email: user.email,
                        role: 'ACAD_ADMIN',
                        national_id: "28303012500333"
                    }, { merge: true });
                } catch (error: any) {
                    handleFirestoreError(error, OperationType.WRITE, `users/${user.email}`);
                }
                return AuthService.getUserProfile(user.email);
            }
            
            // Check if user exists in our employees collection
            let querySnapshot;
            try {
                const q = query(collection(db, COLL_EMPLOYEES), where("email", "==", user.email));
                querySnapshot = await getDocs(q);
            } catch (error: any) {
                handleFirestoreError(error, OperationType.LIST, COLL_EMPLOYEES);
            }
            
            if (querySnapshot.empty) {
                // If not, we might want to create a basic profile or just return a default user
                // For now, let's just return a default user profile
                return {
                    id: Date.now(),
                    email: user.email || "",
                    is_staff: false,
                    is_active: true,
                    role: UserRole.EMPLOYEE,
                    name: user.displayName || "مستخدم جوجل",
                    employee_national_id: ""
                };
            }
            
            return AuthService.getUserProfile(user.email || "");
        } catch (error: any) {
            throw new Error("فشل تسجيل الدخول باستخدام جوجل: " + error.message);
        }
    },
    
    register: async (name: string, email: string, password: string, nationalId: string, empCode: string, role: UserRole = UserRole.EMPLOYEE, workUnitId?: number): Promise<User> => {
        if (isFirebaseReady()) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (error: any) {
                throw new Error("فشل إنشاء الحساب: " + error.message);
            }
        }

        const existing = await EmployeeService.getById(nationalId);

        if (!existing) {
            const newEmployee: Employee = {
                national_id: nationalId,
                full_name_ar: name,
                email: email,
                employee_code: empCode,
                phone_number: "",
                birth_date: "1990-01-01",
                job_title: "موظف جديد",
                employment_date: new Date().toISOString().split('T')[0],
                work_place_id: workUnitId || 0,
                employee_type: EmployeeType.TEACHER,
                role: role === UserRole.ACAD_ADMIN ? 'Admin' : role === UserRole.EDU_MANAGER ? 'Administrative' : 'Teacher',
                details: { name: name, job_title: "موظف جديد", directorate: "غير محدد", financial_grade: "", address: "", phone: "" } as any
            } as any;
            await EmployeeService.create(newEmployee);
        }

        return {
            id: Date.now(),
            email,
            is_staff: false,
            is_active: true,
            role: role,
            name,
            employee_national_id: nationalId,
            work_unit_id: workUnitId
        };
    },
    
    getCurrentUser: async (): Promise<User | null> => {
        const u = localStorage.getItem('nezam_user');
        return u ? JSON.parse(u) : null;
    },
    
    validateCredentials: async (identifier: string, password: string): Promise<boolean> => {
        try {
            await AuthService.login(identifier, password);
            return true;
        } catch {
            return false;
        }
    },
    
    getUserProfile: async (identifier: string): Promise<User> => {
        if (identifier === "peterfathi2020@gmail.com") {
             return {
                id: 28303012500333,
                email: identifier,
                is_staff: true,
                is_active: true,
                role: UserRole.ACAD_ADMIN,
                name: "بيتر فتحي حليم",
                employee_national_id: "28303012500333"
             };
        }

        let emp: Employee | null = null;
        
        if (!isFirebaseReady()) {
            emp = MOCK_EMPLOYEES.find(e => e.email === identifier || e.academic_email === identifier) || null;
        } else {
            try {
              const q = query(collection(db, COLL_EMPLOYEES), where("email", "==", identifier));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                  emp = querySnapshot.docs[0].data() as Employee;
              } else {
                   const q2 = query(collection(db, COLL_EMPLOYEES), where("academic_email", "==", identifier));
                   const qs2 = await getDocs(q2);
                   if (!qs2.empty) emp = qs2.docs[0].data() as Employee;
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, COLL_EMPLOYEES);
            }
        }
        
        let role = UserRole.EMPLOYEE;
        let name = "User";
        let nationalId = "";
        let workUnitId = undefined;

        if (emp) {
            name = emp.full_name_ar;
            nationalId = emp.national_id;
            workUnitId = emp.work_place_id;
            
            const storedRole = (emp as any).role;
            if (storedRole === 'Admin') role = UserRole.ACAD_ADMIN;
            else if (storedRole === 'Administrative') role = UserRole.EDU_MANAGER;
            else if (storedRole === 'Trainer') role = UserRole.EMPLOYEE; 
            
            if (identifier === "admin.sys@academy.edu.eg") role = UserRole.ACAD_ADMIN;
        }

        return {
            id: Date.now(),
            email: identifier,
            is_staff: true,
            is_active: true,
            role: role,
            name: name,
            employee_national_id: nationalId,
            work_unit_id: workUnitId
        };
    },
    
    verifyTwoFactorCode: async (identifier: string, code: string): Promise<User> => {
        return AuthService.getUserProfile(identifier);
    },
    
    sendPasswordResetEmail: async (email: string): Promise<void> => {
        if (!email) throw new Error("يرجى إدخال البريد الإلكتروني أولاً.");
        if (!validateAcademicEmail(email)) throw new Error("يرجى إدخال بريد إلكتروني صحيح.");
        
        if (isFirebaseReady() && auth) {
            try {
                await sendPasswordResetEmail(auth, email);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    throw new Error("هذا البريد الإلكتروني غير مسجل لدينا.");
                }
                throw new Error("فشل إرسال بريد إعادة تعيين كلمة المرور: " + error.message);
            }
        } else {
            console.log("Mock: Password reset email sent to", email);
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

export const SystemService = {
    initializeDefaults: async () => {
        if (!isFirebaseReady()) {
             // Reset Mock Data
             MOCK_EMPLOYEES = Object.values(DB_EMPLOYEES);
             MOCK_WORK_UNITS = Object.values(DB_WORK_UNITS);
             console.log("Mock Database reset.");
             return;
        }

        try {
          // Warning: This operations wipes the current collections and re-seeds them
          const batch = writeBatch(db);
          Object.values(DB_EMPLOYEES).forEach(emp => {
              const ref = doc(db, COLL_EMPLOYEES, emp.national_id);
              batch.set(ref, emp);
          });
          Object.values(DB_WORK_UNITS).forEach(unit => {
              const ref = doc(db, COLL_WORK_UNITS, unit.id.toString());
              batch.set(ref, unit);
          });
          await batch.commit();
          console.log("Database seeded with default values");
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, "bulk_seed");
        }
    },
    testConnection: async () => {
      if (!isFirebaseReady()) return;
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
};

export const PromotionService = {
    calculateNextPromotion: (employee: Employee): { nextDate: Date; yearsRemaining: number; status: 'eligible' | 'upcoming' | 'waiting' } => {
        const lastPromotionDate = new Date(employee.last_promotion_date || employee.employment_date);
        const nextPromotionDate = new Date(lastPromotionDate);
        nextPromotionDate.setFullYear(nextPromotionDate.getFullYear() + 5); // Assuming 5 years for promotion
        
        const now = new Date();
        const diffTime = nextPromotionDate.getTime() - now.getTime();
        const yearsRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365)));
        
        let status: 'eligible' | 'upcoming' | 'waiting' = 'waiting';
        if (yearsRemaining <= 0) status = 'eligible';
        else if (yearsRemaining <= 1) status = 'upcoming';
        
        return { nextDate: nextPromotionDate, yearsRemaining, status };
    },
    getEligibleEmployees: async (): Promise<Employee[]> => {
        const employees = await EmployeeService.getAll();
        return employees.filter(emp => {
            const { status } = PromotionService.calculateNextPromotion(emp);
            return status === 'eligible';
        });
    }
};
export const AppraisalService = {
    getAll: async (employeeId?: string): Promise<Appraisal[]> => {
        if (!isFirebaseReady()) return [];
        try {
            let q = query(collection(db, COLL_APPRAISALS));
            if (employeeId) {
                q = query(q, where("employeeId", "==", employeeId));
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appraisal));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, COLL_APPRAISALS);
            return [];
        }
    },
    create: async (data: Omit<Appraisal, 'id'>): Promise<void> => {
        if (!isFirebaseReady()) return;
        try {
            const docRef = doc(collection(db, COLL_APPRAISALS));
            await setDoc(docRef, data);
            await AuditLogService.log('CREATE', 'APPRAISAL', docRef.id, `Created appraisal for ${data.employeeId}`);
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, COLL_APPRAISALS);
        }
    }
};
export const SeedService = {
    generateLargeDataset: async (count: number, onProgress?: (count: number) => void, unitId?: number): Promise<void> => {
        const firstNames = ["محمد", "أحمد", "محمود", "علي", "حسن", "حسين", "إبراهيم", "سعيد", "مصطفى", "يوسف"];
        const lastNames = ["علي", "محمد", "حسن", "إبراهيم", "سيد", "عبدالله", "عثمان", "كامل", "سالم"];
        const jobs = ["معلم", "معلم أول", "معلم خبير", "كبير معلمين", "إداري"];

        const chunkSize = 400;
        let processed = 0;

        while (processed < count) {
            const currentChunk = Math.min(chunkSize, count - processed);
            const chunkEmployees: Employee[] = [];
            
            for (let i = 0; i < currentChunk; i++) {
                 const randomId = Math.floor(Math.random() * 90000000000000) + 20000000000000;
                 const natId = randomId.toString();
                 const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
                 const job = jobs[Math.floor(Math.random() * jobs.length)];
                 
                 const emp: Employee = {
                     national_id: natId,
                     full_name_ar: name,
                     email: `user${natId}@academy.edu.eg`,
                     job_title: job,
                     employment_date: new Date().toISOString().split('T')[0],
                     work_place_id: unitId || 1001, 
                     employee_type: job === 'إداري' ? EmployeeType.ADMIN : EmployeeType.TEACHER,
                     role: "Teacher",
                     details: { name: name, job_title: job, address: "", financial_grade: "", phone: "" } as any
                 } as any;
                 
                 chunkEmployees.push(emp);
            }

            if (!isFirebaseReady()) {
                MOCK_EMPLOYEES.push(...chunkEmployees);
            } else {
                const batch = writeBatch(db);
                chunkEmployees.forEach(emp => {
                     const ref = doc(db, COLL_EMPLOYEES, emp.national_id);
                     batch.set(ref, emp);
                });
                await batch.commit();
            }
            
            processed += currentChunk;
            if (onProgress) onProgress(processed);
            
            // Small delay to prevent UI freeze
            if (!isFirebaseReady()) await new Promise(r => setTimeout(r, 10));
        }
    }
};

export const DatabaseService = {
    backup: async (): Promise<string> => {
        const employees = await EmployeeService.getAll();
        const work_units = await WorkUnitService.getAll();
        const data = { version: "1.0", timestamp: new Date().toISOString(), employees, work_units };
        return JSON.stringify(data, null, 2);
    },
    
    restore: async (jsonContent: string): Promise<{success: boolean, message: string}> => {
        try {
            const data = JSON.parse(jsonContent);
            
            if (!isFirebaseReady()) {
                 if (data.employees) MOCK_EMPLOYEES = data.employees;
                 if (data.work_units) MOCK_WORK_UNITS = data.work_units;
                 return { success: true, message: "تم استعادة البيانات محلياً (وضع تجريبي)" };
            }

            const batch = writeBatch(db);
            if (data.employees) {
                data.employees.forEach((emp: Employee) => {
                    batch.set(doc(db, COLL_EMPLOYEES, emp.national_id), emp);
                });
            }
            if (data.work_units) {
                data.work_units.forEach((unit: WorkUnit) => {
                    batch.set(doc(db, COLL_WORK_UNITS, unit.id.toString()), unit);
                });
            }
            await batch.commit();
            return { success: true, message: "تم استعادة البيانات بنجاح" };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    }
};
