
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, Mail, User, AlertCircle, CheckCircle, FileText, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthService, validateAcademicEmail } from '../services/api';
import { ACADEMY_LOGO_URL } from '../constants';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Use relaxed email validation (any valid format)
    if (!validateAcademicEmail(email)) {
      setError('صيغة البريد الإلكتروني غير صحيحة');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }
    
    if (nationalId.length !== 14) {
        setError('الرقم القومي يجب أن يتكون من 14 رقم');
        return;
    }
    
    if (!employeeCode) {
        setError('كود الموظف مطلوب');
        return;
    }

    setLoading(true);

    try {
      const user = await AuthService.register(name, email, password, nationalId, employeeCode);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-center items-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-90 z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>

        <div className="relative z-10 text-center px-12">
           <div className="inline-flex p-6 bg-white rounded-3xl shadow-2xl mb-8">
             <img src={ACADEMY_LOGO_URL} alt="TVETA Logo" className="w-28 h-auto object-contain" />
           </div>
          <h1 className="text-4xl font-bold mb-6 tracking-tight">انضم إلى TVETA</h1>
          <p className="text-lg text-indigo-200 font-light max-w-md mx-auto leading-relaxed">
            أنشئ حسابك الآن للوصول إلى كافة الخدمات الإدارية والوظيفية الخاصة بوزارة التربية والتعليم.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
             <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                <h3 className="font-bold text-indigo-300 mb-1">سهولة الوصول</h3>
                <p className="text-xs text-gray-300">الوصول لبياناتك من أي مكان</p>
             </div>
             <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                <h3 className="font-bold text-indigo-300 mb-1">أمان عالي</h3>
                <p className="text-xs text-gray-300">حماية كاملة للبيانات الشخصية</p>
             </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
           <div className="text-center mb-8">
             <h2 className="text-3xl font-bold text-gray-800 mb-2">إنشاء حساب جديد</h2>
             <p className="text-gray-500">سجل بياناتك للانضمام إلى النظام</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم ثلاثي</label>
              <div className="relative group">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="الاسم الكامل"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الرقم القومي</label>
                  <div className="relative group">
                    <FileText className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      maxLength={14}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="14 رقم"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">كود الموظف</label>
                  <div className="relative group">
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="الكود"
                    />
                  </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <div className="relative group">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="user@example.com"
                  dir="ltr"
                  style={{textAlign: 'right'}}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
                  <div className="relative group">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      dir="ltr"
                      style={{textAlign: 'right'}}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">تأكيد الكلمة</label>
                  <div className="relative group">
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      dir="ltr"
                      style={{textAlign: 'right'}}
                    />
                  </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg transition-all transform active:scale-95 mt-4
                ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </button>
            
            <div className="text-center mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                لديك حساب بالفعل؟{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
