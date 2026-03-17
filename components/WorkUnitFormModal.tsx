
import React, { useState, useEffect } from 'react';
import { WorkUnit, WorkUnitType, WorkUnitTypeLabels, Employee } from '../types';
import { Button } from './Button';
import { X, Save } from 'lucide-react';
import { EGYPT_GOVERNORATES } from '../constants';

interface WorkUnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<WorkUnit>) => Promise<void>;
  initialData?: WorkUnit;
  managers?: Employee[];
  fixedGovernorate?: string;
}

export const WorkUnitFormModal: React.FC<WorkUnitFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  managers = [],
  fixedGovernorate
}) => {
  const [formData, setFormData] = useState<Partial<WorkUnit>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        unit_type: WorkUnitType.SCHOOL,
        governorate: fixedGovernorate || 'القاهرة',
        manager_id: ''
      });
    }
  }, [isOpen, initialData, fixedGovernorate]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {initialData ? 'تعديل بيانات الجهة' : 'إضافة جهة جديدة'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="unit-form" onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الجهة</label>
                <input
                    type="text"
                    name="name_ar"
                    value={formData.name_ar || ''}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الجهة</label>
                <select
                    name="unit_type"
                    value={formData.unit_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                >
                    {Object.entries(WorkUnitTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المحافظة</label>
                <select
                    name="governorate"
                    value={formData.governorate}
                    onChange={handleChange}
                    disabled={!!fixedGovernorate}
                    className={`w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none ${!!fixedGovernorate ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    {EGYPT_GOVERNORATES.map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                    ))}
                </select>
                {!!fixedGovernorate && (
                    <p className="text-[10px] text-indigo-500 mt-1">يتم تحديد المحافظة تلقائياً بناءً على صلاحياتك.</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مدير الجهة</label>
                <select
                    name="manager_id"
                    value={formData.manager_id || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                >
                    <option value="">اختر مدير للجهة...</option>
                    {managers.map(manager => (
                        <option key={manager.national_id} value={manager.national_id}>
                            {manager.full_name_ar} ({manager.national_id})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">يظهر هنا الموظفين ذوي الصلاحيات الإدارية (Admin/Administrative)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">خط العرض (Latitude)</label>
                    <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude || ''}
                        onChange={handleChange}
                        placeholder="مثال: 30.0444"
                        className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">خط الطول (Longitude)</label>
                    <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude || ''}
                        onChange={handleChange}
                        placeholder="مثال: 31.2357"
                        className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 px-3 py-2 outline-none"
                    />
                </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600">إلغاء</Button>
          <Button type="submit" form="unit-form" isLoading={isLoading}>
            <Save size={18} className="ml-2" />
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
};
