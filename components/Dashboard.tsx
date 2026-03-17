
import React, { useState, useEffect, useCallback } from 'react';
import { UserSession, Employee, WorkUnit } from '../types';
import { getAllEmployees, getEmployeeDetails, getAllWorkUnits, getManagedUnit, getEmployeeNameById, addEmployee, updateEmployee } from '../services/authService';
import { ProfileCard } from './ProfileCard';
import { EmployeeFormModal } from './EmployeeFormModal';
import { Button } from './Button';
import { LogOut, Users, User as UserIcon, ShieldAlert, Building2, MapPin, UserPlus, Printer } from 'lucide-react';
import { ACADEMY_LOGO_URL } from '../constants';

interface DashboardProps {
  user: UserSession;
  onLogout: () => void;
}

type View = 'profile' | 'directory' | 'units';

const unitTypeLabels: Record<string, string> = {
    'SCHOOL': 'مدرسة',
    'EDU_DEPT': 'إدارة تعليمية',
    'DIRECTORATE': 'مديرية',
    'OTHER': 'أخرى'
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('profile');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(user.national_id);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [managedUnit, setManagedUnit] = useState<WorkUnit | undefined>(undefined);
  
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [unitsList, setUnitsList] = useState<WorkUnit[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Load employee data and their managed unit whenever selectedEmployeeId changes
  const loadEmployeeData = useCallback(async () => {
    const data = await getEmployeeDetails(user.national_id, selectedEmployeeId);
    if (data) {
      setEmployeeData(data);
      // Check if this employee manages a unit
      const unit = await getManagedUnit(selectedEmployeeId);
      setManagedUnit(unit);
      setError(null);
    } else {
      setEmployeeData(null);
      setManagedUnit(undefined);
      // Logic for permission error vs not found
      // For now, assuming if not found via IDB it might be permission or real 404
      // We'll keep it simple
      if (user.role === 'Admin' || user.national_id === selectedEmployeeId) {
          setError("الموظف غير موجود أو لم يتم تحميل البيانات.");
      } else {
          setError("عفواً، لا تملك الصلاحية لعرض بيانات هذا الموظف.");
      }
    }
  }, [user.national_id, selectedEmployeeId, user.role]);

  useEffect(() => {
      loadEmployeeData();
  }, [loadEmployeeData]);

  // Load lists for admin views
  const loadAdminLists = useCallback(async () => {
    if (user.role === 'Admin') {
        const list = await getAllEmployees(user.national_id);
        setEmployeeList(list);
        const units = await getAllWorkUnits(user.national_id);
        setUnitsList(units);
    }
  }, [user.role, user.national_id]);

  useEffect(() => {
    if (user.role === 'Admin') {
        loadAdminLists();
    }
  }, [user.role, currentView, loadAdminLists]);

  const handleAddClick = () => {
      setModalMode('add');
      setIsModalOpen(true);
  };

  const handleEditClick = () => {
      setModalMode('edit');
      setIsModalOpen(true);
  };

  const handleSaveEmployee = async (formData: any) => {
    if (modalMode === 'add') {
        const result = await addEmployee(user.national_id, {
            national_id: formData.national_id,
            email: formData.academic_email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            job_title: formData.job_title
        });
        
        if (result.success) {
            loadAdminLists();
            // Optional: Switch to directory or show success message
            if (currentView === 'directory') setCurrentView('directory');
        } else {
            alert(result.message); // Simple alert for now
        }
    } else {
        // Edit Mode
        const result = await updateEmployee(user.national_id, selectedEmployeeId, formData);
        if (result.success) {
            loadEmployeeData(); // Refresh profile card
            loadAdminLists(); // Refresh directory if in background
        } else {
             alert(result.message);
        }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to resolve manager names for UI
  const [managerNames, setManagerNames] = useState<Record<string, string>>({});
  
  useEffect(() => {
      const fetchManagerNames = async () => {
          const names: Record<string, string> = {};
          for (const unit of unitsList) {
              if (unit.manager_id) {
                  names[unit.manager_id] = await getEmployeeNameById(unit.manager_id);
              } else if (unit.manager_national_id) {
                  names[unit.manager_national_id] = await getEmployeeNameById(unit.manager_national_id);
              }
          }
          setManagerNames(names);
      };
      if (unitsList.length > 0) fetchManagerNames();
  }, [unitsList]);


  // Determine if current user can edit the selected profile
  const canEdit = user.role === 'Admin' || user.national_id === selectedEmployeeId;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Hidden in Print */}
      <aside className="w-64 bg-white border-l border-gray-200 hidden md:flex flex-col fixed inset-y-0 right-0 z-10 print:hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
             <img src={ACADEMY_LOGO_URL} alt="Academy Logo" className="h-10 w-auto mr-2" />
             <div>
                 <h1 className="font-bold text-gray-900 leading-tight">الأكاديمية</h1>
                 <p className="text-xs text-gray-500">بوابة الموظفين</p>
             </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => {
                    setCurrentView('profile');
                    setSelectedEmployeeId(user.national_id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'profile' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <UserIcon size={20} />
                ملفي الشخصي
            </button>

            {user.role === 'Admin' && (
                <>
                    <button 
                        onClick={() => setCurrentView('directory')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'directory' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Users size={20} />
                        دليل الموظفين
                    </button>
                    <button 
                        onClick={() => setCurrentView('units')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === 'units' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Building2 size={20} />
                        جهات العمل
                    </button>
                </>
            )}
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role === 'Admin' ? 'مسؤول النظام' : 'موظف'}</p>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onLogout}>
                <LogOut size={18} className="ml-2" />
                تسجيل خروج
            </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:mr-64 p-4 md:p-8 print:mr-0 print:p-0">
        <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
            {/* Mobile Header - Hidden in Print */}
            <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm print:hidden">
                <div className="flex items-center gap-2">
                    <img src={ACADEMY_LOGO_URL} alt="Logo" className="h-8 w-auto" />
                    <div className="font-bold text-lg">الأكاديمية المهنية</div>
                </div>
                <Button size="sm" variant="ghost" onClick={onLogout}>خروج</Button>
            </div>

            {/* View Logic */}
            {currentView === 'profile' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between print:hidden">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {selectedEmployeeId === user.national_id ? 'بياناتي الشخصية' : 'بيانات الموظف'}
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={handlePrint} className="flex items-center gap-2">
                                <Printer size={18} />
                                <span className="hidden sm:inline">طباعة</span>
                            </Button>
                            {selectedEmployeeId !== user.national_id && (
                                <Button variant="secondary" onClick={() => setSelectedEmployeeId(user.national_id)}>
                                    العودة لملفي
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-red-700">
                            <ShieldAlert size={48} className="mb-4 text-red-500" />
                            <h3 className="text-lg font-semibold">خطأ في الصلاحيات</h3>
                            <p>{error}</p>
                        </div>
                    ) : employeeData ? (
                        <ProfileCard 
                            employee={employeeData} 
                            managedUnit={managedUnit} 
                            onEdit={canEdit ? handleEditClick : undefined}
                        />
                    ) : (
                        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
                    )}
                </div>
            )}

            {currentView === 'directory' && user.role === 'Admin' && (
                <div className="space-y-6 print:hidden">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">دليل الموظفين</h2>
                        <Button onClick={handleAddClick} variant="primary">
                            <UserPlus size={18} className="ml-2" />
                            إضافة موظف
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {employeeList.map(emp => (
                                <li key={emp.national_id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                            {(emp.details?.name || emp.full_name_ar).charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{emp.details?.name || emp.full_name_ar}</p>
                                            <p className="text-xs text-gray-500">{emp.details?.job_title || emp.job_title}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="secondary" 
                                        className="text-xs"
                                        onClick={() => {
                                            setSelectedEmployeeId(emp.national_id);
                                            setCurrentView('profile');
                                        }}
                                    >
                                        عرض التفاصيل
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {currentView === 'units' && user.role === 'Admin' && (
                <div className="space-y-6 print:hidden">
                    <h2 className="text-2xl font-bold text-gray-900">جهات العمل</h2>
                    <div className="grid gap-4">
                        {unitsList.map(unit => (
                            <div key={unit.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${unit.unit_type === 'DIRECTORATE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">{unit.name}</h3>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                {unitTypeLabels[unit.unit_type]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                {unit.governorate}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:border-r md:pr-6 md:mr-2 border-gray-100 min-w-[200px]">
                                    <p className="text-xs text-gray-500 mb-1">مدير الجهة</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <UserIcon size={14} />
                                        </div>
                                        <span className={`text-sm font-medium ${unit.manager_id || unit.manager_national_id ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                            {managerNames[unit.manager_id || unit.manager_national_id || ''] || 'غير محدد'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Modals */}
        <EmployeeFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveEmployee}
            mode={modalMode}
            initialData={employeeData || undefined}
        />

      </main>
    </div>
  );
};
