
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100 border border-gray-100 dark:border-slate-700">
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${isDestructive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <AlertTriangle className={`h-8 w-8 ${isDestructive ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 font-bold transition-colors"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-2.5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-95
              ${isDestructive 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-500/30'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
