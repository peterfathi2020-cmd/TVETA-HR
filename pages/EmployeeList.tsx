
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useSearchParams, useNavigate, Link, Navigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Loader2, Filter, User, ShieldCheck, Eye, Edit, Trash2, Hash, 
  ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Printer, FileDown, FileSpreadsheet, 
  DownloadCloud, RefreshCw, SlidersHorizontal, X, ChevronUp, 
  ChevronDown, Search, Briefcase, Building, Clock, CheckCircle2,
  Zap, Check, Phone, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { EmployeeService, WorkUnitService, DatabaseService, SeedService } from '../services/api';
import { getManagedUnit } from '../services/authService';
import { 
  Employee, WorkUnit, UserRole, EmployeeType, EmployeeTypeLabels, 
  Religion, ReligionLabels, MaritalStatus, MaritalStatusLabels, Nationality 
} from '../types';
import { ACADEMY_LOGO_URL } from '../constants';
import { ConfirmationModal } from '../components/ConfirmationModal';
import Skeleton from '../components/Skeleton';

const ITEMS_PER_PAGE = 20;

const EmployeeSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></td>
    <td className="px-6 py-4 hidden lg:table-cell"><Skeleton className="h-6 w-16 mx-auto" /></td>
    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
    <td className="px-6 py-4 hidden xl:table-cell"><Skeleton className="h-4 w-20" /></td>
    <td className="px-6 py-4"><div className="flex justify-center gap-2"><Skeleton className="w-8 h-8 rounded-lg" /><Skeleton className="w-8 h-8 rounded-lg" /></div></td>
  </tr>
);

const EXCEL_SCHEMA = {
    NATIONAL_ID: 'الرقم القومي',
    FULL_NAME: 'الاسم رباعي',
    EMP_CODE: 'كود الموظف',
    JOB_TITLE: 'المسمى الوظيفي',
    UNIT_NAME: 'جهة العمل',
    GOV: 'المحافظة',
    DIRECTORATE: 'الإدارة/المديرية',
    ADDRESS: 'العنوان',
    PHONE: 'رقم الهاتف',
    EMAIL: 'البريد الإلكتروني',
    EMP_TYPE: 'نوع الموظف',
    HIRE_DATE: 'تاريخ التعيين',
    WORK_START: 'تاريخ استلام العمل',
    STATUS: 'الموقف من العمل',
    RELIGION: 'الديانة',
    MARITAL: 'الحالة الاجتماعية',
    DEGREE: 'المؤهل (التعيين)',
    SPECIALIZATION: 'التخصص',
    STAGE: 'المرحلة',
    ALL_QUALIFICATIONS: 'كل المؤهلات',
    TRAINING_RECORDS: 'سجل التدريب'
};

