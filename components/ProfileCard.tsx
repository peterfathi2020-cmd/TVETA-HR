
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, WorkUnit } from '../types';
import { User, Briefcase, Building2, Printer, Calendar, ChevronDown, Edit, Sparkles, BrainCircuit, Target, CheckCircle, AlertTriangle, Loader2, FileText, Upload, Trash2, ExternalLink, TrendingUp, Clock, Award, PlusCircle } from 'lucide-react';
import { analyzeEmployeeProfileComprehensive } from '../services/geminiService';
import { Button } from './Button';
import { ACADEMY_LOGO_URL, EGYPT_GOVERNORATES } from '../constants';
import { EmployeeService, StorageService, PromotionService } from '../services/api';
import toast from 'react-hot-toast';

interface ProfileCardProps {
  employee: Employee;
  managedUnit?: WorkUnit;
  onEdit?: () => void;
  onEnroll?: (courseTitle: string) => Promise<void>;
}

const unitTypeLabels: Record<string, string> = {
    'SCHOOL': 'مدرسة',
    'EDU_DEPT': 'إدارة تعليمية',
    'DIRECTORATE': 'مديرية',
    'OTHER': 'جهة أخرى'
};

const nationalityLabels: Record<string, string> = {
    'EGY': 'مصري',
    'OTH': 'أخرى'
};

const religionLabels: Record<string, string> = {
    'MUS': 'مسلم',
    'CHR': 'مسيحي',
    'OTH': 'أخرى'
};

const maritalStatusLabels: Record<string, string> = {
    'SIN': 'أعزب',
    'MAR': 'متزوج',
    'DIV': 'مطلق',
    'WID': 'أرمل'
};

// Helper to get Gov Name from ID (simplified mapping for demo)
const getGovFromID = (nid: string) => {
    if (!nid || nid.length !== 14) return '-';
    const code = nid.substring(7, 9);
    // Simple mapping for common codes (Real list is longer)
    const govMap: Record<string, string> = {
        '01': 'القاهرة', '02': 'الإسكندرية', '03': 'بورسعيد', '04': 'السويس', '11': 'دمياط',
        '12': 'الدقهلية', '13': 'الشرقية', '14': 'القليوبية', '15': 'كفر الشيخ', '16': 'الغربية',
        '17': 'المنوفية', '18': 'البحيرة', '19': 'الإسماعيلية', '21': 'الجيزة', '22': 'بني سويف',
        '23': 'الفيوم', '24': 'المنيا', '25': 'أسيوط', '26': 'سوهاج', '27': 'قنا', '28': 'أسوان',
        '29': 'الأقصر', '31': 'البحر الأحمر', '32': 'الوادي الجديد', '33': 'مطروح', '34': 'شمال سيناء', '35': 'جنوب سيناء'
    };
    return govMap[code] || 'غير محدد';
};

