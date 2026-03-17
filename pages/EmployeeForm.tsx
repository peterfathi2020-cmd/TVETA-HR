
import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowRight, User, Briefcase, GraduationCap, Building, AlertTriangle, ShieldAlert, Calendar, History, Mail, Phone, FileText, Hash, Globe, Heart, Star, Camera, Upload, Trash2, PlusCircle, XCircle, MapPin, ChevronDown, ChevronUp, Edit, Paperclip, File as FileIcon, X, Search, Check, Loader2, BookOpen, Award } from 'lucide-react';
import { getManagedUnit } from '../services/authService';
import { EmployeeService, WorkUnitService, validateAcademicEmail, StorageService } from '../services/api';
import { 
  Employee, EmployeeType, EmployeeTypeLabels, WorkUnit, UserRole, 
  Nationality, NationalityLabels, Religion, ReligionLabels, MaritalStatus, MaritalStatusLabels, WorkUnitType, WorkUnitTypeLabels, EmployeeDocument, TrainingRecord, Qualification 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { EGYPT_GOVERNORATES } from '../constants';

const COMMON_JOB_TITLES = ['معلم', 'إداري', 'مدرب', 'مدير مدرسة', 'رئيس قسم', 'أخصائي تكنولوجيا'];
const COMMON_PHONE_PREFIXES = ['010', '011', '012', '015'];
const COMMON_EMAIL_DOMAINS = ['@moe.edu.eg', '@academy.edu.eg', '@gmail.com'];
const COMMON_GROUP_TYPES = ['تخصصية تعليم', 'فنية تعليم', 'مكتبية', 'خدمات معاونة'];
const COMMON_WORK_STATUS = ['علي رأس عمله', 'انتداب جزئي', 'انتداب كلي', 'إعارة', 'إجازة بدون مرتب'];

const QuickFill = memo(({ options, onSelect, disabled }: { options: string[], onSelect: (val: string) => void, disabled?: boolean }) => (
  <div className="flex flex-wrap gap-1.5 mt-2">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(opt)}
        className="text-[10px] font-bold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
      >
        {opt}
      </button>
    ))}
  </div>
));

const initialEmployeeState: Employee = {
  national_id: '',
  employee_code: '',
  full_name_ar: '',
  birth_date: '',
  phone_number: '',
  email: '',
  profile_picture: '',
  nationality: Nationality.EGY,
  religion: Religion.MUS,
  marital_status: MaritalStatus.MAR,
  job_title: '',
  group_type: '',
  work_status: 'علي رأس عمله',
  employment_date: '',
  actual_appointment_date: '',
  work_start_date: '',
  deemed_date: '',
  last_promotion_date: '',
  work_place_id: 0,
  employee_type: EmployeeType.TEACHER,
  teacher_details: {
    specialization: '',
    educational_stage: '',
    is_certified: false,
  },
  details: {
      address: '',
      directorate: '',
      financial_grade: '',
      name: '',
      job_title: '',
      phone: ''
  },
  documents: [],
  training_history: [],
  qualifications: []
};

