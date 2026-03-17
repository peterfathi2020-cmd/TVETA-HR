import React, { useState } from 'react';
import { Teacher, TeacherLevel } from '../types';
import { Search, Plus, Filter, Sparkles } from 'lucide-react';
import { suggestTrainingPath } from '../services/geminiService';

interface TeachersListProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

export const TeachersList: React.FC<TeachersListProps> = ({ teachers, setTeachers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{id: string, text: string} | null>(null);
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.fullName.includes(searchTerm) || t.nationalId.includes(searchTerm);
    const matchesLevel = selectedLevel ? t.level === selectedLevel : true;
    return matchesSearch && matchesLevel;
  });

  const handleAiSuggest = async (teacher: Teacher) => {
    setLoadingAi(teacher.id);
    setAiAnalysis(null);
    const result = await suggestTrainingPath(teacher);
    setAiAnalysis({ id: teacher.id, text: result });
    setLoadingAi(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="بحث بالاسم أو الرقم القومي..."
            className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">كل الدرجات</option>
            {Object.values(TeacherLevel).map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus size={20} />
            <span className="hidden sm:inline">إضافة معلم</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4">الاسم</th>
                <th className="px-6 py-4">الرقم القومي</th>
                <th className="px-6 py-4">الدرجة الوظيفية</th>
                <th className="px-6 py-4">التخصص</th>
                <th className="px-6 py-4">المدرسة</th>
                <th className="px-6 py-4">ساعات التدريب</th>
                <th className="px-6 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map(teacher => (
                <React.Fragment key={teacher.id}>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-800">{teacher.fullName}</td>
                    <td className="px-6 py-4 text-slate-600">{teacher.nationalId}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                        {teacher.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{teacher.subject}</td>
                    <td className="px-6 py-4 text-slate-600">{teacher.school}</td>
                    <td className="px-6 py-4 text-slate-600">{teacher.trainingHours}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleAiSuggest(teacher)}
                        className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition tooltip-trigger flex items-center gap-1 text-sm font-medium"
                        title="اقتراح مسار تدريبي بالذكاء الاصطناعي"
                      >
                        <Sparkles size={16} />
                        توجيه
                      </button>
                    </td>
                  </tr>
                  {/* AI Suggestion Expansion Row */}
                  {(loadingAi === teacher.id || (aiAnalysis?.id === teacher.id)) && (
                    <tr className="bg-purple-50/50">
                      <td colSpan={7} className="px-6 py-4">
                        {loadingAi === teacher.id ? (
                          <div className="flex items-center gap-2 text-purple-600 animate-pulse">
                            <Sparkles size={16} />
                            <span>جارِ تحليل بيانات المعلم {teacher.fullName} واقتراح المسار التدريبي...</span>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-slate-700">
                             <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                               <Sparkles size={16} />
                               اقتراحات الأكاديمية الذكية:
                             </h4>
                             <div className="whitespace-pre-wrap">{aiAnalysis?.text}</div>
                             <button 
                               onClick={() => setAiAnalysis(null)}
                               className="mt-3 text-xs text-slate-500 underline hover:text-slate-800"
                             >
                               إغلاق
                             </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTeachers.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            لا توجد نتائج مطابقة للبحث
          </div>
        )}
      </div>
    </div>
  );
};
