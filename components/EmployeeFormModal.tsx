
import React, { useState, useEffect } from 'react';
import { Employee, EmployeeDetails, Role, WorkUnit, WorkUnitType } from '../types';
import { Button } from './Button';
import { X, Save } from 'lucide-react';
import { WorkUnitService } from '../services/api';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  mode: 'add' | 'edit';
  initialData?: Employee;
  fixedGovernorate?: string;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  mode, 
  initialData,
  fixedGovernorate
}) => {
  const [formData, setFormData] = useState<Partial<EmployeeDetails> & { national_id?: string; academic_email?: string; password?: string; role?: Role; work_unit_id?: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);

  useEffect(() => {
    const loadUnits = async () => {
        let units = await WorkUnitService.getAll();
        if (fixedGovernorate) {
            units = units.filter(u => u.governorate === fixedGovernorate);
        }
        setWorkUnits(units);
    };
    if (isOpen) {
        loadUnits();
        if (mode === 'edit' && initialData) {
            setFormData({
            ...initialData.details,
            national_id: initialData.national_id,
            academic_email: initialData.academic_email,
            role: initialData.role as Role,
            work_unit_id: initialData.work_place_id
            });
        } else {
            setFormData({
                role: 'Teacher' as Role,
                work_unit_id: 0
            });
        }
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-700 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {mode === 'add' ? 'إضافة موظف / حساب جديد' : 'تعديل بيانات الحساب'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Account Info Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">بيانات الدخول</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرقم القومي</label>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id || ''}
                    onChange={handleChange}
                    disabled={mode === 'edit'}
                    required
                    minLength={14}
                    maxLength={14}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-500 dark:disabled:text-gray-500 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الأكاديمي</label>
                  <input
                    type="email"
                    name="academic_email"
                    value={formData.academic_email || ''}
                    onChange={handleChange}
                    disabled={mode === 'edit'} // Usually email is primary key for auth
                    required={mode === 'add'}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-500 dark:disabled:text-gray-500 px-3 py-2 outline-none"
                  />
                </div>
                {mode === 'add' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password || ''}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                    />
                  </div>
                )}
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدور الوظيفي</label>
                  <select
                    name="role"
                    value={formData.role || 'Teacher'}
                    onChange={handleChange}
                    disabled={mode === 'edit' && initialData?.national_id === formData.national_id} // Prevent self-demotion/promotion roughly
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                  >
                    {!fixedGovernorate && <option value="Admin">مسؤول نظام (Admin)</option>}
                    <option value="Administrative">مدير مديرية (Administrative)</option>
                    <option value="Teacher">معلم (Teacher)</option>
                    <option value="Trainer">مدرب (Trainer)</option>
                  </select>
                </div>

                {/* Show Work Unit Selection for Managers */}
                {formData.role === 'Administrative' && (
                    <div>
                        <label className="block text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-1">جهة الإدارة (للمدراء)</label>
                        <select
                            name="work_unit_id"
                            value={formData.work_unit_id}
                            onChange={handleChange}
                            className="w-full rounded-lg border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 ring-2 ring-indigo-50 dark:ring-indigo-900/20 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white px-3 py-2 outline-none"
                        >
                            <option value={0}>اختر جهة الإدارة...</option>
                            {workUnits
                                .filter(u => u.unit_type === WorkUnitType.DIRECTORATE || u.unit_type === WorkUnitType.EDU_DEPT)
                                .map(u => (
                                    <option key={u.id} value={u.id}>{u.name_ar} ({u.governorate})</option>
                                ))
                            }
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تحدد هذه الجهة نطاق صلاحيات المدير.</p>
                    </div>
                )}
              </div>
            </div>

            {/* Personal Info Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">البيانات الشخصية والوظيفية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم بالكامل</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title || ''}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المديرية</label>
                  <input
                    type="text"
                    name="directorate"
                    value={formData.directorate || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600">
            إلغاء
          </Button>
          <Button type="submit" form="employee-form" isLoading={isLoading}>
            <Save size={18} className="ml-2" />
            {mode === 'add' ? 'حفظ البيانات' : 'تحديث البيانات'}
          </Button>
        </div>

      </div>
    </div>
  );
};
