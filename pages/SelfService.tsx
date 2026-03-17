
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { EmployeeService, PromotionService, AppraisalService } from '../services/api';
import { Employee, Appraisal, TrainingRecord } from '../types';
import { Layout } from '../components/Layout';
import { ProfileCard } from '../components/ProfileCard';
import { analyzeEmployeeProfileComprehensive } from '../services/geminiService';
import { 
  User, 
  FileText, 
  TrendingUp, 
  Clock, 
  Award, 
  Calendar,
  ShieldCheck, 
  History, 
  Loader2, 
  AlertCircle,
  Download,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  BrainCircuit,
  PlusCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';

export const SelfService: React.FC = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'requests' | 'performance' | 'help'>('profile');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);

  const handleGenerateAIAnalysis = async () => {
    if (!employee) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeEmployeeProfileComprehensive(employee);
      setAnalysisResult(result);
      if (result && !result.error) {
        toast.success('تم توليد المقترحات بنجاح');
      }
    } catch (error) {
      toast.error('فشل توليد المقترحات');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEnroll = async (courseTitle: string) => {
    if (!employee) return;
    setIsEnrolling(courseTitle);
    try {
      const newRecord: TrainingRecord = {
        id: Date.now().toString(),
        courseName: courseTitle,
        provider: 'الأكاديمية المهنية للمعلمين',
        date: new Date().toISOString().split('T')[0],
        status: 'Planned'
      };

      const updatedHistory = [...(employee.training_history || []), newRecord];
      await EmployeeService.update(employee.national_id, { training_history: updatedHistory });
      
      // Update local state
      setEmployee({ ...employee, training_history: updatedHistory });
      toast.success(`تم التسجيل في دورة: ${courseTitle}`);
    } catch (error) {
      toast.error('فشل التسجيل في الدورة');
    } finally {
      setIsEnrolling(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.employee_national_id) return;
      
      setIsLoading(true);
      try {
        const [empData, appraisalData] = await Promise.all([
          EmployeeService.getById(user.employee_national_id),
          AppraisalService.getAll(user.employee_national_id)
        ]);
        
        if (empData) setEmployee(empData);
        setAppraisals(appraisalData);
      } catch (error) {
        console.error("Failed to fetch self-service data:", error);
        toast.error('فشل تحميل البيانات');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <AlertCircle className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-white mb-2">عذراً، لم يتم العثور على بيانات الموظف</h2>
        <p className="text-brand-400 max-w-md">يرجى التواصل مع إدارة الموارد البشرية للتأكد من ربط حسابك ببياناتك الوظيفية.</p>
      </div>
    );
  }

  const promotionInfo = PromotionService.calculateNextPromotion(employee);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-brand-900/60 backdrop-blur-md border border-brand-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-brand-500/20 text-brand-500 rounded-xl">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">الترقية القادمة</p>
                    <p className="text-xl font-black text-white">{promotionInfo.yearsRemaining} <span className="text-xs font-normal text-brand-400">سنوات</span></p>
                </div>
            </div>
            <div className="bg-brand-900/60 backdrop-blur-md border border-brand-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl">
                    <Calendar size={24} />
                </div>
                <div>
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">تاريخ الاستحقاق</p>
                    <p className="text-sm font-bold text-white">{promotionInfo.nextDate.toLocaleDateString('ar-EG')}</p>
                </div>
            </div>
            <div className="bg-brand-900/60 backdrop-blur-md border border-brand-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-purple-500/20 text-purple-500 rounded-xl">
                    <Award size={24} />
                </div>
                <div>
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">آخر تقييم</p>
                    <p className="text-xl font-black text-white">94%</p>
                </div>
            </div>
            <div className="bg-brand-900/60 backdrop-blur-md border border-brand-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">الأقدمية</p>
                    <p className="text-sm font-bold text-white">
                        {Math.floor((new Date().getTime() - new Date(employee.employment_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} سنة
                    </p>
                </div>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-brand-900 rounded-xl border border-brand-800 overflow-hidden shadow-lg">
              <div className="p-6 bg-brand-800 border-b border-brand-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-brand-700 flex items-center justify-center text-brand-400 overflow-hidden border-2 border-brand-600">
                        {employee.profile_picture ? (
                            <img src={employee.profile_picture} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <User size={24} />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white truncate w-32">{employee.full_name_ar.split(' ')[0]}</p>
                        <p className="text-[10px] text-brand-400">بوابة الخدمة الذاتية</p>
                    </div>
                </div>
              </div>
              
              <nav className="p-2">
                {[
                  { id: 'profile', label: 'ملفي الوظيفي', icon: User },
                  { id: 'requests', label: 'طلباتي ومستنداتي', icon: FileText },
                  { id: 'performance', label: 'تقييم الأداء', icon: TrendingUp },
                  { id: 'help', label: 'مركز المساعدة', icon: HelpCircle },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                      activeTab === item.id 
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-brand-400 hover:bg-brand-800 hover:text-brand-200'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="p-4 mt-4 bg-brand-800/30 m-2 rounded-lg border border-brand-700/50">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold">حالة الحساب: نشط</span>
                </div>
                <p className="text-[10px] text-brand-500">آخر دخول: {new Date().toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <User className="text-brand-500" size={24} />
                        بياناتي الأساسية
                    </h3>
                    <ProfileCard 
                        employee={employee} 
                        onEnroll={handleEnroll}
                    />
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                            <FileText className="text-brand-500" size={20} />
                            استخراج مستندات رسمية
                        </h3>
                        <div className="space-y-3">
                            {[
                                { title: 'بيان حالة وظيفية (صحيفة أحوال)', desc: 'نسخة إلكترونية معتمدة بختم الأكاديمية' },
                                { title: 'مفردات مرتب', desc: 'بيان تفصيلي بالرواتب والبدلات' },
                                { title: 'شهادة خبرة', desc: 'للفترة التي قضيتها في العمل' },
                                { title: 'إفادة عمل', desc: 'موجهة لجهة محددة' }
                            ].map((req, i) => (
                                <div key={i} className="p-4 bg-brand-800 rounded-lg border border-brand-700 flex items-center justify-between group hover:border-brand-500 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-brand-100">{req.title}</p>
                                        <p className="text-[10px] text-brand-400 mt-1">{req.desc}</p>
                                    </div>
                                    <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download size={14} className="ml-2" />
                                        طلب
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                            <History className="text-brand-500" size={20} />
                            طلباتي السابقة
                        </h3>
                        <div className="space-y-3">
                            {[
                                { title: 'بيان حالة وظيفية', date: '2024-02-15', status: 'Completed' },
                                { title: 'إجازة اعتيادية', date: '2024-01-10', status: 'Approved' },
                                { title: 'طلب تعديل بيانات', date: '2023-12-05', status: 'Rejected' }
                            ].map((item, i) => (
                                <div key={i} className="p-3 bg-brand-800/50 rounded-lg border border-brand-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-brand-200">{item.title}</p>
                                        <p className="text-[10px] text-brand-500 mt-1">{item.date}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        item.status === 'Completed' || item.status === 'Approved' 
                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {item.status === 'Completed' ? 'مكتمل' : item.status === 'Approved' ? 'مقبول' : 'مرفوض'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <TrendingUp className="text-brand-500" size={24} />
                        سجل تقييم الأداء السنوي
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-4 bg-brand-800 rounded-xl border border-brand-700 text-center">
                            <p className="text-xs text-brand-400 mb-2">آخر تقييم (2023)</p>
                            <p className="text-3xl font-bold text-emerald-400">94%</p>
                            <p className="text-xs text-emerald-500 mt-1 font-bold">كفء جداً</p>
                        </div>
                        <div className="p-4 bg-brand-800 rounded-xl border border-brand-700 text-center">
                            <p className="text-xs text-brand-400 mb-2">متوسط التقييم العام</p>
                            <p className="text-3xl font-bold text-brand-200">91%</p>
                            <p className="text-xs text-brand-400 mt-1">آخر 3 سنوات</p>
                        </div>
                        <div className="p-4 bg-brand-800 rounded-xl border border-brand-700 text-center">
                            <p className="text-xs text-brand-400 mb-2">الترقية القادمة</p>
                            <p className="text-3xl font-bold text-brand-500">{promotionInfo.yearsRemaining}</p>
                            <p className="text-xs text-brand-400 mt-1">سنوات متبقية</p>
                            <p className="text-[10px] text-brand-300 mt-2 font-bold">
                                التاريخ المتوقع: {promotionInfo.nextDate.toLocaleDateString('ar-EG')}
                            </p>
                            <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                promotionInfo.status === 'eligible' ? 'bg-emerald-500/20 text-emerald-400' :
                                promotionInfo.status === 'upcoming' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-brand-700 text-brand-400'
                            }`}>
                                {promotionInfo.status === 'eligible' ? 'مستحق للترقية' : 
                                 promotionInfo.status === 'upcoming' ? 'ترقية قريبة' : 'في انتظار الاستحقاق'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-brand-300 border-r-4 border-brand-500 pr-3">التاريخ التدريبي والمهني</h4>
                        <div className="space-y-3">
                            {employee.training_history?.map((training, i) => (
                                <div key={i} className="p-4 bg-brand-800/30 rounded-lg border border-brand-700 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-brand-900 rounded-lg text-brand-400">
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{training.courseName}</p>
                                            <p className="text-xs text-brand-400 mt-1">{training.provider} - {training.date}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 ${training.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {training.status === 'Completed' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                        <span className="text-xs font-bold">
                                            {training.status === 'Completed' ? 'مكتمل' : training.status === 'Ongoing' ? 'جاري' : 'مخطط'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Suggested Courses */}
                    <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-lg mt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <Sparkles className="text-purple-400" size={24} />
                                دورات تدريبية مقترحة (ذكاء اصطناعي)
                            </h3>
                            {!analysisResult && !isAnalyzing && (
                                <Button 
                                    onClick={handleGenerateAIAnalysis} 
                                    variant="primary" 
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <BrainCircuit size={16} className="ml-2" />
                                    توليد المقترحات
                                </Button>
                            )}
                        </div>

                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Loader2 className="animate-spin text-purple-500 mb-4" size={32} />
                                <p className="text-brand-300 font-bold">جاري تحليل ملفك الوظيفي واقتراح أفضل المسارات...</p>
                            </div>
                        )}

                        {analysisResult && !analysisResult.error && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analysisResult.recommendedCourses.map((course: any, i: number) => {
                                    const isAlreadyEnrolled = employee.training_history?.some(t => t.courseName === course.title);
                                    
                                    return (
                                        <div key={i} className="p-4 bg-brand-800/50 rounded-xl border border-brand-700 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-bold text-white text-sm">{course.title}</h4>
                                                    <Sparkles size={14} className="text-purple-400 shrink-0" />
                                                </div>
                                                <p className="text-xs text-brand-400 leading-relaxed mb-4">{course.reason}</p>
                                            </div>
                                            
                                            <Button 
                                                onClick={() => handleEnroll(course.title)}
                                                disabled={isAlreadyEnrolled || isEnrolling === course.title}
                                                variant={isAlreadyEnrolled ? "secondary" : "primary"}
                                                size="sm"
                                                className={`w-full ${!isAlreadyEnrolled ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                            >
                                                {isEnrolling === course.title ? (
                                                    <Loader2 size={14} className="animate-spin ml-2" />
                                                ) : isAlreadyEnrolled ? (
                                                    <CheckCircle2 size={14} className="ml-2" />
                                                ) : (
                                                    <PlusCircle size={14} className="ml-2" />
                                                )}
                                                {isAlreadyEnrolled ? 'مسجل بالفعل' : 'التسجيل في الدورة'}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {analysisResult?.error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                                <p className="text-red-400 text-sm font-bold">{analysisResult.message}</p>
                                <Button onClick={handleGenerateAIAnalysis} variant="secondary" size="sm" className="mt-3">إعادة المحاولة</Button>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <HelpCircle className="text-brand-500" size={24} />
                        مركز المساعدة والدعم الفني
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-brand-200">الأسئلة الشائعة</h4>
                            {[
                                'كيف يمكنني تحديث بياناتي الشخصية؟',
                                'ما هي الأوراق المطلوبة للترقية؟',
                                'كيفية استخراج بيان حالة وظيفية؟',
                                'نسيت كلمة المرور الخاصة بالبريد الأكاديمي'
                            ].map((q, i) => (
                                <div key={i} className="p-3 bg-brand-800/50 rounded-lg border border-brand-700 text-xs text-brand-300 cursor-pointer hover:bg-brand-800 transition-colors">
                                    {q}
                                </div>
                            ))}
                        </div>
                        <div className="bg-brand-800/30 p-6 rounded-xl border border-brand-700 flex flex-col items-center text-center">
                            <div className="p-4 bg-brand-900 rounded-full text-brand-400 mb-4">
                                <ShieldCheck size={32} />
                            </div>
                            <h4 className="text-sm font-bold text-white mb-2">تواصل مع الدعم الفني</h4>
                            <p className="text-xs text-brand-400 mb-6">إذا واجهت أي مشكلة في استخدام البوابة أو وجدت بيانات غير صحيحة، يرجى فتح تذكرة دعم.</p>
                            <Button variant="primary" className="w-full">فتح تذكرة دعم</Button>
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
