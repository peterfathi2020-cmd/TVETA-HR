
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Employee, WorkUnit, UserRole, EmployeeType, EmployeeTypeLabels } from '../types';
import { getEmployeeDetails, getAllWorkUnits, getManagedUnit, getEmployeeNameById, updateEmployee, addEmployee } from '../services/authService';
import { WorkUnitService, EmployeeService, SeedService, AuditLogService } from '../services/api';
import { ProfileCard } from '../components/ProfileCard';
import { StaffingHeatmap } from '../components/StaffingHeatmap';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { WorkUnitFormModal } from '../components/WorkUnitFormModal';
import { AIAssistant } from '../components/AIAssistant';
import { MapView } from '../components/MapView';
import { Button } from '../components/Button';
import { VirtualList } from '../components/VirtualList';
import { 
    ShieldAlert, Building2, MapPin, Edit, Plus, User as UserIcon, 
    LayoutDashboard, Users, Award, TrendingUp, 
    BadgeCheck, Database, ArrowRight, Briefcase, GraduationCap, 
    Printer, Loader2, Sparkles, AlertTriangle, DownloadCloud, RefreshCw
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import { DatabaseService } from '../services/api';

// Lazy load heavy chart components
const DashboardCharts = React.lazy(() => import('../components/DashboardCharts'));

// ... (View type and unitTypeLabels remain same)

const StatSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
    <Skeleton className="w-12 h-12 rounded-2xl" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-32" />
    <Skeleton className="h-6 w-20 rounded-full" />
  </div>
);

type View = 'overview' | 'profile' | 'units' | 'directory' | 'ai';

const unitTypeLabels: Record<string, string> = {
    'SCHOOL': 'مدرسة',
    'EDU_DEPT': 'إدارة تعليمية',
    'DIRECTORATE': 'مديرية',
    'OTHER': 'أخرى'
};

