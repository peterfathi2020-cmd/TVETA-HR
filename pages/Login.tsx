
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2, LogIn, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthService, validateAcademicEmail } from '../services/api';
import { ACADEMY_LOGO_URL } from '../constants';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!identifier || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      setLoading(false);
      return;
    }

    try {
      const user = await AuthService.login(identifier, password);
      login(user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!identifier) {
      setError('يرجى إدخال البريد الإلكتروني في الحقل المخصص أولاً لإرسال رابط إعادة التعيين.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.sendPasswordResetEmail(identifier);
      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.');
    } catch (err: any) {
      setError(err.message || 'فشل إرسال بريد إعادة التعيين.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await AuthService.loginWithGoogle();
      login(user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول باستخدام جوجل.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-900 font-sans" dir="rtl">
       {/* Right Panel - Branding (Desktop) */}
       <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center overflow-hidden bg-[#003366]">
          {/* Background overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#003366] to-[#001a33] opacity-90 z-0"></div>
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
          
          <div className="relative z-10 text-center px-12 animate-fade-in-up w-full max-w-2xl">
             <div className="mb-8 inline-flex p-8 bg-white rounded-3xl shadow-2xl items-center justify-center transform hover:scale-105 transition-transform duration-500">
                <img src={ACADEMY_LOGO_URL} alt="TVETA Logo" className="w-40 h-auto object-contain" />
             </div>
             <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-wide leading-tight drop-shadow-lg">
                الأكاديمية المهنية للمعلمين
             </h1>
             <p className="text-xl text-indigo-100 font-light leading-relaxed max-w-lg mx-auto">
                البوابة الموحدة لإدارة الموارد البشرية، الترقيات، وملفات الكادر إلكترونياً.
             </p>
             
             <div className="mt-12 grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center hover:bg-white/20 transition-colors">
                    <ShieldCheck className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                    <span className="block text-white font-bold text-sm">بيانات آمنة</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center hover:bg-white/20 transition-colors">
                    <Database className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                    <span className="block text-white font-bold text-sm">تحديث فوري</span>
                </div>
             </div>
          </div>
          
          <div className="absolute bottom-6 text-indigo-300/50 text-xs font-mono">
              System Version 2.1.0 (Production)
          </div>
       </div>

       {/* Left Panel - Login Form */}
       <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-slate-950 relative">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
             
             {/* Header for Mobile */}
             <div className="text-center lg:text-right space-y-2">
                <div className="inline-block lg:hidden mb-4 p-4 bg-white shadow-md rounded-2xl border border-gray-100">
                    <img src={ACADEMY_LOGO_URL} alt="Logo" className="w-20 h-auto object-contain" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">تسجيل الدخول</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">يرجى إدخال بيانات حسابك المفعل للمتابعة</p>
             </div>

             {/* Error Box */}
             {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-3 border border-red-100 dark:border-red-900/30 animate-shake shadow-sm">
                   <AlertCircle size={18} className="shrink-0 mt-0.5" />
                   <span>{error}</span>
                </div>
             )}

             {/* Success Box */}
             {success && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-start gap-3 border border-emerald-100 dark:border-emerald-900/30 animate-fade-in shadow-sm">
                   <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                   <span>{success}</span>
                </div>
             )}

             <div className="space-y-6">
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">البريد الإلكتروني</label>
                      <div className="relative group">
                         <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003366] transition-colors" size={20} />
                         <input 
                            type="email" 
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-[#003366]/10 focus:border-[#003366] dark:focus:border-indigo-500 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-right dir-ltr font-medium"
                            placeholder="user@academy.edu.eg"
                            dir="ltr"
                         />
                      </div>
                   </div>

                   <div>
                      <div className="flex justify-between items-center mb-2">
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">كلمة المرور</label>
                         <button 
                           type="button"
                           onClick={handleForgotPassword}
                           className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                         >
                           نسيت كلمة المرور؟
                         </button>
                      </div>
                      <div className="relative group">
                         <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003366] transition-colors" size={20} />
                         <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-[#003366]/10 focus:border-[#003366] dark:focus:border-indigo-500 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-right dir-ltr font-medium"
                            placeholder="••••••••"
                            dir="ltr"
                         />
                      </div>
                   </div>

                   <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#003366] hover:bg-[#002244] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-900/10 hover:shadow-indigo-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 text-base"
                   >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                      <span>تسجيل الدخول</span>
                   </button>
                </form>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">أو</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-4 rounded-xl font-bold shadow-sm transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-base"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>تسجيل الدخول باستخدام جوجل</span>
                </button>
             </div>
             
             <div className="pt-6 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                   ليس لديك حساب مفعل؟ <Link to="/register" className="text-[#003366] dark:text-indigo-400 font-bold hover:underline transition-colors">إنشاء حساب جديد</Link>
                </p>
             </div>

             <div className="text-center mt-4">
                 <p className="text-xs text-slate-400">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} وزارة التربية والتعليم</p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Login;