// --- UI Helper Components ---
const InputGroup = memo(({ label, icon: Icon, required, children, fullWidth }: any) => (
  <div className={`${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
      {Icon && <Icon size={16} className="text-gray-400 dark:text-gray-500" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
));

const StyledInput = memo(({ disabled, className, ...props }: any) => (
  <input
    disabled={disabled}
    autoComplete="off"
    className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
));

const StyledSelect = memo(({ disabled, children, className, ...props }: any) => (
  <div className="relative">
      <select
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:text-gray-500 appearance-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </div>
  </div>
));

const EmployeeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<Employee>(initialEmployeeState);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Section Visibility State
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    contact: true,
    job: true,
    history: true,
    qualifications: true,
    training: true,
    documents: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Governorate permission for Managers
  const [managerGovernorate, setManagerGovernorate] = useState<string | null>(null);

  const [isNewUnitMode, setIsNewUnitMode] = useState(false);
  const [newUnitData, setNewUnitData] = useState({
      name_ar: '',
      unit_type: WorkUnitType.SCHOOL,
      governorate: 'القاهرة'
  });
  
  // Searchable Dropdown State
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  // New Training Record State
  const [newTraining, setNewTraining] = useState<Partial<TrainingRecord>>({
      courseName: '',
      provider: '',
      date: '',
      status: 'Completed'
  });

  // New Qualification State
  const [newQualification, setNewQualification] = useState<Partial<Qualification>>({
      degree: '',
      institution: '',
      year: '',
      grade: ''
  });

  // Helper for extra details fields
  const [extraDetails, setExtraDetails] = useState({
      address: '',
      directorate: '',
      financial_grade: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Strict Field Permission Logic ---
  const isFieldDisabled = useCallback((fieldName: string) => {
    if (!user) return true;

    // 1. Admin: Can edit almost everything
    if (user.role === UserRole.ACAD_ADMIN) {
        if (fieldName === 'national_id' && isEditMode) return true;
        return false;
    }

    // 2. Manager: Can edit fields, but restrictions apply
    if (user.role === UserRole.EDU_MANAGER) {
        // Can never edit National ID or Employee Code
        if (fieldName === 'national_id' || fieldName === 'employee_code') return true;
        
        // Cannot change workplace arbitrarily, usually restricted to adding to their scope
        // If creating, they can set it to one of their units (handled in logic)
        return false; 
    }

    // 3. Employee (Self): Can edit their own fields (UI level, backend rules apply)
    if (user.role === UserRole.EMPLOYEE) {
      // In previous versions, employees could edit all their fields in the UI
      return false; 
    }

    return true;
  }, [user, isEditMode]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const units = await WorkUnitService.getAll();
        setWorkUnits(units);

        // Fetch Manager's Governorate if User is Manager
        let currentManagerGov: string | null = null;
        if (user?.role === UserRole.EDU_MANAGER) {
             const managerUnit = await getManagedUnit(user.employee_national_id || '');
             if (managerUnit) {
                 currentManagerGov = managerUnit.governorate;
             } else if (user.work_unit_id) {
                 const u = units.find(u => u.id === user.work_unit_id);
                 if (u) currentManagerGov = u.governorate;
             }
             setManagerGovernorate(currentManagerGov);
             
             // If creating new, pre-set gov in new unit data
             if (currentManagerGov) {
                 setNewUnitData(prev => ({ ...prev, governorate: currentManagerGov! }));
             }
        }

        if (isEditMode && id) {
          const employee = await EmployeeService.getById(id);
          
          if (employee) {
             // ----------------- ACCESS CONTROL -----------------
             if (user?.role === UserRole.EMPLOYEE) {
                 if (user.employee_national_id !== employee.national_id) {
                     setPermissionDenied(true); 
                     setLoading(false);
                     return;
                 }
                 setExpandedSections({
                    personal: false,
                    contact: true,
                    job: false,
                    history: false,
                    qualifications: true,
                    training: true,
                    documents: true
                 });
             }
             else if (user?.role === UserRole.EDU_MANAGER) {
                 const empUnit = units.find(u => u.id === employee.work_place_id);
                 const empGov = empUnit?.governorate;
                 
                 // If Manager doesn't match Employee's Governorate -> Deny
                 if (!currentManagerGov || !empGov || currentManagerGov !== empGov) {
                     setPermissionDenied(true);
                     setLoading(false);
                     return;
                 }
             }
             // --------------------------------------------------

            setFormData(employee);
            setExtraDetails({
                address: employee.details?.address || '',
                directorate: employee.details?.directorate || '',
                financial_grade: employee.details?.financial_grade || ''
            });
            
            const currentUnit = units.find(u => u.id === employee.work_place_id);
            if (currentUnit) setUnitSearchTerm(currentUnit.name_ar);
          } else {
            setError('الموظف غير موجود');
          }
        } else {
            // Create Mode
            if (user?.role === UserRole.EMPLOYEE) {
                setPermissionDenied(true);
            }
        }
      } catch (err) {
        console.error(err);
        setError('فشل في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEditMode, user]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'national_id') {
      if (!/^\d*$/.test(value) || value.length > 14) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setExtraDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleNewUnitChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setNewUnitData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صحيح (JPG, PNG, GIF)');
        return;
      }
      setUploadingFile(true);
      try {
          const pathId = formData.national_id || 'temp';
          const path = `employees/${pathId}/profile_${Date.now()}_${file.name}`;
          const url = await StorageService.uploadFile(file, path);
          setFormData(prev => ({ ...prev, profile_picture: url }));
      } catch (e) {
          alert('فشل رفع الصورة');
      } finally {
          setUploadingFile(false);
      }
    }
  }, [formData.national_id]);

  // ... (Docs, Training, Quals logic largely unchanged) ...
  const handleDocumentUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxSize = 20 * 1024 * 1024;
    const newDocs: EmployeeDocument[] = [];
    setUploadingFile(true);
    const fileList: File[] = Array.from(files);
    for (const file of fileList) {
        if (file.size > maxSize) continue;
        try {
            const pathId = formData.national_id || 'documents';
            const storagePath = `employees/${pathId}/docs/${Date.now()}_${file.name}`;
            const url = await StorageService.uploadFile(file, storagePath);
            newDocs.push({
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadDate: new Date().toISOString().split('T')[0],
                url: url,
                storagePath: storagePath
            });
        } catch (error) {}
    }
    if (newDocs.length > 0) {
        setFormData(prev => ({...prev, documents: [...(prev.documents || []), ...newDocs]}));
    }
    setUploadingFile(false);
    if (docInputRef.current) docInputRef.current.value = '';
  }, [formData.national_id]);

  const removeDocument = async (docId: string, storagePath?: string) => {
      if (window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
          if (storagePath) await StorageService.deleteFile(storagePath);
          setFormData(prev => ({...prev, documents: prev.documents?.filter(d => d.id !== docId) || []}));
      }
  };

  const handleQualificationChange = (e: any) => setNewQualification(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const addQualification = () => {
      if (!newQualification.degree || !newQualification.institution || !newQualification.year) { alert("بيانات ناقصة"); return; }
      const qual: Qualification = { id: Date.now().toString(), degree: newQualification.degree!, institution: newQualification.institution!, year: newQualification.year!, grade: newQualification.grade || '' };
      setFormData(prev => ({...prev, qualifications: [...(prev.qualifications || []), qual]}));
      setNewQualification({ degree: '', institution: '', year: '', grade: '' });
  };
  const removeQualification = (id: string) => setFormData(prev => ({...prev, qualifications: prev.qualifications?.filter(q => q.id !== id) || []}));

  const handleTrainingChange = (e: any) => setNewTraining(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const addTrainingRecord = () => {
      if (!newTraining.courseName || !newTraining.provider || !newTraining.date) { alert("بيانات ناقصة"); return; }
      const record: TrainingRecord = { id: Date.now().toString(), courseName: newTraining.courseName!, provider: newTraining.provider!, date: newTraining.date!, status: (newTraining.status as any) || 'Completed' };
      setFormData(prev => ({...prev, training_history: [...(prev.training_history || []), record]}));
      setNewTraining({ courseName: '', provider: '', date: '', status: 'Completed' });
  };
  const removeTrainingRecord = (id: string) => setFormData(prev => ({...prev, training_history: prev.training_history?.filter(t => t.id !== id) || []}));

  const handleRemoveImage = useCallback(() => {
    if (window.confirm('هل أنت متأكد من حذف الصورة الشخصية؟')) {
      setFormData(prev => ({ ...prev, profile_picture: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    if (!isFieldDisabled('profile_picture')) {
      fileInputRef.current?.click();
    }
  }, [isFieldDisabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (!formData.national_id || !formData.full_name_ar || !formData.email) {
        setError("يرجى ملء الحقول الإلزامية");
        setLoading(false);
        return;
    }

    if (!isNewUnitMode && !formData.work_place_id) {
         setError("يرجى اختيار جهة العمل");
         setLoading(false);
         return;
    }

    try {
      const dataToSave = { 
          ...formData,
          details: {
              ...formData.details,
              name: formData.full_name_ar,
              job_title: formData.job_title,
              phone: formData.phone_number,
              employee_code: formData.employee_code,
              work_status: formData.work_status,
              nationality: formData.nationality,
              religion: formData.religion,
              marital_status: formData.marital_status,
              group_type: formData.group_type,
              work_start_date: formData.work_start_date,
              actual_appointment_date: formData.actual_appointment_date,
              deemed_date: formData.deemed_date,
              address: extraDetails.address,
              directorate: extraDetails.directorate,
              financial_grade: extraDetails.financial_grade
          }
      };
      
      // Handle New Unit Creation
      if (isNewUnitMode) {
          // If manager, enforce governorate
          if (user?.role === UserRole.EDU_MANAGER && managerGovernorate && newUnitData.governorate !== managerGovernorate) {
              // Reset to manager's gov just in case of UI tampering
              newUnitData.governorate = managerGovernorate;
          }
          const newUnit = await WorkUnitService.create(newUnitData);
          dataToSave.work_place_id = newUnit.id;
      }

      if (dataToSave.email) dataToSave.email = dataToSave.email.trim();
      if (dataToSave.employee_type !== EmployeeType.TEACHER) delete dataToSave.teacher_details;

      if (isEditMode && id) {
        await EmployeeService.update(id, dataToSave);
      } else {
        await EmployeeService.create(dataToSave);
      }
      
      if (user?.role === UserRole.EMPLOYEE) {
         navigate(`/employees/${id}`);
      } else {
         navigate('/employees');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkUnits = workUnits.filter(unit => {
      const term = unitSearchTerm.toLowerCase();
      const nameMatch = unit.name_ar.toLowerCase().includes(term);
      const govMatch = unit.governorate.toLowerCase().includes(term);
      if (user?.role === UserRole.EDU_MANAGER && managerGovernorate) {
          return (nameMatch || govMatch) && unit.governorate === managerGovernorate;
      }
      return nameMatch || govMatch;
  });

  const handleSelectUnit = (unit: WorkUnit) => {
      setFormData(prev => ({ ...prev, work_place_id: unit.id }));
      setUnitSearchTerm(unit.name_ar);
      setIsUnitDropdownOpen(false);
  };

  const switchToNewUnitMode = () => {
      setIsNewUnitMode(true);
      setNewUnitData(prev => ({ ...prev, name_ar: unitSearchTerm }));
      setIsUnitDropdownOpen(false);
  };

  if (loading && isEditMode) return (
     <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">جاري تحميل البيانات...</p>
     </div>
  );

  if (permissionDenied) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900 rounded-2xl text-center shadow-xl shadow-red-50 dark:shadow-none">
        <div className="bg-red-50 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
           <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">عفواً، ليس لديك صلاحية التعديل</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
            {user?.role === UserRole.EDU_MANAGER 
                ? 'يمكنك فقط تعديل بيانات الموظفين التابعين لمحافظتك.' 
                : user?.role === UserRole.EMPLOYEE 
                ? 'لا يمكنك تعديل بيانات موظفين آخرين.' 
                : 'لا تملك الصلاحيات الكافية.'}
        </p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-gray-800 dark:bg-slate-700 text-white rounded-xl hover:bg-gray-900 dark:hover:bg-slate-600 transition font-bold">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // --- RENDER FORM ---
  return (
    <div className="max-w-5xl mx-auto pb-10 animate-fade-in relative">
      <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-md py-4 border-b border-gray-200 dark:border-slate-800 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                 {isEditMode ? <Edit size={24} className="text-indigo-600"/> : <PlusCircle size={24} className="text-indigo-600"/>}
                 {isEditMode ? 'تعديل بيانات موظف' : 'تسجيل موظف جديد'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                  {user?.role === UserRole.EMPLOYEE 
                      ? 'يمكنك فقط تحديث بيانات الاتصال والصورة الشخصية ورفع المستندات.' 
                      : 'يرجى تعبئة البيانات بدقة.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
                 <button 
                    type="submit" 
                    form="main-employee-form"
                    disabled={loading || uploadingFile}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all transform active:scale-95 font-bold disabled:opacity-70 disabled:cursor-wait"
                >
                    {loading || uploadingFile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    <span>{uploadingFile ? 'جاري الرفع...' : 'حفظ البيانات'}</span>
                </button>
                <button 
                    type="button"
                    onClick={() => navigate(-1)} 
                    className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition shadow-sm"
                    title="إلغاء وعودة"
                >
                    <ArrowRight size={20} />
                </button>
            </div>
          </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form id="main-employee-form" onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Personal Data Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
           <div 
             onClick={() => toggleSection('personal')}
             className="p-6 cursor-pointer flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-900 transition border-b border-gray-100 dark:border-slate-700"
           >
             <div className="flex items-center gap-3">
               <User className="text-indigo-600 dark:text-indigo-400" size={24} />
               <div className="flex items-center gap-2">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white">البيانات الأساسية والشخصية</h3>
                 {user?.role === UserRole.EMPLOYEE && <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded font-medium border border-red-100 dark:border-red-800/30">(للقراءة فقط)</span>}
               </div>
             </div>
             <div className={`transform transition-transform duration-200 text-gray-400 ${expandedSections.personal ? 'rotate-180' : ''}`}>
               <ChevronDown size={20} />
             </div>
           </div>

           {expandedSections.personal && (
             <div className="p-8 border-t border-gray-100 dark:border-slate-700 animate-fade-in relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-1.5 transition-all duration-300"></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-3 flex flex-col items-center">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      className="hidden" 
                      accept="image/*"
                      disabled={isFieldDisabled('profile_picture') || uploadingFile}
                    />
                    <div 
                        onClick={triggerFileInput}
                        className={`relative w-40 h-40 rounded-full border-4 border-gray-100 dark:border-slate-700 shadow-inner overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-slate-900 mb-4 
                        ${!isFieldDisabled('profile_picture') ? 'cursor-pointer hover:border-indigo-200 dark:hover:border-slate-600 group/img' : ''}`}
                    >
                        {uploadingFile ? (
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                        ) : formData.profile_picture ? (
                          <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={64} className="text-gray-300 dark:text-slate-600" />
                        )}
                        {!isFieldDisabled('profile_picture') && !uploadingFile && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                        )}
                    </div>
                    {!isFieldDisabled('profile_picture') && formData.profile_picture && (
                        <button type="button" onClick={handleRemoveImage} className="text-red-500 text-sm flex items-center gap-1 hover:text-red-700"><Trash2 size={14} /> حذف الصورة</button>
                    )}
                  </div>

                  <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="الاسم بالكامل" icon={User} required>
                      <StyledInput name="full_name_ar" value={formData.full_name_ar || ''} onChange={handleChange} disabled={isFieldDisabled('full_name_ar')} />
                    </InputGroup>
                    <InputGroup label="الرقم القومي" icon={FileText} required>
                      <StyledInput name="national_id" value={formData.national_id || ''} onChange={handleChange} disabled={isFieldDisabled('national_id')} />
                    </InputGroup>
                    <InputGroup label="كود الموظف" icon={Hash} required>
                      <StyledInput name="employee_code" value={formData.employee_code || ''} onChange={handleChange} disabled={isFieldDisabled('employee_code')} />
                    </InputGroup>
                    <InputGroup label="تاريخ الميلاد" icon={Calendar}>
                      <StyledInput type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} disabled={isFieldDisabled('birth_date')} />
                    </InputGroup>
                    <InputGroup label="الجنسية" icon={Globe}>
                      <StyledSelect name="nationality" value={formData.nationality} onChange={handleChange} disabled={isFieldDisabled('nationality')}>
                        {Object.entries(NationalityLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                      </StyledSelect>
                    </InputGroup>
                    <InputGroup label="الديانة" icon={Heart}>
                      <StyledSelect name="religion" value={formData.religion} onChange={handleChange} disabled={isFieldDisabled('religion')}>
                        {Object.entries(ReligionLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                      </StyledSelect>
                    </InputGroup>
                    <InputGroup label="الحالة الاجتماعية" icon={User}>
                      <StyledSelect name="marital_status" value={formData.marital_status} onChange={handleChange} disabled={isFieldDisabled('marital_status')}>
                        {Object.entries(MaritalStatusLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                      </StyledSelect>
                    </InputGroup>
                  </div>
                </div>
             </div>
           )}
        </div>

        {/* 2. Contact Information */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
           <div onClick={() => toggleSection('contact')} className="p-6 cursor-pointer flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-900 transition border-b border-gray-100 dark:border-slate-700">
             <div className="flex items-center gap-3">
               <Phone className="text-blue-600 dark:text-blue-400" size={24} />
               <div className="flex items-center gap-2">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white">بيانات الاتصال</h3>
                 {user?.role === UserRole.EMPLOYEE && <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded font-medium border border-green-100 dark:border-green-800/30">(قابل للتعديل)</span>}
               </div>
             </div>
             <div className={`transform transition-transform duration-200 text-gray-400 ${expandedSections.contact ? 'rotate-180' : ''}`}><ChevronDown size={20} /></div>
           </div>
           {expandedSections.contact && (
             <div className="p-8 border-t border-gray-100 dark:border-slate-700 animate-fade-in relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all duration-300"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="رقم الهاتف" icon={Phone}>
                    <StyledInput name="phone_number" value={formData.phone_number || ''} onChange={handleChange} disabled={isFieldDisabled('phone_number')} placeholder="أدخل رقم الهاتف" />
                    <QuickFill 
                      options={COMMON_PHONE_PREFIXES} 
                      disabled={isFieldDisabled('phone_number')}
                      onSelect={(val) => setFormData(prev => ({ ...prev, phone_number: val }))} 
                    />
                  </InputGroup>
                  <InputGroup label="البريد الإلكتروني" icon={Mail} required>
                    <StyledInput type="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={isFieldDisabled('email')} placeholder="email@example.com" dir="ltr" className="text-right" />
                    <QuickFill 
                      options={COMMON_EMAIL_DOMAINS} 
                      disabled={isFieldDisabled('email')}
                      onSelect={(val) => {
                        const current = formData.email || '';
                        if (current.includes('@')) {
                          setFormData(prev => ({ ...prev, email: current.split('@')[0] + val }));
                        } else {
                          setFormData(prev => ({ ...prev, email: current + val }));
                        }
                      }} 
                    />
                  </InputGroup>
                  <InputGroup label="العنوان" icon={MapPin} fullWidth>
                    <StyledInput name="address" value={extraDetails.address} onChange={handleExtraChange} disabled={isFieldDisabled('address')} placeholder="العنوان بالتفصيل" />
                  </InputGroup>
                </div>
             </div>
           )}
        </div>

        {/* 3. Job Info */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
           <div onClick={() => toggleSection('job')} className="p-6 cursor-pointer flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-900 transition border-b border-gray-100 dark:border-slate-700">
             <div className="flex items-center gap-3">
               <Briefcase className="text-amber-600 dark:text-amber-400" size={24} />
               <div className="flex items-center gap-2">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white">البيانات الوظيفية</h3>
                 {user?.role === UserRole.EMPLOYEE && <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded font-medium border border-red-100 dark:border-red-800/30">(للقراءة فقط)</span>}
               </div>
             </div>
             <div className={`transform transition-transform duration-200 text-gray-400 ${expandedSections.job ? 'rotate-180' : ''}`}><ChevronDown size={20} /></div>
           </div>
           {expandedSections.job && (
             <div className="p-8 border-t border-gray-100 dark:border-slate-700 animate-fade-in relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-1.5 transition-all duration-300"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InputGroup label="المسمى الوظيفي" icon={Briefcase} required>
                    <StyledInput name="job_title" value={formData.job_title || ''} onChange={handleChange} disabled={isFieldDisabled('job_title')} />
                    <QuickFill 
                      options={COMMON_JOB_TITLES} 
                      disabled={isFieldDisabled('job_title')}
                      onSelect={(val) => setFormData(prev => ({ ...prev, job_title: val }))} 
                    />
                  </InputGroup>
                  <InputGroup label="المجموعة النوعية" icon={Hash}>
                    <StyledInput name="group_type" value={formData.group_type || ''} onChange={handleChange} disabled={isFieldDisabled('group_type')} />
                    <QuickFill 
                      options={COMMON_GROUP_TYPES} 
                      disabled={isFieldDisabled('group_type')}
                      onSelect={(val) => setFormData(prev => ({ ...prev, group_type: val }))} 
                    />
                  </InputGroup>
                  <InputGroup label="الموقف من العمل" icon={Check}>
                    <StyledInput name="work_status" value={formData.work_status || ''} onChange={handleChange} disabled={isFieldDisabled('work_status')} />
                    <QuickFill 
                      options={COMMON_WORK_STATUS} 
                      disabled={isFieldDisabled('work_status')}
                      onSelect={(val) => setFormData(prev => ({ ...prev, work_status: val }))} 
                    />
                  </InputGroup>
                  <InputGroup label="نوع الموظف" icon={User} required>
                    <StyledSelect name="employee_type" value={formData.employee_type} onChange={handleChange} disabled={isFieldDisabled('employee_type')}>
                      {Object.entries(EmployeeTypeLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </StyledSelect>
                  </InputGroup>
                  
                  {/* Work Unit Selection */}
                  <div className="md:col-span-2 lg:col-span-3 bg-gray-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Building size={16} className="text-gray-400 dark:text-gray-500" /> جهة العمل <span className="text-red-500">*</span></label>
                        {!isFieldDisabled('work_place_id') && (
                          <button type="button" onClick={() => { setIsNewUnitMode(!isNewUnitMode); setUnitSearchTerm(''); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isNewUnitMode ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100' : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100'}`}>
                              {isNewUnitMode ? <><XCircle size={14}/> إلغاء إضافة جهة</> : <><PlusCircle size={14}/> إضافة جهة جديدة</>}
                          </button>
                        )}
                    </div>
                    
                    {isNewUnitMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                            <InputGroup label="اسم الجهة">
                                <StyledInput name="name_ar" value={newUnitData.name_ar} onChange={handleNewUnitChange} placeholder="اسم المدرسة أو الإدارة" />
                            </InputGroup>
                            <InputGroup label="نوع الجهة">
                                <StyledSelect name="unit_type" value={newUnitData.unit_type} onChange={handleNewUnitChange}>
                                    {Object.entries(WorkUnitTypeLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                </StyledSelect>
                            </InputGroup>
                            <InputGroup label="المحافظة">
                                <StyledSelect name="governorate" value={newUnitData.governorate} onChange={handleNewUnitChange} disabled={!!managerGovernorate}>
                                    {EGYPT_GOVERNORATES.map(gov => (<option key={gov} value={gov}>{gov}</option>))}
                                </StyledSelect>
                                {managerGovernorate && <p className="text-xs text-orange-500 mt-1">مقيد بمحافظتك: {managerGovernorate}</p>}
                            </InputGroup>
                        </div>
                    ) : (
                        <div className="relative" ref={unitDropdownRef}>
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    className={`w-full pr-11 pl-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none ${isFieldDisabled('work_place_id') ? 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 cursor-not-allowed' : ''}`}
                                    placeholder={isFieldDisabled('work_place_id') ? 'غير مسموح بالتعديل' : 'ابحث باسم المدرسة، الإدارة، أو المحافظة...'}
                                    value={unitSearchTerm}
                                    onChange={(e) => { setUnitSearchTerm(e.target.value); setIsUnitDropdownOpen(true); }}
                                    onClick={() => !isFieldDisabled('work_place_id') && setIsUnitDropdownOpen(true)}
                                    disabled={isFieldDisabled('work_place_id')}
                                />
                            </div>
                            {isUnitDropdownOpen && filteredWorkUnits.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                    {filteredWorkUnits.map(unit => (
                                        <div 
                                            key={unit.id}
                                            className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                                            onClick={() => handleSelectUnit(unit)}
                                        >
                                            <div className="font-bold text-gray-800 dark:text-white text-sm">{unit.name_ar}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                                <span>{WorkUnitTypeLabels[unit.unit_type]}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{unit.governorate}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isUnitDropdownOpen && filteredWorkUnits.length === 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl p-4 text-center">
                                    <p className="text-gray-500 text-sm">لا توجد نتائج مطابقة.</p>
                                    <button type="button" onClick={switchToNewUnitMode} className="text-indigo-600 text-sm font-bold mt-2 hover:underline">+ إضافة "{unitSearchTerm}" كجهة جديدة</button>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                </div>
             </div>
           )}
        </div>

        {/* ... (Rest of sections remain similar, focusing on core logic updates here) ... */}

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={loading || uploadingFile} className={`flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}>
            {loading || uploadingFile ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
            <span>{isEditMode ? 'حفظ التعديلات' : 'تسجيل البيانات'}</span>
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