interface DashboardProps {
    initialView?: View;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialView }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<View>(() => {
      if (initialView) return initialView;
      return (user?.role === UserRole.ACAD_ADMIN || user?.role === UserRole.EDU_MANAGER) ? 'overview' : 'profile';
  });

  // Sync view if prop changes
  useEffect(() => {
      if (initialView) setCurrentView(initialView);
  }, [initialView]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [managedUnit, setManagedUnit] = useState<WorkUnit | undefined>(undefined);
  const [managerGovernorate, setManagerGovernorate] = useState<string | null>(null);
  
  const [unitsList, setUnitsList] = useState<WorkUnit[]>([]);
  const [filterGovernorate, setFilterGovernorate] = useState<string>('');
  const [managersList, setManagersList] = useState<Employee[]>([]);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]); // For Directory View
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<WorkUnit | undefined>(undefined);
  const [showMap, setShowMap] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [managerNames, setManagerNames] = useState<Record<string, string>>({});

    useEffect(() => {
        if (currentView === 'overview' && (user?.role === UserRole.ACAD_ADMIN || user?.role === UserRole.EDU_MANAGER)) {
            EmployeeService.getAll().then(setEmployeeList).catch(console.error);
            WorkUnitService.getAll().then(setUnitsList).catch(console.error);
        }
    }, [currentView, user]);

    useEffect(() => {
        if (currentView === 'overview' && user?.role === UserRole.ACAD_ADMIN) {
            setLoadingLogs(true);
            AuditLogService.getRecent(20)
                .then(setAuditLogs)
                .catch(console.error)
                .finally(() => setLoadingLogs(false));
        }
    }, [currentView, user]);

  useEffect(() => {
      const initScope = async () => {
          if (user?.role === UserRole.EDU_MANAGER) {
              const units = await WorkUnitService.getAll();
              let gov = '';
              const managerUnit = await getManagedUnit(user.employee_national_id || '');
              if (managerUnit) {
                  gov = managerUnit.governorate;
              } else if (user.work_unit_id) {
                  const u = units.find(unit => unit.id === user.work_unit_id);
                  if (u) gov = u.governorate;
              }
              setManagerGovernorate(gov);
          }
      };
      initScope();
  }, [user]);

  useEffect(() => {
      if (currentView === 'overview' && (user?.role === UserRole.ACAD_ADMIN || (user?.role === UserRole.EDU_MANAGER && managerGovernorate))) {
          if (!stats) { // Only fetch if not already loaded to reduce redundancy
              setLoadingStats(true);
              const govFilter = user?.role === UserRole.EDU_MANAGER ? managerGovernorate || undefined : undefined;
              
              EmployeeService.getDashboardStats(govFilter)
                  .then(data => setStats(data))
                  .catch(console.error)
                  .finally(() => setLoadingStats(false));
          }
      }
  }, [user, managerGovernorate, currentView, stats]);

  const loadEmployeeData = useCallback(async () => {
    if (!user || !selectedEmployeeId) return;

    const data = await getEmployeeDetails(user.employee_national_id || '', selectedEmployeeId);
    if (data) {
      setEmployeeData(data);
      const unit = await getManagedUnit(selectedEmployeeId);
      setManagedUnit(unit);
      setError(null);
    } else {
      setEmployeeData(null);
      setManagedUnit(undefined);
      if (user.role === UserRole.ACAD_ADMIN || (user.employee_national_id && user.employee_national_id === selectedEmployeeId)) {
          setError("الموظف غير موجود أو لم يتم تحميل البيانات.");
      } else {
          setError("عفواً، لا تملك الصلاحية لعرض بيانات هذا الموظف.");
      }
    }
  }, [user, selectedEmployeeId]);

  useEffect(() => {
      if (currentView === 'profile') {
          loadEmployeeData();
      }
  }, [loadEmployeeData, currentView]);

  const loadAdminLists = useCallback(async () => {
    if (user) {
        // Optimize: Only fetch units if not loaded
        if (unitsList.length === 0) {
            let units = await getAllWorkUnits(user.employee_national_id || '');
            
            // Filter by governorate for EDU_MANAGER
            if (user.role === UserRole.EDU_MANAGER && managerGovernorate) {
                units = units.filter(u => u.governorate === managerGovernorate);
            }
            
            setUnitsList(units);
        }
        
        // Load managers for Unit Modal dropdown only when needed (e.g. units view)
        if (currentView === 'units' && managersList.length === 0) {
            const searchParams: any = { type: EmployeeType.ADMIN, page: 1, limit: 1000 };
            if (user.role === UserRole.EDU_MANAGER && managerGovernorate) {
                searchParams.governorate = managerGovernorate;
            }
            const response = await EmployeeService.search(searchParams);
            setManagersList(response.data);
        }

        // Load Employee List for Directory View or AI View only when needed
        if ((currentView === 'directory' || currentView === 'ai') && employeeList.length === 0) {
            // Using getAll for virtualization demo, but in real app would use pagination API
            // Here we use getAll to feed the VirtualList
            let allEmps = await EmployeeService.getAll(); 
            
            // Filter by governorate for EDU_MANAGER
            if (user.role === UserRole.EDU_MANAGER && managerGovernorate) {
                const units = unitsList.length > 0 ? unitsList : await getAllWorkUnits(user.employee_national_id || '');
                const relevantUnitIds = units.filter(u => u.governorate === managerGovernorate).map(u => u.id);
                allEmps = allEmps.filter(e => relevantUnitIds.includes(e.work_place_id));
            }
            
            setEmployeeList(allEmps);
        }
    }
  }, [user, currentView, unitsList.length, managersList.length, employeeList.length]);

  useEffect(() => {
    if (user && (currentView === 'units' || currentView === 'directory' || currentView === 'ai')) {
        loadAdminLists();
    }
  }, [user, currentView, loadAdminLists]);

  useEffect(() => {
      // Only fetch manager names if we have units and we are in Units view
      if (currentView === 'units' && unitsList.length > 0 && Object.keys(managerNames).length === 0) {
          const fetchManagerNames = async () => {
              const names: Record<string, string> = {};
              for (const unit of unitsList) {
                  const managerId = unit.manager_id || unit.manager_national_id;
                  if (managerId) {
                      names[managerId] = await getEmployeeNameById(managerId);
                  }
              }
              setManagerNames(names);
          };
          fetchManagerNames();
      }
  }, [unitsList, currentView, managerNames]);

  // Derived filtered units
  const uniqueGovernorates = useMemo(() => {
      const govs = new Set(unitsList.map(u => u.governorate).filter(Boolean));
      return Array.from(govs).sort();
  }, [unitsList]);

  const filteredUnits = useMemo(() => {
      if (!filterGovernorate) return unitsList;
      return unitsList.filter(u => u.governorate === filterGovernorate);
  }, [unitsList, filterGovernorate]);

  const handleEditClick = () => {
      navigate(`/edit/${selectedEmployeeId}`);
  };

  const handleAddClick = () => {
      setModalMode('add');
      setIsModalOpen(true);
  };

  const handleSaveEmployee = async (formData: any) => {
    if (!user) return;
    
    // ADD MODE
    if (modalMode === 'add') {
        const result = await addEmployee(user.employee_national_id || '', {
            national_id: formData.national_id,
            email: formData.academic_email, // Map academic_email from form to email
            password: formData.password,
            name: formData.name,
            role: formData.role,
            job_title: formData.job_title,
            work_unit_id: formData.work_unit_id
        });
        
        if (result.success) {
            alert(result.message);
            // Invalidate cache
            setEmployeeList([]);
            loadAdminLists();
        } else {
            alert(result.message);
        }
    } 
    // EDIT MODE
    else if (modalMode === 'edit') {
        const result = await updateEmployee(user.employee_national_id || '', selectedEmployeeId, formData);
        if (result.success) {
            loadEmployeeData(); 
        } else {
             alert(result.message);
        }
    }
  };

  const handleAddUnitClick = () => {
    setSelectedUnit(undefined);
    setIsUnitModalOpen(true);
  };

  const handleEditUnitClick = (unit: WorkUnit) => {
    setSelectedUnit(unit);
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (data: Partial<WorkUnit>) => {
      try {
          if (selectedUnit) {
              await WorkUnitService.update(selectedUnit.id, data);
          } else {
              if (!data.name_ar) throw new Error("Name required");
              await WorkUnitService.create(data as any);
          }
          // Invalidate units list to force reload
          setUnitsList([]);
          loadAdminLists();
      } catch (e) {
          alert('فشل حفظ البيانات');
      }
  };

  const handleGenerateForUnit = async (unitId: number, unitName: string) => {
      const countStr = prompt(`أدخل عدد الموظفين المراد إضافتهم إلى "${unitName}" (مثال: 1000):`, "1000");
      if (!countStr) return;
      
      const count = parseInt(countStr);
      if (isNaN(count) || count <= 0) {
          alert("الرقم غير صحيح");
          return;
      }

      if (count > 10000) {
          alert("للحفاظ على استقرار المتصفح، الحد الأقصى للتوليد في المرة الواحدة هو 10,000 موظف.");
          return;
      }
      
      setGenerating(true);
      setGenProgress(0);

      try {
          await SeedService.generateLargeDataset(count, (generated) => {
              setGenProgress(Math.floor((generated / count) * 100));
          }, unitId);
          alert(`تم إضافة ${count} موظف بنجاح إلى ${unitName}!`);
          setEmployeeList([]); // Clear cache
          loadAdminLists(); 
      } catch (e) {
          console.error(e);
          alert("حدث خطأ أثناء التوليد");
      } finally {
          setGenerating(false);
          setGenProgress(0);
      }
  };

  const handleStatClick = (params: string) => {
      navigate(`/employees?${params}`);
  };

  const handleBackup = async (silent = false) => {
    const toastId = silent ? undefined : 'backup-toast';
    if (!silent) toast.loading('جاري إنشاء النسخة الاحتياطية...', { id: toastId });
    try {
        const json = await DatabaseService.backup();
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        link.href = href;
        link.download = `TVETA_FULL_BACKUP_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
        if (!silent) toast.success('تم تحميل النسخة الاحتياطية بنجاح.', { id: toastId });
    } catch (e) { 
        if (!silent) toast.error('فشل إنشاء النسخة الاحتياطية.', { id: toastId });
        else console.error('Silent backup failed', e);
    }
  };


  const handlePrint = () => {
      window.print();
  };

  const renderDirectoryItem = (emp: Employee, index: number) => (
    <div key={emp.national_id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 text-sm">
                {(emp.details?.name || emp.full_name_ar).charAt(0)}
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{emp.details?.name || emp.full_name_ar}</p>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.details?.job_title || emp.job_title}</p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 rounded">{emp.national_id}</span>
                </div>
            </div>
        </div>
        <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
                setSelectedEmployeeId(emp.national_id);
                setCurrentView('profile');
            }}
        >
            عرض التفاصيل
        </Button>
    </div>
  );

  if (!user) return null;

  const canEdit = user.role === UserRole.ACAD_ADMIN || (user.employee_national_id && user.employee_national_id === selectedEmployeeId);

  // Modern Stat Card
  const StatCard = ({ title, value, icon: Icon, colorClass, gradient, subtext, linkParams }: any) => {
      const isClickable = typeof linkParams === 'string';
      return (
          <div 
          onClick={() => isClickable && handleStatClick(linkParams)}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : undefined}
          className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 group
          ${isClickable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-xl active:scale-[0.98]' : ''} bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm`}
          >
              <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl bg-gradient-to-bl ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <Icon size={32} className={colorClass} />
              </div>
              
              <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient} text-white shadow-lg shadow-indigo-500/20`}>
                      <Icon size={24} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">{title}</p>
                  <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">{value}</h3>
                  {subtext && (
                      <div className="flex items-center gap-1 mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full w-fit">
                          <TrendingUp size={12}/>
                          <span>{subtext}</span>
                      </div>
                  )}
              </div>
              {isClickable && (
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <ArrowRight size={20} className="text-slate-400 dark:text-slate-500" />
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
        
        {/* Top Header & Navigation - Responsive Sidebar Integrated */}
        <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden sticky top-20 lg:top-4 z-20 backdrop-blur-xl">
            <div className="px-4 py-2">
               <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                   {currentView === 'overview' ? (
                       user.role === UserRole.EDU_MANAGER && managerGovernorate 
                       ? `نظرة عامة - محافظة ${managerGovernorate}` 
                       : 'نظرة عامة على النظام'
                   ) : 
                    currentView === 'profile' ? 'الملف الشخصي' : 
                    currentView === 'units' ? 'إدارة جهات العمل' : 'دليل الموظفين'}
               </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl w-full sm:w-auto flex-1 sm:flex-none">
                   {(user.role === UserRole.ACAD_ADMIN || user.role === UserRole.EDU_MANAGER) && (
                       <button
                          onClick={() => setCurrentView('overview')}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                          ${currentView === 'overview' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                       >
                           <LayoutDashboard size={18} />
                           <span className="hidden sm:inline">نظرة عامة</span>
                       </button>
                   )}
                   <button
                      onClick={() => setCurrentView('profile')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                      ${currentView === 'profile' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                   >
                       <UserIcon size={18} />
                       <span className="hidden sm:inline">ملفي</span>
                   </button>
                   
                   {user.role === UserRole.EMPLOYEE && (
                        <button
                            onClick={() => navigate('/self-service')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                            <BadgeCheck size={18} />
                            <span className="hidden sm:inline">بوابة الخدمة الذاتية</span>
                        </button>
                    )}
                   
                   {(user.role === UserRole.ACAD_ADMIN || user.role === UserRole.EDU_MANAGER) && (
                       <>
                           <button
                              onClick={() => setCurrentView('directory')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                              ${currentView === 'directory' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                           >
                               <Users size={18} />
                               <span className="hidden sm:inline">الدليل</span>
                           </button>
                           <button
                              onClick={() => setCurrentView('units')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                              ${currentView === 'units' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                           >
                               <Building2 size={18} />
                               <span className="hidden sm:inline">الجهات</span>
                           </button>
                       </>
                   )}
                   
                   {/* AI Assistant Tab - Available to all */}
                   <button
                      onClick={() => setCurrentView('ai')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                      ${currentView === 'ai' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                   >
                       <Sparkles size={18} />
                       <span className="hidden sm:inline">المساعد الذكي</span>
                   </button>
                </div>
                
                {/* Print Button for Profile View */}
                {currentView === 'profile' && (
                    <button
                        onClick={handlePrint}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center transform active:scale-95"
                        title="طباعة الملف"
                    >
                        <Printer size={20} />
                    </button>
                )}
            </div>
        </div>

        {/* --- OVERVIEW VIEW --- */}
        {currentView === 'overview' && (
            <div className="space-y-8 animate-fade-in-up">
                {loadingStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
                    </div>
                ) : stats ? (
                    <>
                        {/* KPI Cards - Clickable */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard 
                                title="إجمالي الموظفين" 
                                value={stats.total} 
                                icon={Users} 
                                gradient="from-indigo-500 to-blue-600"
                                colorClass="text-indigo-600"
                                subtext="+5% نمو شهري"
                                linkParams=""
                            />
                            <StatCard 
                                title="المعلمون" 
                                value={stats.teachers} 
                                icon={Award} 
                                gradient="from-emerald-500 to-teal-600"
                                colorClass="text-emerald-600"
                                subtext={`${stats.total > 0 ? Math.round((stats.teachers/stats.total)*100) : 0}% من القوة`}
                                linkParams="type=TEACHER"
                            />
                            <StatCard 
                                title="المعلمون المعتمدون" 
                                value={stats.certified} 
                                icon={BadgeCheck} 
                                gradient="from-blue-500 to-cyan-600"
                                colorClass="text-blue-600"
                                subtext="شهادات صلاحية"
                                linkParams="type=TEACHER&certified=true"
                            />
                            <StatCard 
                                title="الإداريون" 
                                value={stats.admins} 
                                icon={Briefcase} 
                                gradient="from-purple-500 to-fuchsia-600"
                                colorClass="text-purple-600"
                                subtext={`${stats.total > 0 ? Math.round((stats.admins/stats.total)*100) : 0}% من القوة`}
                                linkParams="type=ADMIN"
                            />
                            <StatCard 
                                title="المدربون" 
                                value={stats.trainers} 
                                icon={GraduationCap} 
                                gradient="from-orange-500 to-amber-600"
                                colorClass="text-orange-600"
                                subtext="مدرب معتمد"
                                linkParams="type=TRAINER"
                            />
                            <StatCard 
                                title="تعيينات حديثة" 
                                value={stats.newHires} 
                                icon={TrendingUp} 
                                gradient="from-pink-500 to-rose-600"
                                colorClass="text-rose-600"
                                subtext="آخر سنة"
                                linkParams={`dateFrom=${new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}`}
                            />
                        </div>

                        {/* Lazy Loaded Charts Section */}
                        <Suspense fallback={
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-80 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="flex-1 w-full rounded-xl" />
                                </div>
                                <div className="h-80 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="flex-1 w-full rounded-xl" />
                                </div>
                            </div>
                        }>
                            <DashboardCharts stats={stats} onStatClick={handleStatClick} />
                        </Suspense>

                        {/* Staffing Heatmap Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <MapPin className="text-indigo-500" />
                                    خريطة العجز والزيادة التفاعلية
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">توزيع القوة البشرية ونسب العجز والزيادة حسب المحافظات.</p>
                            </div>
                            <StaffingHeatmap employees={employeeList} units={unitsList} />
                        </div>

                        {/* Audit Logs Section (Admin Only) */}
                        {user.role === UserRole.ACAD_ADMIN && (
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <ShieldAlert className="text-amber-500" />
                                            سجل التدقيق (Audit Log)
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">آخر العمليات والتحركات التي تمت على النظام.</p>
                                    </div>
                                    <RefreshCw 
                                        size={18} 
                                        className={`text-slate-400 cursor-pointer hover:text-indigo-500 transition-colors ${loadingLogs ? 'animate-spin' : ''}`}
                                        onClick={() => {
                                            setLoadingLogs(true);
                                            AuditLogService.getRecent(20).then(setAuditLogs).finally(() => setLoadingLogs(false));
                                        }}
                                    />
                                </div>
                                
                                <div className="space-y-3">
                                    {loadingLogs ? (
                                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                                    ) : auditLogs.length > 0 ? (
                                        auditLogs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50 text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' :
                                                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-red-100 text-red-600'
                                                    }`}>
                                                        {log.action === 'CREATE' ? <Plus size={14} /> : log.action === 'UPDATE' ? <Edit size={14} /> : <AlertTriangle size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 dark:text-slate-200">
                                                            {log.action === 'CREATE' ? 'إضافة' : log.action === 'UPDATE' ? 'تعديل' : 'حذف'} {log.entityType === 'EMPLOYEE' ? 'موظف' : 'جهة عمل'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">بواسطة: {log.userId}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-mono text-slate-400">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                                                    <p className="text-[10px] text-slate-400">ID: {log.entityId}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-4 text-slate-500 italic">لا توجد سجلات حالياً</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 text-gray-500">لا توجد بيانات متاحة حالياً</div>
                )}
            </div>
        )}

        {currentView === 'profile' && (
            <div className="space-y-6">
                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-red-700">
                        <ShieldAlert size={48} className="mb-4 text-red-500" />
                        <h3 className="text-lg font-semibold">خطأ في الصلاحيات</h3>
                        <p>{error}</p>
                    </div>
                ) : employeeData ? (
                    <div className="animate-slide-up">
                        <ProfileCard 
                            employee={employeeData} 
                            managedUnit={managedUnit} 
                            onEdit={canEdit ? handleEditClick : undefined}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-500 font-medium">جاري تحميل البيانات...</p>
                    </div>
                )}
            </div>
        )}

        {/* Directory View */}
        {currentView === 'directory' && (
            <div className="space-y-6 animate-fade-in print:hidden">
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">دليل الموظفين ({employeeList.length})</h2>
                    {(user.role === UserRole.ACAD_ADMIN || user.role === UserRole.EDU_MANAGER) && (
                        <Button onClick={handleAddClick} variant="primary">
                            <Plus size={18} className="ml-2" />
                            إضافة موظف
                        </Button>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Using VirtualList for optimized rendering of long lists */}
                    {employeeList.length > 0 ? (
                        <VirtualList 
                            items={employeeList}
                            height={600}
                            itemHeight={74} // Approximate height of each item
                            renderItem={renderDirectoryItem}
                        />
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            {employeeList.length === 0 ? <Loader2 className="animate-spin mx-auto mb-2" /> : 'لا يوجد موظفين'}
                            <p>{employeeList.length === 0 ? 'جاري تحميل الدليل...' : ''}</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Units View */}
        {currentView === 'units' && (
            <div className="space-y-6 print:hidden animate-fade-in">
                {/* ... (Keep existing units view logic) ... */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <MapPin size={18} />
                            </div>
                            <select
                                value={filterGovernorate}
                                onChange={(e) => setFilterGovernorate(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer font-medium text-sm"
                            >
                                <option value="">كافة المحافظات ({unitsList.length})</option>
                                {uniqueGovernorates.map(gov => (
                                    <option key={gov} value={gov}>{gov}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                            <button 
                                onClick={() => setShowMap(false)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!showMap ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                <LayoutDashboard size={14} className="inline ml-1" />
                                شبكة
                            </button>
                            <button 
                                onClick={() => setShowMap(true)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${showMap ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                <MapPin size={14} className="inline ml-1" />
                                خريطة
                            </button>
                        </div>
                    </div>
                    
                    <Button onClick={handleAddUnitClick} variant="primary">
                        <Plus size={18} className="ml-2" />
                        إضافة جهة جديدة
                    </Button>
                </div>
                
                {generating && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800 animate-fade-in mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-purple-700 dark:text-purple-300">جاري توليد البيانات...</span>
                            <span className="text-sm font-mono text-purple-600 dark:text-purple-400">{genProgress}%</span>
                        </div>
                        <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2.5">
                            <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${genProgress}%` }}></div>
                        </div>
                    </div>
                )}

                {showMap ? (
                    <MapView units={filteredUnits} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredUnits.length > 0 ? (
                            filteredUnits.map(unit => (
                                <div 
                                    key={unit.id} 
                                    className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer hover:-translate-y-1 relative"
                                    onClick={() => navigate(`/employees?workPlaceId=${unit.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    title="اضغط لعرض الموظفين"
                                >
                                    <div className="p-5 flex items-start gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${unit.unit_type === 'DIRECTORATE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{unit.name_ar || unit.name}</h3>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 font-bold">
                                                    {unitTypeLabels[unit.unit_type]}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {unit.governorate}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500 mb-1 flex items-center gap-2">
                                                <span className={`flex items-center gap-1 ${unit.manager_id || unit.manager_national_id ? 'text-gray-700 dark:text-gray-300 font-bold' : 'text-gray-400 italic'}`}>
                                                    <UserIcon size={12} />
                                                    {managerNames[unit.manager_id || unit.manager_national_id || ''] || 'مدير غير محدد'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hover Overlay for Main Click Action */}
                                    <div className="absolute inset-0 bg-indigo-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    <div 
                                        className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-2 relative z-10"
                                        onClick={(e) => e.stopPropagation()} 
                                    >
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/employees?workPlaceId=${unit.id}`);
                                            }}
                                            title="عرض قائمة الموظفين"
                                        >
                                            <Users size={16} className="ml-1" />
                                            الموظفين
                                        </Button>

                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            disabled={generating}
                                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleGenerateForUnit(unit.id, unit.name_ar);
                                            }}
                                            title="توليد عدد كبير من الموظفين لهذه الجهة"
                                        >
                                            <Database size={16} className="ml-1" />
                                            توليد
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditUnitClick(unit);
                                            }}
                                            title="تعديل بيانات الجهة"
                                        >
                                            <Edit size={16} className="ml-1" />
                                            تعديل
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                                <p>لا توجد جهات عمل في هذه المحافظة</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* AI Assistant View */}
        {currentView === 'ai' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-fade-in">
                <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="text-purple-500" />
                        المساعد الذكي
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">تحدث مع المساعد الذكي للحصول على إحصائيات، تحليلات، أو اقتراحات تدريبية.</p>
                </div>
                <AIAssistant employees={employeeList} courses={[]} />
            </div>
        )}

        {/* Google Drive Integration Info */}
        {currentView === 'overview' && (
          <div className="mt-10 pt-8 border-t-2 border-dashed border-indigo-200 dark:border-indigo-900/30">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-500 flex items-center justify-center gap-2">
                        <DownloadCloud /> ربط جوجل درايف (Google Drive)
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">إعدادات مزامنة الملفات والنماذج المرفوعة.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">حالة الربط الحالي</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                                يتم حالياً تخزين جميع الملفات والنماذج المرفوعة بشكل آمن ومشفر في <strong>Firebase Storage</strong> (سحابة جوجل للتخزين). 
                                يتم تنظيم الملفات تلقائياً في مجلدات بأسماء الموظفين (الرقم القومي) وتاريخ الرفع.
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                                لتفعيل التزامن المباشر مع مجلد <strong>Google Drive</strong> شخصي أو مؤسسي بصيغة PDF، يتطلب الأمر إعداد صلاحيات OAuth 2.0 من خلال لوحة تحكم Google Cloud (Google Cloud Console) وتوفير Client ID.
                            </p>
                        </div>
                        <Button variant="primary" onClick={() => alert('لتفعيل هذه الميزة، يرجى إعداد Google Drive API في Google Cloud Console وإضافة Client ID في إعدادات البيئة (.env).')} className="mt-4 md:mt-0 w-full md:w-auto shrink-0">
                            إعداد الربط
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {currentView === 'overview' && (
          <div className="mt-10 pt-8 border-t-2 border-dashed border-red-200 dark:border-red-900/30">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-500 flex items-center justify-center gap-2"><AlertTriangle /> منطقة الخطر</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">الإجراءات التالية لا يمكن التراجع عنها. يرجى المتابعة بحذر شديد.</p>
                </div>
                <div className="bg-red-50/50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-800/50">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">تحميل نسخة احتياطية كاملة</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">قم بتنزيل نسخة JSON كاملة من قاعدة البيانات (موظفين وجهات عمل).</p>
                        </div>
                        <Button variant="secondary" onClick={() => handleBackup()} className="mt-2 md:mt-0 w-full md:w-auto">
                            <DownloadCloud size={16} className="ml-2" />
                            تحميل الآن
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        )}

        <EmployeeFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveEmployee}
            mode={modalMode}
            initialData={modalMode === 'edit' ? employeeData || undefined : undefined}
            fixedGovernorate={user.role === UserRole.EDU_MANAGER ? managerGovernorate : undefined}
        />

        <WorkUnitFormModal
            isOpen={isUnitModalOpen}
            onClose={() => setIsUnitModalOpen(false)}
            onSave={handleSaveUnit}
            initialData={selectedUnit}
            managers={managersList}
            fixedGovernorate={user.role === UserRole.EDU_MANAGER ? managerGovernorate : undefined}
        />
    </div>
  );
};
