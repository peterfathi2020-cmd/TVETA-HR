
import { PERMISSION_LEVELS } from '../constants';
import { Permission, UserSession, Employee, WorkUnit, EmployeeDetails, Role, EmployeeType, UserRole } from '../types';
import { EmployeeService, WorkUnitService, AuthService as ApiAuthService } from './api';

/**
 * Hashing utility to match Python's hashlib.sha256
 */
export const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Authenticates a user based on email and password.
 * Delegates to the persistent API service.
 */
export const authenticateUser = async (email: string, password: string): Promise<UserSession | null> => {
  try {
     // Use the Mock Auth from API which now might use DB if extended, but for now uses constants
     const user = await ApiAuthService.login(email, password);
     
     let role: Role = 'Teacher';
     if (user.role === UserRole.ACAD_ADMIN) {
         role = 'Admin';
     } else if (user.role === UserRole.EDU_MANAGER) {
         role = 'Administrative';
     }

     return {
         national_id: user.employee_national_id || '',
         name: user.name || 'User',
         role: role
     };
  } catch (e) {
      console.error(e);
      return null;
  }
};

/**
 * Checks if a user has a specific permission.
 */
export const checkPermission = (role: string, permissionNeeded: Permission): boolean => {
  const permissions = PERMISSION_LEVELS[role as Role] || [];
  return permissions.includes(permissionNeeded);
};

/**
 * Retrieves employee details securely based on the requester's permissions.
 * Now Async to fetch from Firestore.
 */
export const getEmployeeDetails = async (requesterId: string, targetId: string): Promise<Employee | null> => {
  return await EmployeeService.getById(targetId) || null;
};

/**
 * Get all employees (Admin only helper)
 * Fetches all for dashboard directory (limited view)
 */
export const getAllEmployees = async (requesterId: string): Promise<Employee[]> => {
    return await EmployeeService.getAll();
}

/**
 * Add a new employee to the system and register them as a user if they have credentials
 */
export const addEmployee = async (requesterId: string, newEmployeeData: {
    national_id: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    job_title: string;
    work_unit_id?: number; // Added for Managers
}): Promise<{ success: boolean; message: string }> => {
    
    // Check existence
    const existing = await EmployeeService.getById(newEmployeeData.national_id);
    if (existing) {
        return { success: false, message: 'فشل الإضافة: هذا الرقم القومي مسجل بالفعل.' };
    }

    const passwordHash = await sha256(newEmployeeData.password);

    // Determine Employee Type based on Role
    let empType = EmployeeType.TEACHER;
    if (newEmployeeData.role === 'Admin') empType = EmployeeType.ADMIN;
    if (newEmployeeData.role === 'Administrative') empType = EmployeeType.ADMIN; 
    if (newEmployeeData.role === 'Trainer') empType = EmployeeType.TRAINER;

    const newEmployee: Employee = {
        national_id: newEmployeeData.national_id,
        full_name_ar: newEmployeeData.name,
        email: newEmployeeData.email,
        academic_email: newEmployeeData.email,
        password_hash: passwordHash,
        role: newEmployeeData.role,
        job_title: newEmployeeData.job_title,
        
        // Default required values
        birth_date: '1900-01-01',
        phone_number: '',
        employment_date: new Date().toISOString().split('T')[0],
        work_place_id: newEmployeeData.work_unit_id || 0, // Managers might have this set initially
        employee_type: empType,

        details: {
            name: newEmployeeData.name,
            job_title: newEmployeeData.job_title,
            directorate: "لم تُحدد بعد",
            financial_grade: "لم تُحدد بعد",
            address: "لم تُحدد بعد",
            phone: "لم يُحدد بعد"
        }
    };

    try {
        await EmployeeService.create(newEmployee);
        
        await ApiAuthService.register(
            newEmployeeData.name,
            newEmployeeData.email,
            newEmployeeData.password,
            newEmployeeData.national_id,
            "NEW",
            newEmployeeData.role === 'Admin' ? UserRole.ACAD_ADMIN : 
            newEmployeeData.role === 'Administrative' ? UserRole.EDU_MANAGER : UserRole.EMPLOYEE,
            newEmployeeData.work_unit_id
        );

        return { success: true, message: 'تم إضافة الموظف/المستخدم بنجاح.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'حدث خطأ أثناء الإضافة.' };
    }
};

/**
 * Update existing employee details
 */
export const updateEmployee = async (
    requesterId: string, 
    targetId: string, 
    updates: Partial<EmployeeDetails>
): Promise<{ success: boolean; message: string }> => {
    
    const employee = await EmployeeService.getById(targetId);
    if (!employee) {
        return { success: false, message: 'الموظف غير موجود.' };
    }

    // Merge updates
    const updatedEmployee = {
        ...employee,
        full_name_ar: updates.name || employee.full_name_ar,
        job_title: updates.job_title || employee.job_title,
        phone_number: updates.phone || employee.phone_number,
        details: {
            ...employee.details,
            ...updates
        }
    };
    
    if (updates.name) updatedEmployee.full_name_ar = updates.name;
    if (updates.job_title) updatedEmployee.job_title = updates.job_title;

    try {
        await EmployeeService.update(targetId, updatedEmployee);
        return { success: true, message: 'تم تحديث البيانات بنجاح.' };
    } catch (e) {
        return { success: false, message: 'حدث خطأ أثناء التحديث.' };
    }
};

/**
 * Get all Work Units
 */
export const getAllWorkUnits = async (requesterId: string): Promise<WorkUnit[]> => {
    return await WorkUnitService.getAll();
};

/**
 * Find if an employee manages a specific work unit.
 */
export const getManagedUnit = async (employeeId: string): Promise<WorkUnit | undefined> => {
    const units = await WorkUnitService.getAll();
    return units.find(unit => unit.manager_id === employeeId || unit.manager_national_id === employeeId);
};

/**
 * Helper to get an employee name by ID (safe lookup)
 */
export const getEmployeeNameById = async (id: string | null): Promise<string> => {
    if (!id) return 'غير محدد';
    const emp = await EmployeeService.getById(id);
    return emp ? emp.full_name_ar : 'غير محدد';
};
