import { useAuth } from '../context/AuthContext';
import { UserRole, Employee, WorkUnit } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  if (!user) {
    return {
      isGuest: true,
      isEmployee: false,
      isManager: false,
      isAdmin: false,
      canViewDashboard: () => false,
      canManageUnits: () => false,
      canViewEmployeeDetails: () => false,
      canEditEmployeeDetails: () => false,
    };
  }

  const isAdmin = user.role === UserRole.ACAD_ADMIN;
  const isManager = user.role === UserRole.EDU_MANAGER;
  const isEmployee = user.role === UserRole.EMPLOYEE;

  const canViewDashboard = () => isAdmin || isManager;

  const canManageUnits = () => isAdmin;

  const canViewEmployeeDetails = (targetEmployee: Employee, targetWorkUnit?: WorkUnit, managerGovernorate?: string) => {
    if (isAdmin) return true;
    if (isManager && targetWorkUnit?.governorate === managerGovernorate) return true;
    if (user.employee_national_id === targetEmployee.national_id) return true;
    return false;
  };

  const canEditEmployeeDetails = (targetEmployee: Employee, targetWorkUnit?: WorkUnit, managerGovernorate?: string) => {
    if (isAdmin) return true;
    if (isManager && targetWorkUnit?.governorate === managerGovernorate) return true;
    if (user.employee_national_id === targetEmployee.national_id) return true; // Cannot edit own role, but other details
    return false;
  };

  return {
    user,
    isGuest: false,
    isEmployee,
    isManager,
    isAdmin,
    canViewDashboard,
    canManageUnits,
    canViewEmployeeDetails,
    canEditEmployeeDetails,
  };
};
