
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Edit, User, Briefcase, GraduationCap, 
  MapPin, Calendar, Mail, Phone, BadgeCheck, ShieldCheck, Printer, Hash, 
  FileText, Image as ImageIcon, Download, File as FileIcon, Award, BookOpen, Clock, CheckCircle2,
  Sparkles, Loader2, Lightbulb, Target, TrendingUp
} from 'lucide-react';
import { EmployeeService, WorkUnitService, canEditEmployee } from '../services/api';
import { analyzeEmployeeProfileComprehensive } from '../services/geminiService';
import { 
  Employee, EmployeeType, EmployeeTypeLabels, WorkUnit, 
  NationalityLabels, ReligionLabels, MaritalStatusLabels, EducationTypeLabels, UserRole 
} from '../types';
import { useAuth } from '../context/authContext';
import { getManagedUnit } from '../services/authService';
import { ACADEMY_LOGO_URL } from '../constants';

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workUnit, setWorkUnit] = useState<WorkUnit | null>(null);
  const [unitManager, setUnitManager] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Manager context for editing permission
  const [currentManagerGov, setCurrentManagerGov] = useState<string | undefined>(undefined);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculated State
  const [ageOnOct1, setAgeOnOct1] = useState<{ years: number, months: number, days: number } | null>(null);
  const [retirementDate, setRetirementDate] = useState<string>('');
  const [birthDateFromID, setBirthDateFromID] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch employee and work units
        const [empData, unitsData] = await Promise.all([
          EmployeeService.getById(id),
          WorkUnitService.getAll()
        ]);

        if (empData) {
          setEmployee(empData);
          const unit = unitsData.find(u => u.id === empData.work_place_id);
          setWorkUnit(unit || null);

          // Fetch manager if unit has one
          if (unit && unit.manager_national_id) {
            const managerData = await EmployeeService.getById(unit.manager_national_id);
            setUnitManager(managerData || null);
          }

          // Calculate Data from National ID
          calculateDemographics(empData.national_id);

          // Determine current user's governorate if they are a manager
          if (user?.role === UserRole.EDU_MANAGER) {
             const managerUnit = await getManagedUnit(user.employee_national_id || '');
             if (managerUnit) {
                 setCurrentManagerGov(managerUnit.governorate);
             } else if (user.work_unit_id) {
                 const u = unitsData.find(u => u.id === user.work_unit_id);
                 if (u) setCurrentManagerGov(u.governorate);
             }
          }

        } else {
          setError('الموظف غير موجود');
        }
      } catch (err) {
        setError('فشل في تحميل بيانات الموظف');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const calculateDemographics = (nid: string) => {
      if (nid.length !== 14) return;

      // 1. Birth Date
      const century = nid[0] === '2' ? '19' : '20';
      const year = nid.substring(1, 3);
      const month = nid.substring(3, 5);
      const day = nid.substring(5, 7);
      const birthDateStr = `${century}${year}-${month}-${day}`;
      setBirthDateFromID(birthDateStr);

      // 2. Retirement Date (60 years)
      const retireYear = parseInt(century + year) + 60;
      setRetirementDate(`${retireYear}-${month}-${day}`);

      // 3. Age on Oct 1st of Current Year
      const currentYear = new Date().getFullYear();
      const oct1Date = new Date(currentYear, 9, 1); // Month is 0-indexed (9 = Oct)
      const birthDate = new Date(birthDateStr);

      let years = oct1Date.getFullYear() - birthDate.getFullYear();
      let months = oct1Date.getMonth() - birthDate.getMonth();
      let days = oct1Date.getDate() - birthDate.getDate();

      if (days < 0) {
          months--;
          const prevMonth = new Date(currentYear, 9, 0); // Last day of Sept
          days += prevMonth.getDate();
      }
      if (months < 0) {
          years--;
          months += 12;
      }
      
      setAgeOnOct1({ years, months, days });
  };

  const handleAiAnalyze = async () => {
      if (!employee) return;
      setIsAnalyzing(true);
      const result = await analyzeEmployeeProfileComprehensive(employee);
      setAiAnalysis(result);
      setIsAnalyzing(false);
  };

  const handlePrint = () => {
      window.print();
  };

  const handleExportWord = () => {
      if (!employee) return;
      
      const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>ملف الموظف</title></head>
        <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h1 style="text-align: center;">صحيفة أحوال موظف</h1>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
                <tr><td style="padding: 10px; border: 1px solid black; background: #f0f0f0;"><strong>الاسم</strong></td><td style="padding: 10px; border: 1px solid black;">${employee.full_name_ar}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid black; background: #f0f0f0;"><strong>الرقم القومي</strong></td><td style="padding: 10px; border: 1px solid black;">${employee.national_id}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid black; background: #f0f0f0;"><strong>الوظيفة</strong></td><td style="padding: 10px; border: 1px solid black;">${employee.job_title}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid black; background: #f0f0f0;"><strong>جهة العمل</strong></td><td style="padding: 10px; border: 1px solid black;">${workUnit?.name_ar || '-'}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid black; background: #f0f0f0;"><strong>تاريخ التعيين</strong></td><td style="padding: 10px; border: 1px solid black;">${employee.employment_date}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid black; background: #f0f0f0;"><strong>رقم الهاتف</strong></td><td style="padding: 10px; border: 1px solid black;">${employee.phone_number}</td></tr>
            </table>
            <br/>
            <p style="text-align: center; font-size: 12px; color: #666;">تم الاستخراج من نظام TVETA</p>
        </body>
        </html>
      `;
      
      const blob = new Blob(['\ufeff', content], {
          type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Employee_${employee.national_id}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadDoc = (content: string, type: string, name: string) => {
      const link = document.createElement("a");
      link.href = content;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error || !employee) return <div className="text-center p-10 text-red-500 bg-red-50 rounded-xl m-10 border border-red-100">{error || 'لم يتم العثور على الموظف'}</div>;

  const showEditButton = canEditEmployee(user, employee, workUnit || undefined, currentManagerGov);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in print:animate-none print:max-w-none print:space-y-4 pb-16 print:pb-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm;
          }
          body {
            background-color: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print-content {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            direction: rtl;
            font-family: 'Times New Roman', serif;
          }
          /* Ensure tables handle breaks better */
          tr { page-break-inside: avoid; }
          h4 { page-break-after: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* --- STRICT OFFICIAL PRINT LAYOUT (Hidden in Screen) --- */}
      <div className="hidden print:block w-full print-content font-serif text-black relative">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
              {/* Right Side: State & Ministry */}
              <div className="text-right text-sm font-bold leading-relaxed w-1/3">
                  <p>جمهورية مصر العربية</p>
                  <p>وزارة التربية والتعليم والتعليم الفني</p>
                  <p>الأكاديمية المهنية للمعلمين</p>
                  <p className="mt-2 text-xs font-normal">فرع: {workUnit?.governorate || 'المركز الرئيسي'}</p>
              </div>

              {/* Center: Logo & Title */}
              <div className="w-1/3 flex flex-col items-center justify-center">
                  <img src={ACADEMY_LOGO_URL} alt="Logo" className="h-24 w-auto object-contain mb-2" />
                  <h1 className="text-xl font-extrabold text-center underline decoration-2 underline-offset-8">
                      بيان حالة وظيفية إلكتروني
                  </h1>
                  <p className="text-xs mt-2 font-mono">رقم المستند: {employee.national_id.substring(0, 4)}-{Date.now().toString().slice(-6)}</p>
              </div>

              {/* Left Side: Photo */}
              <div className="w-1/3 flex justify-end">
                  <div className="w-32 h-40 border-2 border-black flex items-center justify-center overflow-hidden bg-white shadow-sm">
                      {employee.profile_picture ? (
                          <img src={employee.profile_picture} className="w-full h-full object-cover" alt="Personal Photo" />
                      ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                              <User size={48} />
                              <span className="text-[10px]">صورة شخصية</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <style>{`
            .print-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .print-table td, .print-table th { border: 1px solid black; padding: 6px 10px; text-align: right; font-size: 11pt; }
            .print-label { background-color: #f3f4f6 !important; font-weight: bold; width: 20%; }
            .print-header { background-color: #e5e7eb !important; font-weight: bold; text-align: center; border: 1px solid black; padding: 6px; margin-top: 15px; font-size: 12pt; }
          `}</style>

          {/* 1. Personal Data */}
          <div className="print-header">أولاً: البيانات الشخصية والأساسية</div>
          <table className="print-table">
              <tbody>
                  <tr>
                      <td className="print-label">الاسم بالكامل:</td>
                      <td colSpan={3} className="font-bold text-lg">{employee.full_name_ar}</td>
                  </tr>
                  <tr>
                      <td className="print-label">الكود الوظيفي:</td>
                      <td style={{width: '30%'}} className="font-mono font-bold text-lg">{employee.employee_code || '-'}</td>
                      <td className="print-label">الرقم القومي:</td>
                      <td className="font-mono font-bold text-lg">{employee.national_id}</td>
                  </tr>
                  <tr>
                      <td className="print-label">تاريخ الميلاد:</td>
                      <td className="font-mono">{employee.birth_date}</td>
                      <td className="print-label">السن في 1 أكتوبر:</td>
                      <td>{ageOnOct1 ? `${ageOnOct1.years} سنة و ${ageOnOct1.months} شهر` : '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">النوع:</td>
                      <td>{parseInt(employee.national_id[12]) % 2 === 0 ? 'أنثى' : 'ذكر'}</td>
                      <td className="print-label">الديانة:</td>
                      <td>{employee.religion ? ReligionLabels[employee.religion] : '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">الحالة الاجتماعية:</td>
                      <td>{employee.marital_status ? MaritalStatusLabels[employee.marital_status] : '-'}</td>
                      <td className="print-label">نوعية التعليم:</td>
                      <td>{employee.education_type ? EducationTypeLabels[employee.education_type] : '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">الجنسية:</td>
                      <td>{employee.nationality ? NationalityLabels[employee.nationality] : '-'}</td>
                      <td className="print-label">رقم الهاتف:</td>
                      <td className="font-mono">{employee.phone_number || '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">البريد الأكاديمي:</td>
                      <td className="font-mono text-xs" colSpan={3}>{employee.email || '-'}</td>
                  </tr>
              </tbody>
          </table>

          {/* 2. Work Place Data */}
          <div className="print-header">ثانياً: بيانات جهة العمل الحالية</div>
          <table className="print-table">
              <tbody>
                  <tr>
                      <td className="print-label">المديرية:</td>
                      <td style={{width: '30%'}}>{workUnit?.governorate || '-'}</td>
                      <td className="print-label">الإدارة التعليمية:</td>
                      <td>{employee.details?.directorate?.split('-')[1] || '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">جهة العمل:</td>
                      <td colSpan={3} className="font-bold">{workUnit?.name_ar || workUnit?.name || '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">نوع الجهة:</td>
                      <td>{workUnit ? EmployeeTypeLabels[employee.employee_type] : '-'}</td>
                      <td className="print-label">المرحلة التعليمية:</td>
                      <td>{employee.teacher_details?.educational_stage || 'عام'}</td>
                  </tr>
              </tbody>
          </table>

          {/* 3. Job Data */}
          <div className="print-header">ثالثاً: البيانات الوظيفية والمالية</div>
          <table className="print-table">
              <tbody>
                  <tr>
                      <td className="print-label">الوظيفة الحالية:</td>
                      <td className="font-bold">{employee.job_title}</td>
                      <td className="print-label">المجموعة النوعية:</td>
                      <td>{employee.group_type || '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">الموقف من العمل:</td>
                      <td className="font-bold">{employee.work_status || '-'}</td>
                      <td className="print-label">تاريخ التقاعد:</td>
                      <td className="font-mono text-red-600 font-bold">{retirementDate}</td>
                  </tr>
                  <tr>
                      <td className="print-label">تاريخ التعيين:</td>
                      <td className="font-mono">{employee.employment_date}</td>
                      <td className="print-label">تاريخ استلام العمل:</td>
                      <td className="font-mono">{employee.work_start_date || employee.employment_date}</td>
                  </tr>
                  <tr>
                      <td className="print-label">التاريخ الاعتباري:</td>
                      <td className="font-mono">{employee.deemed_date || '-'}</td>
                      <td className="print-label">تاريخ آخر ترقية:</td>
                      <td className="font-mono">{employee.last_promotion_date || '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">التخصص:</td>
                      <td>{employee.teacher_details?.specialization || 'عام'}</td>
                      <td className="print-label">مادة التدريس:</td>
                      <td>{employee.teacher_details?.specialization || 'عام'}</td>
                  </tr>
              </tbody>
          </table>

          {/* 4. Training History */}
          <div className="print-header">رابعاً: سجل التدريب والتطوير المهني</div>
          <table className="print-table">
              <thead>
                  <tr>
                      <th className="print-label" style={{textAlign: 'center'}}>البرنامج التدريبي</th>
                      <th className="print-label" style={{textAlign: 'center'}}>الجهة المانحة</th>
                      <th className="print-label" style={{textAlign: 'center'}}>التاريخ</th>
                      <th className="print-label" style={{textAlign: 'center'}}>الحالة</th>
                  </tr>
              </thead>
              <tbody>
                  {employee.training_history && employee.training_history.length > 0 ? (
                      employee.training_history.map((t, i) => (
                        <tr key={i}>
                            <td>{t.courseName}</td>
                            <td>{t.provider}</td>
                            <td className="font-mono text-center">{t.date}</td>
                            <td className="text-center">{t.status === 'Completed' ? 'مكتمل' : 'جاري'}</td>
                        </tr>
                      ))
                  ) : (
                      <tr><td colSpan={4} className="text-center p-2">لا توجد سجلات تدريبية مسجلة</td></tr>
                  )}
              </tbody>
          </table>

          {/* Footer / Signatures */}
          <div className="mt-12 pt-4 page-break-avoid">
              <div className="grid grid-cols-3 gap-8 text-center text-sm font-bold">
                  <div className="space-y-12">
                      <p>توقيع صاحب البيان</p>
                      <p className="border-t border-black pt-2 mx-8">........................</p>
                  </div>
                  <div className="space-y-2">
                      <p>يعتمد،،</p>
                      <p>مسئول شئون العاملين</p>
                      <p className="pt-8">........................</p>
                  </div>
                  <div className="space-y-2">
                      <p>يعتمد،،</p>
                      <p>مدير عام الإدارة / المدرسة</p>
                      <p className="pt-8">........................</p>
                  </div>
              </div>
              
              <div className="flex justify-between items-end mt-12 px-4 border-t border-gray-300 pt-4">
                   <div className="text-[10px] text-gray-500">
                       <p>تم استخراج هذا البيان إلكترونياً بتاريخ: {new Date().toLocaleString('ar-EG')}</p>
                       <p>نظام إدارة الموارد البشرية - الأكاديمية المهنية للمعلمين (TVETA)</p>
                   </div>
                   {/* Stamp Placeholder */}
                   <div className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center opacity-40 -rotate-12">
                       <span className="text-[10px] font-bold text-center">خاتم شعار الجمهورية</span>
                   </div>
              </div>
          </div>
          
          {/* Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[-1] opacity-[0.03]">
               <img src={ACADEMY_LOGO_URL} className="w-2/3 grayscale" alt="" />
          </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 print:hidden transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/employees')} 
            className="p-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-xl transition text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-600"
            title="عودة للقائمة"
          >
            <ArrowRight size={24} />
          </button>
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
               {employee.profile_picture ? (
                 <img src={employee.profile_picture} alt={employee.full_name_ar} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
                    <User size={32} />
                 </div>
               )}
             </div>
             <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ملف الموظف</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{employee.full_name_ar}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        employee.employee_type === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'
                    }`}>
                        {EmployeeTypeLabels[employee.employee_type]}
                    </span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* ... Action Buttons ... */}
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={handlePrint}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-white hover:shadow-sm transition-all"
                title="طباعة الملف الشخصي"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">طباعة الملف</span>
              </button>
              <div className="w-px bg-gray-300 dark:bg-slate-600 my-1 mx-1"></div>
              <button
                onClick={handleExportWord}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
                title="تصدير Word"
              >
                <FileText size={16} />
                <span className="hidden sm:inline">Word</span>
              </button>
          </div>

          {showEditButton && (
            <Link 
              to={`/edit/${employee.national_id}`}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100/50 dark:shadow-indigo-900/30 font-bold"
            >
              <Edit size={18} />
              <span className="hidden sm:inline">تعديل</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* AI Analysis Section */}
        <div className="lg:col-span-3">
            <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 rounded-3xl shadow-lg border border-purple-200 dark:border-purple-800/50 overflow-hidden relative group transition-colors">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 dark:bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-purple-600/10 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/5 dark:bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 group-hover:bg-fuchsia-600/10 transition-all duration-700"></div>
                
                <div className="px-8 py-5 border-b border-purple-100 dark:border-purple-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-purple-900/50 rounded-2xl text-purple-600 dark:text-purple-300 shadow-md ring-1 ring-purple-100 dark:ring-purple-800">
                            <Sparkles size={24} className="animate-pulse-slow" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-fuchsia-700 dark:from-purple-200 dark:to-fuchsia-200 text-xl">المستشار الذكي للتطوير المهني</h3>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">تحليل المهارات واقتراح مسارات الترقي الوظيفي باستخدام AI</p>
                        </div>
                    </div>
                    
                    {!aiAnalysis && !isAnalyzing && (
                        <button 
                            onClick={handleAiAnalyze}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                        >
                            <Sparkles size={18} />
                            <span>بدء التحليل الشامل</span>
                        </button>
                    )}
                </div>

                <div className="p-8 relative z-10">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-200 dark:bg-purple-800/50 rounded-full blur-xl animate-pulse"></div>
                                <div className="relative bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm">
                                    <Loader2 size={40} className="animate-spin text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                            <h4 className="mt-6 font-bold text-purple-900 dark:text-white text-lg">جاري دراسة الملف الوظيفي...</h4>
                            <p className="text-purple-600 dark:text-purple-400 text-sm mt-1">يتم الآن تحليل المؤهلات، الخبرات، والدورات التدريبية السابقة</p>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="space-y-6 animate-slide-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths Card */}
                                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all">
                                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2.5">
                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg"><CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400"/></div>
                                        نقاط القوة والتميز
                                    </h4>
                                    <ul className="space-y-3">
                                        {aiAnalysis.strengths?.map((point: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-200"></span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Gaps Card */}
                                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 hover:shadow-md transition-all">
                                    <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2.5">
                                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg"><Target size={18} className="text-amber-600 dark:text-amber-400"/></div>
                                        مجالات التطوير المقترحة
                                    </h4>
                                    <ul className="space-y-3">
                                        {aiAnalysis.skillGaps?.map((gap: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-amber-500 shrink-0 shadow-sm shadow-amber-200"></span>
                                                {gap}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations - Full Width */}
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-100 dark:border-purple-900/30 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2.5">
                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg"><TrendingUp size={18} className="text-purple-600 dark:text-purple-400"/></div>
                                        خطة العمل والتدريب الموصى بها
                                    </h4>
                                    <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800">أولوية قصوى</span>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {aiAnalysis.recommendedCourses?.map((rec: any, idx: number) => (
                                        <div key={idx} className="bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-750 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50 hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-purple-100 dark:hover:shadow-none group/card">
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className="mt-0.5"><Lightbulb size={16} className="text-purple-500 dark:text-purple-400 group-hover/card:text-purple-600 transition-colors"/></div>
                                                <span className="font-bold text-sm text-purple-900 dark:text-purple-100 leading-snug">{rec.title}</span>
                                            </div>
                                            <div className="h-px w-full bg-purple-100 dark:bg-purple-900/30 my-2"></div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">{rec.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-center pt-2">
                                <button 
                                    onClick={() => setAiAnalysis(null)}
                                    className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-bold hover:underline transition-all flex items-center gap-1"
                                >
                                    <span>تحديث التحليل</span>
                                    <ArrowRight size={14} className="rotate-180" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4">
                            <div className="max-w-2xl mx-auto">
                                <h4 className="text-lg font-bold text-purple-900 dark:text-white mb-2">لماذا نستخدم التحليل الذكي؟</h4>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                                    يقوم النظام بقراءة وتحليل بيانات الموظف (المؤهلات، الخبرات، التدريبات السابقة) ومقارنتها بمتطلبات سوق العمل والمعايير التربوية الحديثة، ليقدم لك توصيات دقيقة تساعد في اتخاذ قرارات الترقية وتحديد المسار التدريبي الأمثل.
                                </p>
                                <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-purple-700 dark:text-purple-300">
                                    <span className="bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800">✨ كشف الفجوات المهارية</span>
                                    <span className="bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800">🚀 اقتراح مسارات ترقي</span>
                                    <span className="bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800">📚 ترشيح دورات تدريبية</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* LEFT COLUMN: Personal Info */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden h-full">
            <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                <User size={20} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">البيانات الشخصية</h3>
            </div>
            <div className="p-6 space-y-5">
                
                <div className="flex flex-col gap-1 pb-4 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                    <span className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">الرقم القومي</span>
                    <span className="font-mono text-gray-800 dark:text-white font-bold text-lg tracking-wide">{employee.national_id}</span>
                </div>

                {employee.employee_code && (
                    <div className="flex flex-col gap-1 pb-4 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                        <span className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">كود الموظف</span>
                        <div className="flex items-center gap-2">
                            <Hash size={14} className="text-gray-400 dark:text-slate-500" />
                            <span className="font-mono text-gray-800 dark:text-white font-bold">{employee.employee_code}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase">الجنسية</span>
                        <span className="text-gray-800 dark:text-white font-medium text-sm">{employee.nationality ? NationalityLabels[employee.nationality] : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase">الديانة</span>
                        <span className="text-gray-800 dark:text-white font-medium text-sm">{employee.religion ? ReligionLabels[employee.religion] : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase">الحالة الاجتماعية</span>
                        <span className="text-gray-800 dark:text-white font-medium text-sm">{employee.marital_status ? MaritalStatusLabels[employee.marital_status] : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase">نوعية التعليم</span>
                        <span className="text-gray-800 dark:text-white font-medium text-sm">{employee.education_type ? EducationTypeLabels[employee.education_type] : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase">تاريخ الميلاد</span>
                        <span className="text-gray-800 dark:text-white font-medium text-sm font-mono">{birthDateFromID || employee.birth_date}</span>
                    </div>
                </div>

                {/* Calculated Age */}
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mb-1">السن في 1 أكتوبر</p>
                    {ageOnOct1 ? (
                        <p className="text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                            {ageOnOct1.years} سنة و {ageOnOct1.months} شهر
                        </p>
                    ) : (
                        <p className="text-indigo-900 dark:text-indigo-200 font-bold text-sm">-</p>
                    )}
                </div>

                <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="p-2 bg-white dark:bg-slate-600 rounded-full text-indigo-500 shadow-sm">
                            <Phone size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-slate-400 font-bold mb-0.5">رقم الهاتف</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-white font-mono" dir="ltr">{employee.phone_number || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="p-2 bg-white dark:bg-slate-600 rounded-full text-indigo-500 shadow-sm">
                            <Mail size={16} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs text-gray-400 dark:text-slate-400 font-bold mb-0.5">البريد الإلكتروني</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate font-sans" dir="ltr">{employee.email}</p>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            
            {/* Academic Qualifications Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden break-inside-avoid">
                <div className="bg-amber-50/50 dark:bg-amber-900/10 px-6 py-4 border-b border-amber-100 dark:border-amber-900/20 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                        <GraduationCap size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">المؤهلات العلمية</h3>
                </div>
                <div className="p-6">
                    {employee.qualifications && employee.qualifications.length > 0 ? (
                        <div className="space-y-4">
                            {employee.qualifications.map((qual, idx) => (
                                <div key={idx} className="flex gap-4 items-start pb-4 border-b border-gray-50 dark:border-slate-700 last:border-0 last:pb-0">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-amber-400 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{qual.degree}</h4>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{qual.institution}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{qual.year}</span>
                                            {qual.grade && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{qual.grade}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">لا توجد مؤهلات مسجلة</p>
                    )}
                </div>
            </div>
        </div>

        {/* MIDDLE & RIGHT COLUMNS: Job Info & Training */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Job Details Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <Briefcase size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">البيانات الوظيفية</h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    
                    <div className="md:col-span-2 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                        <div>
                            <p className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase mb-1">المسمى الوظيفي الحالي</p>
                            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{employee.job_title}</p>
                        </div>
                        <div className="text-left">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold block mb-1">المجموعة النوعية</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{employee.group_type || '-'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">نوع الموظف</span>
                            <span className="font-medium text-gray-800 dark:text-white text-sm">{EmployeeTypeLabels[employee.employee_type]}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">الموقف من العمل</span>
                            <span className="font-medium text-gray-800 dark:text-white text-sm">{employee.work_status || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">تاريخ التعيين</span>
                            <span className="font-medium text-gray-800 dark:text-white text-sm font-mono">{employee.employment_date}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">تاريخ استلام العمل</span>
                            <span className="font-medium text-gray-800 dark:text-white text-sm font-mono">{employee.work_start_date || '-'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">تاريخ التعيين الفعلي</span>
                            <span className="font-medium text-gray-800 dark:text-white text-sm font-mono">{employee.actual_appointment_date || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">التاريخ الاعتباري</span>
                            <span className="font-medium text-gray-800 dark:text-white text-sm font-mono">{employee.deemed_date || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">تاريخ آخر ترقية</span>
                            <span className="font-medium text-gray-800 dark:text-white text-sm font-mono">{employee.last_promotion_date || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 dark:border-slate-700 pb-2 bg-red-50 dark:bg-red-900/10 px-2 rounded">
                            <span className="text-red-500 dark:text-red-400 text-sm font-bold">تاريخ التقاعد (60 عام)</span>
                            <span className="font-bold text-red-700 dark:text-red-300 text-sm font-mono">{retirementDate || '-'}</span>
                        </div>
                        
                        <div className="pt-2">
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold mb-1">جهة العمل الحالية</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-800 dark:text-white">{workUnit?.name_ar || 'غير محدد'}</span>
                                {workUnit && (
                                    <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                                        <MapPin size={10} /> {workUnit.governorate}
                                    </span>
                                )}
                            </div>
                            {unitManager && (
                                <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                    <ShieldCheck size={12} />
                                    <span>المدير: {unitManager.full_name_ar}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Teacher Details (Conditional) */}
            {employee.employee_type === EmployeeType.TEACHER && employee.teacher_details && (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 overflow-hidden break-inside-avoid">
                    <div className="px-6 py-4 flex items-center gap-3 border-b border-indigo-100 dark:border-indigo-900/30">
                        <div className="p-2 bg-white dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 print:hidden">
                            <Award size={20} />
                        </div>
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">تفاصيل كادر المعلم</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center md:text-right">
                            <p className="text-xs text-indigo-400 dark:text-indigo-500 font-bold uppercase tracking-wider mb-1">التخصص</p>
                            <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{employee.teacher_details.specialization}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-xs text-indigo-400 dark:text-indigo-500 font-bold uppercase tracking-wider mb-1">المرحلة</p>
                            <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{employee.teacher_details.educational_stage}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-xs text-indigo-400 dark:text-indigo-500 font-bold uppercase tracking-wider mb-1">حالة الاعتماد</p>
                            {employee.teacher_details.is_certified ? (
                                <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-bold">
                                    <BadgeCheck size={16} /> معتمد
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm font-bold">
                                    غير معتمد
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Training History Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden break-inside-avoid">
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 px-6 py-4 border-b border-emerald-100 dark:border-emerald-900/20 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 print:hidden">
                        <BookOpen size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">التدريب والتطوير المهني</h3>
                </div>
                <div className="p-6">
                    {employee.training_history && employee.training_history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 rounded-r-lg">البرنامج التدريبي</th>
                                        <th className="px-4 py-3">الجهة المانحة</th>
                                        <th className="px-4 py-3">التاريخ</th>
                                        <th className="px-4 py-3 rounded-l-lg">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                    {employee.training_history.map((record, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-white text-sm">{record.courseName}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{record.provider}</td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">{record.date}</td>
                                            <td className="px-4 py-3">
                                                {record.status === 'Completed' ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded border border-green-100 dark:border-green-900/30">
                                                        <CheckCircle2 size={10} /> مكتمل
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                                                        <Clock size={10} /> جاري
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <BookOpen size={32} className="mx-auto text-gray-200 dark:text-slate-600 mb-2" />
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">لا توجد سجلات تدريبية</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Documents Section */}
            {employee.documents && employee.documents.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-purple-50/50 dark:bg-purple-900/10 px-6 py-4 border-b border-purple-100 dark:border-purple-900/20 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <FileIcon size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">المستندات والمرفقات</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employee.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-all bg-white dark:bg-slate-800 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors shrink-0">
                                        {doc.type.includes('image') ? <ImageIcon size={18} /> : <FileText size={18} />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-gray-800 dark:text-white text-sm truncate" title={doc.name}>{doc.name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDownloadDoc(doc.content, doc.type, doc.name)}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors shadow-sm"
                                    title="تحميل"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>

    </div>
  );
};

export default EmployeeDetail;