const getGenderFromID = (nid: string) => {
    if (!nid || nid.length !== 14) return '-';
    const digit = parseInt(nid.substring(12, 13));
    return digit % 2 === 0 ? 'أنثى' : 'ذكر';
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ employee, managedUnit, onEdit, onEnroll }) => {
  const { role } = employee;
  const details = employee.details || {} as any; // Safe fallback

  // State to track expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    job: true,
    dates: true,
    contact: true,
    documents: false,
    promotion: false,
    aiAnalysis: false
  });

  const [isUploading, setIsUploading] = useState(false);
  const promotionInfo = PromotionService.calculateNextPromotion(employee);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const path = `employees/${employee.national_id}/documents/${Date.now()}_${file.name}`;
        const url = await StorageService.uploadFile(file, path);
        
        const newDoc = {
            id: Date.now().toString(),
            name: file.name,
            type: file.type,
            url: url,
            storagePath: path,
            size: file.size,
            uploadDate: new Date().toISOString()
        };

        const updatedDocs = [...(employee.documents || []), newDoc];
        await EmployeeService.update(employee.national_id, { documents: updatedDocs });
        toast.success('تم رفع المستند بنجاح');
        // Note: In a real app, we'd trigger a refresh of the employee data
    } catch (error) {
        console.error("Upload failed:", error);
        toast.error('فشل رفع المستند');
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, storagePath?: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

    try {
        if (storagePath) {
            await StorageService.deleteFile(storagePath);
        }
        const updatedDocs = (employee.documents || []).filter(d => d.id !== docId);
        await EmployeeService.update(employee.national_id, { documents: updatedDocs });
        toast.success('تم حذف المستند');
    } catch (error) {
        console.error("Delete failed:", error);
        toast.error('فشل حذف المستند');
    }
  };

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null); // Clear previous results
    const result = await analyzeEmployeeProfileComprehensive(employee);
    setAnalysisResult(result);
    setIsAnalyzing(false);
    // Expand the section automatically after analysis
    if (result && !result.error) {
        setExpandedSections(prev => ({ ...prev, aiAnalysis: true }));
    }
  };

  // Helper component for collapsible sections (Screen View)
  const Section = ({ 
    id, 
    title, 
    children,
    icon: Icon,
    accentColor = "brand-500"
  }: React.PropsWithChildren<{ 
    id: keyof typeof expandedSections, 
    title: string,
    icon?: React.ElementType,
    accentColor?: string
  }>) => (
    <div className="mt-6 print:hidden">
        <div 
            className="flex items-center justify-between cursor-pointer group mb-2 select-none p-2 rounded-lg hover:bg-brand-800/50 transition-colors" 
            onClick={() => toggleSection(id)}
        >
            <div className="flex items-center gap-3">
                <div className={`w-1 h-6 rounded-full ${accentColor === 'purple-500' ? 'bg-purple-500' : 'bg-brand-500'}`} />
                {Icon && <Icon size={20} className={accentColor === 'purple-500' ? 'text-purple-400' : 'text-brand-400'} />}
                <h3 className="text-lg font-bold text-brand-50 group-hover:text-brand-300 transition-colors">
                    {title}
                </h3>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {expandedSections[id] ? "طي" : "توسيع"}
                </span>
                <div className={`text-brand-400 group-hover:text-brand-200 p-1 rounded-full transition-transform duration-300 ${expandedSections[id] ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </div>
        </div>
        <AnimatePresence initial={false}>
            {expandedSections[id] && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <div className="pt-2 pb-4">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );

  const DataItem = ({ label, value, fullWidth = false, mono = false }: { label: string, value: React.ReactNode, fullWidth?: boolean, mono?: boolean }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-brand-800 rounded-lg border border-brand-700/50 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
       <span className="text-brand-300 font-medium text-sm sm:w-32 shrink-0">{label}:</span>
       <span className={`text-white font-semibold ${mono ? 'font-mono' : ''}`}>{value || '--'}</span>
   </div>
 );

  return (
    <div className="bg-brand-900 rounded-xl shadow-lg border border-brand-800 overflow-hidden print:bg-white print:shadow-none print:border-0 print:rounded-none print:w-full print:text-black">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            background-color: white !important; 
            margin: 0; 
            padding: 0; 
          }
          #root { width: 100%; margin: 0; padding: 0; }
          .print-container { 
            width: 100%; 
            max-width: 100%;
            margin: 0 auto; 
            direction: rtl; 
            font-family: 'Cairo', 'Times New Roman', serif; 
            color: #000;
          }
          .print-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 11pt; 
            margin-bottom: 12px; 
            page-break-inside: avoid;
          }
          .print-table td, .print-table th { 
            border: 1px solid #000; 
            padding: 5px 8px; 
            vertical-align: middle;
            text-align: right;
          }
          .print-label { 
            background-color: #f3f4f6 !important; 
            font-weight: bold; 
            width: 16%; 
            white-space: nowrap; 
          }
          .print-header { 
            background-color: #e5e7eb !important; 
            font-weight: bold; 
            text-align: center; 
            border: 1px solid #000; 
            border-bottom: none; 
            padding: 6px; 
            margin-top: 14px;
            margin-bottom: 0; 
            font-size: 12pt; 
          }
          .no-print { display: none !important; }
          img { -webkit-print-color-adjust: exact !important; }
        }
      `}</style>

      {/* ================= PRINT VIEW (MATCHING OFFICIAL DOCUMENT) ================= */}
      <div className="hidden print:block print-container relative">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
              {/* Right Side: State & Ministry */}
              <div className="text-right text-sm font-bold leading-relaxed w-1/3">
                  <p>جمهورية مصر العربية</p>
                  <p>وزارة التربية والتعليم والتعليم الفني</p>
                  <p>الأكاديمية المهنية للمعلمين</p>
                  <p className="mt-2 text-xs font-normal">فرع: {employee.details?.directorate?.split('-')[0] || 'المركز الرئيسي'}</p>
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
                      <td style={{width: '35%'}} className="font-mono font-bold text-lg">{employee.employee_code || '-'}</td>
                      <td className="print-label">الرقم القومي:</td>
                      <td className="font-mono font-bold text-lg">{employee.national_id}</td>
                  </tr>
                  <tr>
                      <td className="print-label">تاريخ الميلاد:</td>
                      <td className="font-mono">{employee.birth_date}</td>
                      <td className="print-label">محل الميلاد:</td>
                      <td>{getGovFromID(employee.national_id)}</td>
                  </tr>
                  <tr>
                      <td className="print-label">النوع:</td>
                      <td>{getGenderFromID(employee.national_id)}</td>
                      <td className="print-label">الديانة:</td>
                      <td>{employee.religion ? religionLabels[employee.religion] : '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">الحالة الاجتماعية:</td>
                      <td>{employee.marital_status ? maritalStatusLabels[employee.marital_status] : '-'}</td>
                      <td className="print-label">الجنسية:</td>
                      <td>{employee.nationality ? nationalityLabels[employee.nationality] : '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">رقم الهاتف:</td>
                      <td className="font-mono">{employee.phone_number || '-'}</td>
                      <td className="print-label">البريد الأكاديمي:</td>
                      <td className="font-mono text-xs">{employee.email || '-'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">العنوان الحالي:</td>
                      <td colSpan={3}>{details.address || '-'}</td>
                  </tr>
              </tbody>
          </table>

          {/* 2. Work Place Data */}
          <div className="print-header">ثانياً: بيانات جهة العمل الحالية</div>
          <table className="print-table">
              <tbody>
                  <tr>
                      <td className="print-label">المديرية:</td>
                      <td style={{width: '35%'}}>{details.directorate?.includes('-') ? details.directorate.split('-')[0] : (details.directorate || '-')}</td>
                      <td className="print-label">الإدارة التعليمية:</td>
                      <td>{details.directorate?.includes('-') ? details.directorate.split('-')[1] : (details.directorate || '-')}</td>
                  </tr>
                  <tr>
                      <td className="print-label">جهة العمل:</td>
                      <td colSpan={3} className="font-bold">{managedUnit?.name_ar || managedUnit?.name || 'مدرسة ...'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">نوع الجهة:</td>
                      <td>{unitTypeLabels[managedUnit?.unit_type || 'SCHOOL']}</td>
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
                      <td>{employee.group_type || details.group_type || 'المجموعة النوعية لوظائف التعليم'}</td>
                  </tr>
                  <tr>
                      <td className="print-label">الدرجة المالية:</td>
                      <td>{details.financial_grade || '-'}</td>
                      <td className="print-label">الموقف من العمل:</td>
                      <td className="font-bold">{employee.work_status || details.work_status}</td>
                  </tr>
                  <tr>
                      <td className="print-label">تاريخ التعيين:</td>
                      <td className="font-mono">{employee.employment_date}</td>
                      <td className="print-label">تاريخ استلام العمل:</td>
                      <td className="font-mono">{employee.work_start_date || details.work_start_date || employee.employment_date}</td>
                  </tr>
                  <tr>
                      <td className="print-label">التاريخ الاعتباري:</td>
                      <td className="font-mono">{employee.deemed_date || details.deemed_date || employee.employment_date}</td>
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

          {/* 4. Qualification Data */}
          <div className="print-header">رابعاً: المؤهلات العلمية</div>
          <table className="print-table">
              <thead>
                  <tr>
                      <th className="print-label" style={{textAlign: 'center'}}>المؤهل</th>
                      <th className="print-label" style={{textAlign: 'center'}}>الجامعة / المؤسسة</th>
                      <th className="print-label" style={{textAlign: 'center'}}>سنة التخرج</th>
                      <th className="print-label" style={{textAlign: 'center'}}>التقدير</th>
                  </tr>
              </thead>
              <tbody>
                  {employee.qualifications && employee.qualifications.length > 0 ? (
                      employee.qualifications.map((q, i) => (
                        <tr key={i}>
                            <td>{q.degree}</td>
                            <td>{q.institution}</td>
                            <td className="font-mono text-center">{q.year}</td>
                            <td className="text-center">{q.grade || '-'}</td>
                        </tr>
                      ))
                  ) : (
                      <tr><td colSpan={4} className="text-center p-2">لا توجد مؤهلات مسجلة</td></tr>
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


      {/* ================= SCREEN VIEW ================= */}
      
      {/* Screen Header - Hidden in Print */}
      <div className="bg-brand-800 h-32 w-full relative print:hidden">
        <div className="absolute top-4 left-4 flex gap-2">
             {onEdit && (
                 <Button 
                    onClick={onEdit}
                    className="bg-brand-900/40 hover:bg-brand-900/60 text-white border-0 backdrop-blur-sm"
                 >
                    <Edit size={18} className="ml-2" />
                    تعديل
                 </Button>
             )}
             <Button 
                onClick={handlePrint}
                className="bg-brand-900/40 hover:bg-brand-900/60 text-white border-0 backdrop-blur-sm"
             >
                <Printer size={18} className="ml-2" />
                طباعة
             </Button>
        </div>
        <div className="absolute -bottom-12 right-8">
            <div className="h-24 w-24 rounded-full bg-brand-900 p-1 shadow-lg">
                <div className="h-full w-full rounded-full bg-brand-800 flex items-center justify-center text-brand-300 overflow-hidden">
                    {employee.profile_picture ? (
                        <img src={employee.profile_picture} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <User size={48} />
                    )}
                </div>
            </div>
        </div>
      </div>
      
      <div className="pt-16 pb-8 px-8 print:hidden">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-white">{employee.full_name_ar}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center rounded-full bg-brand-800 px-2 py-1 text-xs font-medium text-brand-200 ring-1 ring-inset ring-brand-500/30">
                        {role === 'Admin' ? 'مسؤول نظام' : role === 'Teacher' ? 'معلم' : role === 'Trainer' ? 'مدرب' : 'إداري'}
                    </span>
                    <span className="text-sm text-brand-300">{employee.job_title}</span>
                </div>
            </div>
        </div>

        {/* Section 1: Basic & Personal Info */}
        <Section id="personal" title="البيانات الشخصية والأساسية" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataItem label="الرقم القومي" value={employee.national_id} mono />
                <DataItem label="كود الموظف" value={employee.employee_code} mono />
                <DataItem label="الجنسية" value={employee.nationality ? nationalityLabels[employee.nationality] : ''} />
                <DataItem label="الديانة" value={employee.religion ? religionLabels[employee.religion] : ''} />
                <DataItem label="الحالة الاجتماعية" value={employee.marital_status ? maritalStatusLabels[employee.marital_status] : ''} />
                <DataItem label="الموقف من العمل" value={employee.work_status} />
            </div>
        </Section>

        {/* Section 2: Job Details */}
        <Section id="job" title="البيانات الوظيفية" icon={Briefcase}>
            {managedUnit && (
             <div className="mb-4 p-4 bg-brand-800/50 border border-brand-700 rounded-lg flex items-start gap-3">
                <Building2 className="text-brand-400 mt-1" size={24} />
                <div>
                    <h3 className="text-sm font-bold text-brand-100">مدير جهة عمل</h3>
                    <p className="text-brand-200 font-medium">{managedUnit.name}</p>
                    <p className="text-xs text-brand-400 mt-1">
                        {unitTypeLabels[managedUnit.unit_type]} - {managedUnit.governorate}
                    </p>
                </div>
            </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataItem label="المسمى الوظيفي" value={employee.job_title} />
                <DataItem label="المجموعة النوعية" value={employee.group_type || details.group_type} />
                <DataItem label="المديرية/الجهة" value={details.directorate} fullWidth />
                <DataItem label="الدرجة المالية" value={details.financial_grade} />
            </div>
        </Section>

        {/* Section 3: Dates */}
        <Section id="dates" title="التواريخ الهامة" icon={Calendar}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                     { label: 'تاريخ التعيين الفعلي', value: employee.actual_appointment_date || details.actual_appointment_date },
                     { label: 'تاريخ استلام العمل', value: employee.work_start_date || details.work_start_date },
                     { label: 'التاريخ الاعتباري', value: employee.deemed_date || details.deemed_date }
                 ].map((date, idx) => (
                    <div key={idx} className="p-3 bg-brand-800 rounded-lg border border-brand-700/50">
                        <p className="text-xs text-brand-400 mb-1 font-bold">{date.label}</p>
                        <div className="flex items-center gap-2 font-semibold text-white text-sm">
                            <Calendar size={16} className="text-brand-500"/>
                            <span className="font-mono">{date.value || '--'}</span>
                        </div>
                    </div>
                 ))}
            </div>
        </Section>

        {/* Section 4: Contact */}
        <Section id="contact" title="بيانات الاتصال" icon={Clock}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataItem label="العنوان" value={details.address} fullWidth />
                <DataItem label="رقم الهاتف" value={employee.phone_number} mono />
                <DataItem label="البريد الأكاديمي" value={employee.email} mono fullWidth />
            </div>
        </Section>

        {/* Section: Promotion Tracking */}
        <Section id="promotion" title="تتبع الترقيات والمسار الوظيفي" icon={TrendingUp}>
            <div className="bg-brand-800/40 border border-brand-700 rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${promotionInfo.status === 'eligible' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-700 text-brand-300'}`}>
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-brand-400">حالة الترقية القادمة</p>
                                    <p className={`text-lg font-bold ${promotionInfo.status === 'eligible' ? 'text-emerald-400' : 'text-white'}`}>
                                        {promotionInfo.status === 'eligible' ? 'مستحق للترقية' : promotionInfo.status === 'upcoming' ? 'ترقية قريبة' : 'في انتظار الدورة'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-brand-400">التاريخ المتوقع</p>
                                <p className="text-brand-200 font-mono font-bold">{promotionInfo.nextDate.toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-brand-300">التقدم نحو الترقية</span>
                                <span className="text-brand-200">{5 - promotionInfo.yearsRemaining} / 5 سنوات</span>
                            </div>
                            <div className="w-full bg-brand-900 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${promotionInfo.status === 'eligible' ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                    style={{ width: `${((5 - promotionInfo.yearsRemaining) / 5) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-brand-900/50 p-3 rounded-lg border border-brand-700/30">
                                <div className="flex items-center gap-2 text-brand-400 mb-1">
                                    <Clock size={14} />
                                    <span className="text-[10px]">المدة المتبقية</span>
                                </div>
                                <p className="text-sm font-bold text-white">{promotionInfo.yearsRemaining} سنوات</p>
                            </div>
                            <div className="bg-brand-900/50 p-3 rounded-lg border border-brand-700/30">
                                <div className="flex items-center gap-2 text-brand-400 mb-1">
                                    <Award size={14} />
                                    <span className="text-[10px]">آخر ترقية</span>
                                </div>
                                <p className="text-sm font-bold text-white">{employee.last_promotion_date || 'غير مسجل'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-64 bg-brand-900/30 rounded-lg p-4 border border-brand-700/50">
                        <h4 className="text-xs font-bold text-brand-300 mb-3 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-400" />
                            متطلبات الترقية
                        </h4>
                        <ul className="space-y-2">
                            {[
                                { label: 'قضاء المدة البينية', done: promotionInfo.status === 'eligible' },
                                { label: 'تقرير أداء (كفء) آخر عامين', done: true },
                                { label: 'اجتياز تدريبات الأكاديمية', done: false },
                                { label: 'ملف الإنجاز الإلكتروني', done: true }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500/20 text-emerald-500' : 'bg-brand-800 text-brand-500'}`}>
                                        {item.done ? <CheckCircle size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                                    </div>
                                    <span className={item.done ? 'text-brand-200' : 'text-brand-400'}>{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </Section>

        {/* Section: Document Management */}
        <Section id="documents" title="الملف الرقمي والوثائق" icon={FileText}>
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-brand-800/50 p-4 rounded-lg border border-brand-700">
                    <div className="flex items-center gap-3">
                        <FileText className="text-brand-400" size={24} />
                        <div>
                            <p className="text-sm font-bold text-white">رفع وثيقة جديدة</p>
                            <p className="text-xs text-brand-400">PDF, JPG, PNG (بحد أقصى 5MB)</p>
                        </div>
                    </div>
                    <label className="relative cursor-pointer">
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {isUploading ? 'جاري الرفع...' : 'اختيار ملف'}
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employee.documents && employee.documents.length > 0 ? (
                        employee.documents.map((doc) => (
                            <div key={doc.id} className="bg-brand-800 rounded-lg p-3 border border-brand-700 hover:border-brand-500 transition-all group">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="p-2 bg-brand-900 rounded-lg text-brand-400">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a 
                                            href={doc.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-1.5 hover:bg-brand-700 rounded-md text-brand-300"
                                            title="عرض"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                        <button 
                                            onClick={() => handleDeleteDocument(doc.id, doc.storagePath)}
                                            className="p-1.5 hover:bg-red-900/30 rounded-md text-red-400"
                                            title="حذف"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-brand-100 truncate" title={doc.name}>{doc.name}</p>
                                <div className="flex justify-between items-center mt-2 text-[10px] text-brand-400">
                                    <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                    <span>{new Date(doc.uploadDate).toLocaleDateString('ar-EG')}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-brand-800/20 rounded-xl border border-dashed border-brand-700">
                            <FileText size={32} className="mx-auto text-brand-600 mb-2 opacity-20" />
                            <p className="text-brand-500 text-sm">لا توجد مستندات مرفوعة حالياً</p>
                        </div>
                    )}
                </div>
            </div>
        </Section>

        {/* Section 5: AI Analysis */}
        <div className="mt-8 pt-6 border-t border-dashed border-brand-700 print:hidden">
            <Section id="aiAnalysis" title="تحليل الأداء والتطوير (AI)" icon={Sparkles} accentColor="purple-500">
                {!isAnalyzing && !analysisResult && (
                    <div className="text-center p-8 bg-brand-800/50 rounded-xl border border-dashed border-brand-700 flex flex-col items-center">
                        <BrainCircuit size={40} className="text-purple-400 mb-4"/>
                        <p className="text-brand-200 font-semibold mb-1">تحليل شامل للمسار المهني</p>
                        <p className="text-sm text-brand-400 mb-6 max-w-md mx-auto">استخدم الذكاء الاصطناعي لتحديد نقاط القوة، الفجوات المهارية، واقتراح خطة تطوير مخصصة للموظف بناءً على بياناته المسجلة.</p>
                        <Button onClick={handleGenerateAnalysis} variant="primary" className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20">
                            <Sparkles size={16} className="ml-2"/>
                            بدء التحليل الآن
                        </Button>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="text-center p-8 bg-brand-800/50 rounded-xl border border-brand-700 flex flex-col items-center">
                        <Loader2 size={40} className="text-purple-400 mb-4 animate-spin"/>
                        <p className="text-brand-200 font-semibold mb-1">جاري التحليل...</p>
                        <p className="text-sm text-brand-400">يقوم الذكاء الاصطناعي بمعالجة بيانات الموظف. قد يستغرق هذا بضع ثوانٍ.</p>
                    </div>
                )}

                {analysisResult && (
                    <div className="p-6 bg-brand-800/30 rounded-xl border border-brand-700 space-y-6 animate-fade-in">
                        {analysisResult.error ? (
                            <div className="text-center text-red-400">
                                <AlertTriangle className="mx-auto mb-2"/>
                                <p className="font-bold">فشل التحليل</p>
                                <p className="text-sm">{analysisResult.message}</p>
                            </div>
                        ) : (
                            <>
                                {/* Strengths */}
                                <div>
                                    <h4 className="font-bold text-purple-300 flex items-center gap-2 mb-3"><CheckCircle size={18}/> نقاط القوة</h4>
                                    <ul className="space-y-2 list-inside list-disc text-brand-200">
                                        {analysisResult.strengths.map((s: string, i: number) => <li key={i} className="pl-2">{s}</li>)}
                                    </ul>
                                </div>

                                {/* Skill Gaps */}
                                <div>
                                    <h4 className="font-bold text-amber-300 flex items-center gap-2 mb-3"><Target size={18}/> الفجوات المهارية</h4>
                                    <ul className="space-y-2 list-inside list-disc text-brand-200">
                                        {analysisResult.skillGaps.map((g: string, i: number) => <li key={i} className="pl-2">{g}</li>)}
                                    </ul>
                                </div>

                                {/* Recommendations */}
                                <div>
                                    <h4 className="font-bold text-emerald-300 flex items-center gap-2 mb-3"><BrainCircuit size={18}/> المسار التدريبي المقترح</h4>
                                    <div className="space-y-4">
                                        {analysisResult.recommendedCourses.map((c: any, i: number) => {
                                            const isAlreadyEnrolled = employee.training_history?.some(t => t.courseName === c.title);
                                            
                                            return (
                                                <div key={i} className="p-3 bg-brand-900/40 border border-brand-700 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-white">{c.title}</p>
                                                        <p className="text-sm text-brand-300 mt-1">{c.reason}</p>
                                                    </div>
                                                    {onEnroll && (
                                                        <Button 
                                                            onClick={() => onEnroll(c.title)}
                                                            disabled={isAlreadyEnrolled}
                                                            variant={isAlreadyEnrolled ? "secondary" : "primary"}
                                                            size="sm"
                                                            className={`shrink-0 ${!isAlreadyEnrolled ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                                        >
                                                            {isAlreadyEnrolled ? (
                                                                <><CheckCircle size={14} className="ml-2" /> مسجل</>
                                                            ) : (
                                                                <><PlusCircle size={14} className="ml-2" /> تسجيل</>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="text-center pt-4">
                                    <Button onClick={handleGenerateAnalysis} variant="secondary" size="sm">
                                        <Sparkles size={14} className="ml-2"/>
                                        إعادة توليد التحليل
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Section>
        </div>

      </div>
    </div>
  );
};