// Custom Hook for Debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized Row Component
const EmployeeRow = memo(({ emp, editingId, editForm, user, onEditClick, onQuickEditClick, onDeleteClick, onQuickEditSave, onQuickEditCancel, onEditFormChange, navigate, workUnitName }: any) => {
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onQuickEditSave(e);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onQuickEditCancel(e);
        }
    };

    return (
        <tr className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition duration-150 group print:hover:bg-transparent cursor-pointer ${editingId === emp.national_id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`} onClick={() => !editingId && navigate(`/employees/${emp.national_id}`)}>
            <td className="px-6 py-4 print:py-2 print:px-2 print:border print:border-gray-300 min-w-[220px] md:min-w-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600 print:hidden shadow-sm">
                    {emp.profile_picture ? (
                        <img src={emp.profile_picture} alt={emp.full_name_ar} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500"><User size={18} /></div>
                    )}
                </div>
                <div className="w-full min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm truncate">
                        {emp.full_name_ar}
                        {emp.teacher_details?.is_certified && <span title="معلم معتمد" className="text-green-500"><ShieldCheck size={14}/></span>}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 tracking-wider print:text-black">{emp.national_id}</div>
                    {editingId === emp.national_id && (
                        <div className="mt-2 flex items-center gap-1 animate-fade-in" onClick={e => e.stopPropagation()}>
                            <Phone size={12} className="text-indigo-500" />
                            <input 
                                autoFocus
                                value={editForm.phone_number} 
                                onChange={e => onEditFormChange(e, 'phone_number')}
                                onKeyDown={handleKeyDown}
                                className="px-2 py-1 text-xs border border-indigo-300 rounded dark:bg-slate-700 dark:border-slate-500 w-32 focus:ring-1 focus:ring-indigo-500 outline-none"
                                placeholder="رقم الهاتف"
                            />
                        </div>
                    )}
                </div>
            </div>
            </td>
            <td className="px-6 py-4 text-center print:py-2 print:px-2 print:border print:border-gray-300 hidden lg:table-cell">
                {emp.employee_code ? (<span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">{emp.employee_code}</span>) : (<span className="text-slate-300">-</span>)}
            </td>
            <td className="px-6 py-4 print:py-2 print:px-2 print:border print:border-gray-300 min-w-[150px]">
                {editingId === emp.national_id ? (
                    <input 
                        value={editForm.job_title} 
                        onChange={e => onEditFormChange(e, 'job_title')}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={handleKeyDown}
                        className="px-2 py-1 text-xs border border-indigo-300 rounded dark:bg-slate-700 dark:border-slate-500 w-full focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="المسمى الوظيفي"
                    />
                ) : (
                    <span className="text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-700/30 px-2.5 py-1 rounded-md text-xs print:bg-transparent print:p-0 print:text-black block w-fit border border-slate-100 dark:border-slate-700/50">{emp.job_title}</span>
                )}
            </td>
            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 print:py-2 print:px-2 print:border print:border-gray-300 print:text-black min-w-[150px]">
                <div className="max-w-[180px] lg:max-w-[220px] truncate print:max-w-none print:whitespace-normal text-xs font-medium" title={workUnitName}>{workUnitName}</div>
            </td>
            <td className="px-6 py-4 print:py-2 print:px-2 print:border print:border-gray-300">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap print:border-0 print:p-0 print:text-black print:font-normal ${emp.employee_type === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' : emp.employee_type === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' : 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>{EmployeeTypeLabels[emp.employee_type]}</span>
            </td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap print:py-2 print:px-2 print:border print:border-gray-300 print:text-black hidden xl:table-cell font-mono">{emp.employment_date}</td>
            <td className="px-6 py-4 print:hidden" onClick={(e) => e.stopPropagation()}>
                {editingId === emp.national_id ? (
                    <div className="flex items-center justify-center gap-2">
                        <button onClick={onQuickEditSave} className="p-1.5 text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition-colors shadow-sm" title="حفظ (Enter)"><Check size={16} /></button>
                        <button onClick={onQuickEditCancel} className="p-1.5 text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors" title="إلغاء (Esc)"><X size={16} /></button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link to={`/employees/${emp.national_id}`} className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="عرض التفاصيل"><Eye size={16} /></Link>
                        <button onClick={(e) => onQuickEditClick(e, emp)} className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors" title="تعديل سريع"><Zap size={16} /></button>
                        <Link to={`/edit/${emp.national_id}`} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="تعديل كامل"><Edit size={16} /></Link>
                        {user?.role === UserRole.ACAD_ADMIN && (<button onClick={(e) => onDeleteClick(emp.national_id, e)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="حذف"><Trash2 size={16} /></button>)}
                    </div>
                )}
            </td>
        </tr>
    );
});

const EmployeeList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);

  // Search and Filter States initialized from URL params
  const [searchTerm, setSearchTerm] = useState('');
  // Use Debounced Search Term for API Calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [filterType, setFilterType] = useState<string>(searchParams.get('type') || '');
  const [filterWorkPlace, setFilterWorkPlace] = useState<string>(searchParams.get('workPlaceId') || '');
  const [filterCertified, setFilterCertified] = useState<boolean>(searchParams.get('certified') === 'true');
  const [filterAgeMin, setFilterAgeMin] = useState<string>(searchParams.get('ageMin') || '');
  const [filterAgeMax, setFilterAgeMax] = useState<string>(searchParams.get('ageMax') || '');
  
  // Manager Specific State
  const [managerGovernorate, setManagerGovernorate] = useState<string | null>(null);

  // Advanced Filters
  const [showAdvanced, setShowAdvanced] = useState(!!searchParams.get('dateFrom') || !!searchParams.get('certified') || !!searchParams.get('ageMin'));
  const [filterJobTitle, setFilterJobTitle] = useState('');
  const [filterDirectorate, setFilterDirectorate] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  
  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const [restoring, setRestoring] = useState(false);

  // Generation State
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // Backup Reminder State
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('tveta_last_backup'));
  const [isBackupOverdue, setIsBackupOverdue] = useState(false);

  // Quick Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ job_title: '', phone_number: '' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Sync state with URL params whenever they change
  useEffect(() => {
      // We check if params exist, then we MUST update local state to reflect them
      // This allows navigation from dashboard to override current state
      if (searchParams.toString()) {
          setFilterType(searchParams.get('type') || '');
          setFilterWorkPlace(searchParams.get('workPlaceId') || '');
          
          const certParam = searchParams.get('certified');
          setFilterCertified(certParam === 'true');
          
          const dateParam = searchParams.get('dateFrom');
          setFilterDateFrom(dateParam || '');
          
          setFilterAgeMin(searchParams.get('ageMin') || '');
          setFilterAgeMax(searchParams.get('ageMax') || '');

          if (dateParam || certParam === 'true' || searchParams.get('ageMin')) {
              setShowAdvanced(true);
          }
      }
  }, [searchParams]);

  useEffect(() => {
      if (lastBackup) {
          const lastDate = new Date(lastBackup);
          const now = new Date();
          const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
          if (diffHours > 24) setIsBackupOverdue(true);
      } else {
          // If never backed up, consider it overdue
          setIsBackupOverdue(true);
      }
  }, [lastBackup]);

  // Redirect regular employees if they try to access the list
  if (user?.role === UserRole.EMPLOYEE) {
    return <Navigate to="/" replace />;
  }

  const loadWorkUnits = async () => {
      const unitData = await WorkUnitService.getAll();
      setWorkUnits(unitData);
      
      // If Manager, determine governorate
      if (user?.role === UserRole.EDU_MANAGER) {
          let gov = '';
          const managerUnit = await getManagedUnit(user.employee_national_id || '');
          
          if (managerUnit) {
              gov = managerUnit.governorate;
          } else if (user.work_unit_id) {
              const u = unitData.find(unit => unit.id === user.work_unit_id);
              if (u) gov = u.governorate;
          }
          setManagerGovernorate(gov);
      }
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      // Pass governorate if user is manager
      const searchParamsObj = {
          q: debouncedSearchTerm, // Use debounced value
          type: filterType,
          workPlaceId: filterWorkPlace,
          governorate: user?.role === UserRole.EDU_MANAGER ? (managerGovernorate || 'UNKNOWN') : undefined,
          jobTitle: filterJobTitle,
          directorate: filterDirectorate,
          dateFrom: filterDateFrom,
          dateTo: filterDateTo,
          isCertified: filterCertified,
          ageMin: filterAgeMin ? parseInt(filterAgeMin) : undefined,
          ageMax: filterAgeMax ? parseInt(filterAgeMax) : undefined,
          page: currentPage,
          limit: ITEMS_PER_PAGE
      };

      const { data, total } = await EmployeeService.search(searchParamsObj);
      setEmployees(data);
      setTotalCount(total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filterType, filterWorkPlace, filterJobTitle, filterDirectorate, filterDateFrom, filterDateTo, filterCertified, filterAgeMin, filterAgeMax, currentPage, user?.role, managerGovernorate]);

  useEffect(() => {
    loadWorkUnits();
  }, [user]);

  useEffect(() => {
    // Only fetch if managerGovernorate is resolved (or user is admin)
    if (user?.role === UserRole.EDU_MANAGER && !managerGovernorate) {
        // Wait for gov to load
        return;
    }
    fetchEmployees();
  }, [fetchEmployees, managerGovernorate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterType, filterWorkPlace, filterJobTitle, filterDirectorate, filterDateFrom, filterDateTo, filterCertified, filterAgeMin, filterAgeMax]);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await EmployeeService.delete(id);
        fetchEmployees(); // Refresh list
      } catch (err) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  }, [fetchEmployees]);

  // --- Quick Edit Handlers ---
  const handleQuickEditClick = useCallback((e: React.MouseEvent, emp: Employee) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(emp.national_id);
      setEditForm({
          job_title: emp.job_title,
          phone_number: emp.phone_number || ''
      });
  }, []);

  const handleQuickEditCancel = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(null);
  }, []);

  const handleQuickEditSaveClick = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsConfirmOpen(true);
  }, []);

  const handleEditFormChange = useCallback((e: any, field: string) => {
      setEditForm(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleConfirmSave = async () => {
      if (!editingId) return;
      try {
          // Update both root fields and nested details to ensure consistency
          const updates: any = {
              job_title: editForm.job_title,
              phone_number: editForm.phone_number,
              'details.job_title': editForm.job_title,
              'details.phone': editForm.phone_number
          };
          
          await EmployeeService.update(editingId, updates);
          
          // Optimistic Update
          setEmployees(prev => prev.map(emp => 
              emp.national_id === editingId 
              ? { 
                  ...emp, 
                  job_title: editForm.job_title, 
                  phone_number: editForm.phone_number,
                  details: {
                      ...emp.details,
                      job_title: editForm.job_title,
                      phone: editForm.phone_number
                  } as any
                } 
              : emp
          ));
          setEditingId(null);
      } catch (err) {
          console.error(err);
          alert('فشل حفظ التعديلات');
      } finally {
          setIsConfirmOpen(false);
      }
  };

  const getWorkUnitName = useCallback((id: number) => {
    return workUnits.find(u => u.id === id)?.name_ar || 'غير محدد';
  }, [workUnits]);

  // ... (Export, Import, Backup Logic)
  const handleExport = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    setIsExporting(true);
    try {
        // Search request with a very high limit to retrieve all matching records
        const { data: allData } = await EmployeeService.search({
            q: debouncedSearchTerm,
            type: filterType,
            workPlaceId: filterWorkPlace,
            governorate: user?.role === UserRole.EDU_MANAGER ? (managerGovernorate || 'UNKNOWN') : undefined,
            jobTitle: filterJobTitle,
            directorate: filterDirectorate,
            dateFrom: filterDateFrom,
            dateTo: filterDateTo,
            isCertified: filterCertified,
            ageMin: filterAgeMin ? parseInt(filterAgeMin) : undefined,
            ageMax: filterAgeMax ? parseInt(filterAgeMax) : undefined,
            page: 1,
            limit: totalCount > 0 ? totalCount + 100 : 100000 // Ensure we get everything
        });

        const exportData = allData.map(emp => {
            const unit = workUnits.find(u => u.id === emp.work_place_id);
            const allQuals = emp.qualifications?.map(q => `${q.degree} - ${q.institution} (${q.year})${q.grade ? ' [' + q.grade + ']' : ''}`).join('\r\n') || '';
            const allTraining = emp.training_history?.map(t => `${t.courseName} - ${t.provider} (${t.date})`).join('\r\n') || '';

            return {
                [EXCEL_SCHEMA.NATIONAL_ID]: emp.national_id,
                [EXCEL_SCHEMA.FULL_NAME]: emp.full_name_ar,
                [EXCEL_SCHEMA.EMP_CODE]: emp.employee_code || '',
                [EXCEL_SCHEMA.JOB_TITLE]: emp.job_title,
                [EXCEL_SCHEMA.UNIT_NAME]: unit?.name_ar || 'غير محدد',
                [EXCEL_SCHEMA.GOV]: unit?.governorate || '-',
                [EXCEL_SCHEMA.DIRECTORATE]: emp.details?.directorate || '-',
                [EXCEL_SCHEMA.ADDRESS]: emp.details?.address || '-',
                [EXCEL_SCHEMA.PHONE]: emp.phone_number || '-',
                [EXCEL_SCHEMA.EMAIL]: emp.email || '-',
                [EXCEL_SCHEMA.EMP_TYPE]: EmployeeTypeLabels[emp.employee_type],
                [EXCEL_SCHEMA.HIRE_DATE]: emp.employment_date,
                [EXCEL_SCHEMA.WORK_START]: emp.work_start_date || '-',
                [EXCEL_SCHEMA.STATUS]: emp.work_status || '-',
                [EXCEL_SCHEMA.RELIGION]: emp.religion ? ReligionLabels[emp.religion as Religion] : '-',
                [EXCEL_SCHEMA.MARITAL]: emp.marital_status ? MaritalStatusLabels[emp.marital_status as MaritalStatus] : '-',
                [EXCEL_SCHEMA.DEGREE]: emp.qualifications?.[0]?.degree || '-',
                [EXCEL_SCHEMA.SPECIALIZATION]: emp.teacher_details?.specialization || '-',
                [EXCEL_SCHEMA.STAGE]: emp.teacher_details?.educational_stage || '-',
                [EXCEL_SCHEMA.ALL_QUALIFICATIONS]: allQuals,
                [EXCEL_SCHEMA.TRAINING_RECORDS]: allTraining
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wscols = [{ wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 50 }, { wch: 50 }];
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "بيانات الموظفين");
        XLSX.writeFile(wb, `TVETA_Employees_Full_Data_${new Date().toISOString().slice(0,10)}.${format}`, { bookType: format });
    } catch (err) {
        console.error("Export Error:", err);
        alert("حدث خطأ أثناء استخراج البيانات.");
    } finally {
        setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { 
      // Implementation omitted for brevity
  };
  const handleGenerateData = async () => { 
      const countStr = prompt("أدخل عدد السجلات المراد توليدها (مثال: 5000):", "5000");
      if (!countStr) return;
      const count = parseInt(countStr);
      if (isNaN(count) || count <= 0) return;
      setGenerating(true);
      setGenProgress(0);
      try {
          await SeedService.generateLargeDataset(count, (generated) => {
              setGenProgress(Math.floor((generated / count) * 100));
          });
          alert(`تم توليد ${count} موظف بنجاح!`);
          fetchEmployees();
      } catch (e) { alert("حدث خطأ أثناء التوليد"); } 
      finally { setGenerating(false); setGenProgress(0); }
  };
  const handleBackup = async () => { 
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
        const now = new Date().toISOString();
        localStorage.setItem('tveta_last_backup', now);
        setLastBackup(now);
        setIsBackupOverdue(false);
        alert('تم تحميل النسخة الاحتياطية بنجاح.');
    } catch (e) { alert('فشل إنشاء النسخة الاحتياطية.'); }
  };
  const handleRestoreClick = () => { restoreInputRef.current?.click(); };
  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0];
      if (!file) return;
      setRestoring(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const content = evt.target?.result as string;
              const result = await DatabaseService.restore(content);
              if (result.success) { alert(result.message); window.location.reload(); } 
              else { alert(result.message); }
          } catch (e) { alert('فشل قراءة الملف.'); } 
          finally { setRestoring(false); if (restoreInputRef.current) restoreInputRef.current.value = ''; }
      };
      reader.readAsText(file);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterWorkPlace('');
    setFilterJobTitle('');
    setFilterDirectorate('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCertified(false);
    setFilterAgeMin('');
    setFilterAgeMax('');
    navigate('/employees');
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages.map((p, i) => {
      if (p === '...') {
        return <span key={`dots-${i}`} className="px-1 text-slate-400 dark:text-slate-600 font-bold">...</span>;
      }
      return (
        <button
          key={p}
          onClick={() => handlePageChange(p as number)}
          className={`w-8 h-8 rounded-lg text-sm font-bold transition-all border ${
            currentPage === p
              ? 'bg-indigo-600 text-white border-indigo-600 dark:border-indigo-500 shadow-sm transform scale-105'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          {p}
        </button>
      );
    });
  };

  const hasActiveFilters = debouncedSearchTerm || filterType || filterWorkPlace || filterJobTitle || filterDirectorate || filterDateFrom || filterDateTo || filterCertified || filterAgeMin || filterAgeMax;

  return (
    <div className="space-y-6 animate-fade-in-up pb-10 print:pb-0 print:space-y-0">
      
      {/* Backup Alert */}
      {isBackupOverdue && user?.role === UserRole.ACAD_ADMIN && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between animate-slide-up print:hidden shadow-sm">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400"><Clock size={24} /></div>
                  <div>
                      <h3 className="font-bold text-amber-800 dark:text-amber-300">تنبيه النسخ الاحتياطية</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-400">لم يتم عمل نسخة احتياطية للنظام منذ أكثر من 24 ساعة.</p>
                  </div>
              </div>
              <button onClick={handleBackup} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition shadow-sm">تحميل نسخة الآن</button>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              سجل الموظفين
              {user?.role === UserRole.EDU_MANAGER && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
                      {managerGovernorate ? `محافظة ${managerGovernorate}` : 'قطاعك'}
                  </span>
              )}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">عرض وإدارة قاعدة بيانات العاملين في المؤسسة</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 transition flex items-center gap-2 shadow-sm"><Printer size={18} /></button>

          {user?.role === UserRole.ACAD_ADMIN && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 lg:flex-none justify-center">
                <button onClick={() => handleExport('xlsx')} disabled={isExporting} className="text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition flex items-center gap-2 text-sm font-bold disabled:opacity-50">
                    {isExporting ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16} />}
                    <span className="hidden xl:inline">Excel</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="text-blue-700 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-2 text-sm font-bold relative overflow-hidden">
                    {importing ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                    <span className="hidden xl:inline">{importing ? `${importProgress}%` : 'استيراد'}</span>
                    {importing && <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all" style={{width: `${importProgress}%`}}></div>}
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button onClick={handleBackup} className="text-orange-700 dark:text-orange-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition flex items-center gap-2 text-sm font-bold">
                    <DownloadCloud size={16} />
                    <span className="hidden xl:inline">نسخ احتياطي</span>
                </button>
                <input type="file" ref={restoreInputRef} onChange={handleRestoreFileChange} className="hidden" accept=".json" />
                <button onClick={handleRestoreClick} disabled={restoring} className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 px-2 py-2 transition">
                    {restoring ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16} />}
                </button>
            </div>
          )}

          {user?.role === UserRole.ACAD_ADMIN && (
             <button onClick={handleGenerateData} disabled={generating} className="text-xs text-purple-600 font-bold underline px-2 hover:text-purple-700">
                {generating ? `${genProgress}%` : 'توليد+'}
             </button>
          )}

          <Link to="/add" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transform active:scale-95 duration-200 flex-1 lg:flex-none justify-center">
            <span className="font-bold text-lg leading-none mb-0.5">+</span>
            <span className="font-bold hidden sm:inline">إضافة جديد</span>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[600px] print:shadow-none print:border-none print:min-h-0 transition-all duration-300">
        {/* Filters Area */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 print:hidden transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><SlidersHorizontal size={18} className="text-indigo-600 dark:text-indigo-400" /><span className="font-bold">تصفية البحث</span></div>
             <div className="flex items-center gap-3">
               {hasActiveFilters && (<button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors"><X size={14} /><span>مسح</span></button>)}
               <button onClick={() => setShowAdvanced(!showAdvanced)} className={`text-xs flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg transition-colors border ${showAdvanced ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}<span>{showAdvanced ? 'بحث بسيط' : 'بحث متقدم'}</span>
               </button>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
            <div className="relative md:col-span-5">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="ابحث بالاسم، الرقم القومي، كود الموظف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-11 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition bg-white dark:bg-slate-800 dark:text-white shadow-sm"/>
            </div>
            {/* Filter selects ... */}
            <div className="md:col-span-3 relative">
              <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white dark:bg-slate-800 text-slate-700 dark:text-white cursor-pointer appearance-none shadow-sm font-medium">
                <option value="">جميع التخصصات</option>
                {Object.entries(EmployeeTypeLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
              </select>
            </div>
            <div className="md:col-span-4 relative">
              <Building className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select value={filterWorkPlace} onChange={(e) => setFilterWorkPlace(e.target.value)} className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white dark:bg-slate-800 text-slate-700 dark:text-white cursor-pointer appearance-none shadow-sm font-medium">
                <option value="">{user?.role === UserRole.EDU_MANAGER ? 'كل القطاعات (في محافظتك)' : 'جميع القطاعات'}</option>
                {workUnits.filter(u => user?.role !== UserRole.EDU_MANAGER || u.governorate === managerGovernorate).map(unit => (<option key={unit.id} value={unit.id}>{unit.name_ar}</option>))}
              </select>
            </div>
          </div>
          {/* Advanced Filters Panel */}
          {showAdvanced && (
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                <div className="relative md:col-span-3"><label className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 block">المسمى الوظيفي</label><input type="text" value={filterJobTitle} onChange={(e) => setFilterJobTitle(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-white dark:bg-slate-800 dark:text-white"/></div>
                <div className="relative md:col-span-3"><label className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 block">المديرية / الإدارة</label><input type="text" value={filterDirectorate} onChange={(e) => setFilterDirectorate(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-white dark:bg-slate-800 dark:text-white"/></div>
                <div className="relative md:col-span-2"><label className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 block">تاريخ التعيين (من)</label><input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"/></div>
                <div className="relative md:col-span-2"><label className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 block">تاريخ التعيين (إلى)</label><input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"/></div>
                <div className="relative md:col-span-2"><label className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 block">نطاق العمر</label><div className="flex gap-2"><input type="number" placeholder="من" value={filterAgeMin} onChange={(e) => setFilterAgeMin(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" /><input type="number" placeholder="إلى" value={filterAgeMax} onChange={(e) => setFilterAgeMax(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none" /></div></div>
                <div className="relative md:col-span-12 flex items-center pt-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                        <input type="checkbox" checked={filterCertified} onChange={(e) => setFilterCertified(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">معلم معتمد فقط</span>
                    </label>
                </div>
             </div>
          )}
        </div>

        {/* Content Area - Table */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 md:bg-white md:dark:bg-slate-800 md:rounded-b-2xl overflow-hidden print:bg-white print:overflow-visible">
            
            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4 p-4 print:hidden">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                        </div>
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <div className="flex gap-2"><Skeleton className="h-10 flex-1 rounded-xl" /><Skeleton className="h-10 w-12 rounded-xl" /><Skeleton className="h-10 flex-1 rounded-xl" /></div>
                      </div>
                    ))
                ) : employees.length === 0 ? (
                    <div className="text-center p-10 text-slate-500 flex flex-col items-center"><Filter size={32} className="text-slate-300 mb-2" />لا توجد نتائج</div>
                ) : (
                    employees.map(emp => (
                        <div key={emp.national_id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            {editingId === emp.national_id ? (
                                <div className="space-y-4 animate-fade-in bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-100 dark:border-indigo-800/30">
                                        <Zap size={18} className="text-amber-500" />
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">تعديل سريع</span>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">المسمى الوظيفي</label>
                                        <input 
                                            value={editForm.job_title}
                                            onChange={e => handleEditFormChange(e, 'job_title')}
                                            className="w-full px-3 py-2.5 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="المسمى الوظيفي"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">رقم الهاتف</label>
                                        <input 
                                            value={editForm.phone_number}
                                            onChange={e => handleEditFormChange(e, 'phone_number')}
                                            className="w-full px-3 py-2.5 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="رقم الهاتف"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleQuickEditSaveClick} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-green-700 transition"><Check size={16}/> حفظ</button>
                                        <button onClick={handleQuickEditCancel} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-600 transition"><X size={16}/> إلغاء</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600">
                                                {emp.profile_picture ? (
                                                    <img src={emp.profile_picture} alt={emp.full_name_ar} className="w-full h-full object-cover" loading="lazy" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500"><User size={24}/></div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm">{emp.full_name_ar}</h3>
                                                <p className="text-xs text-slate-500 font-mono">{emp.national_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border whitespace-nowrap ${emp.employee_type === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : emp.employee_type === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>
                                                {EmployeeTypeLabels[emp.employee_type]}
                                            </span>
                                            {emp.teacher_details?.is_certified && <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 flex items-center gap-1"><ShieldCheck size={10}/> معتمد</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex justify-between"><span className="text-slate-400 text-xs font-bold">المسمى الوظيفي</span><span className="font-medium text-xs">{emp.job_title}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 text-xs font-bold">جهة العمل</span><span className="font-medium text-right max-w-[60%] truncate text-xs">{getWorkUnitName(emp.work_place_id)}</span></div>
                                    </div>
                                    <div className="pt-2 flex justify-end gap-2">
                                        <Link to={`/employees/${emp.national_id}`} className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl flex items-center justify-center gap-1 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"><Eye size={16}/> التفاصيل</Link>
                                        <button onClick={(e) => handleQuickEditClick(e, emp)} className="w-12 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"><Zap size={18}/></button>
                                        <Link to={`/edit/${emp.national_id}`} className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl flex items-center justify-center gap-1 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><Edit size={16}/> تعديل</Link>
                                        {user?.role === UserRole.ACAD_ADMIN && (<button onClick={(e) => handleDelete(emp.national_id, e)} className="w-12 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><Trash2 size={18}/></button>)}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto print:block print:overflow-visible">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50/80 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-xs font-bold border-b border-slate-100 dark:border-slate-700 uppercase tracking-wider print:bg-gray-100 print:text-black">
                    <tr>
                        <th className="px-6 py-4 whitespace-nowrap print:py-2 print:px-2 print:border print:border-gray-300 rounded-tr-lg">الاسم / الرقم القومي</th>
                        <th className="px-6 py-4 whitespace-nowrap print:py-2 print:px-2 print:border print:border-gray-300 text-center hidden lg:table-cell">الكود</th>
                        <th className="px-6 py-4 whitespace-nowrap print:py-2 print:px-2 print:border print:border-gray-300">المسمى الوظيفي</th>
                        <th className="px-6 py-4 whitespace-nowrap print:py-2 print:px-2 print:border print:border-gray-300">جهة العمل</th>
                        <th className="px-6 py-4 whitespace-nowrap print:py-2 print:px-2 print:border print:border-gray-300">نوع الموظف</th>
                        <th className="px-6 py-4 whitespace-nowrap print:py-2 print:px-2 print:border print:border-gray-300 hidden xl:table-cell">تاريخ التعيين</th>
                        <th className="px-6 py-4 whitespace-nowrap text-center print:hidden rounded-tl-lg">إجراءات</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 print:divide-y-0">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => <EmployeeSkeleton key={i} />)
                    ) : employees.length === 0 ? (
                        <tr><td colSpan={7} className="text-center p-20 text-slate-500 dark:text-slate-400"><div className="flex flex-col items-center justify-center"><div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-full mb-3"><Filter size={32} className="text-slate-300 dark:text-slate-500" /></div><p className="font-bold text-slate-600 dark:text-slate-300">لا توجد نتائج</p></div></td></tr>
                    ) : (
                        employees.map((emp) => (
                            <EmployeeRow 
                                key={emp.national_id}
                                emp={emp}
                                editingId={editingId}
                                editForm={editForm}
                                user={user}
                                onEditClick={handleQuickEditClick}
                                onQuickEditClick={handleQuickEditClick}
                                onDeleteClick={handleDelete}
                                onQuickEditSave={handleQuickEditSaveClick}
                                onQuickEditCancel={handleQuickEditCancel}
                                onEditFormChange={handleEditFormChange}
                                navigate={navigate}
                                workUnitName={getWorkUnitName(emp.work_place_id)}
                            />
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
        {/* Pagination logic */}
        {!loading && totalCount > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex flex-col items-center sm:items-start gap-1">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} من أصل {totalCount} سجل
                </span>
                {totalPages > 1 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        الصفحة {currentPage} من {totalPages}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-1">
                {/* First Page */}
                <button 
                    onClick={() => handlePageChange(1)} 
                    disabled={currentPage === 1} 
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="الصفحة الأولى"
                >
                    <ChevronsRight size={18} />
                </button>
                
                {/* Previous Page */}
                <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1} 
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="الصفحة السابقة"
                >
                    <ChevronRight size={18} />
                </button>

                <div className="flex items-center gap-1 px-1">
                    {renderPageNumbers()}
                </div>

                {/* Next Page */}
                <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages} 
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="الصفحة التالية"
                >
                    <ChevronLeft size={18} />
                </button>

                {/* Last Page */}
                <button 
                    onClick={() => handlePageChange(totalPages)} 
                    disabled={currentPage === totalPages} 
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="الصفحة الأخيرة"
                >
                    <ChevronsLeft size={18} />
                </button>
            </div>
          </div>
        )}
      </div>
      
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="تأكيد التعديل"
        message="هل أنت متأكد من حفظ التغييرات على بيانات الموظف؟"
        confirmText="حفظ التعديلات"
        cancelText="تراجع"
      />
    </div>
  );
};

export default EmployeeList;
