

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Building2, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight, UserSquare, Shield, Users, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthService, validateAcademicEmail } from '../services/api';
import { useTheme } from '../context/ThemeContext';

type LoginStep = 'credentials' | '2fa';
type LoginRole = 'admin' | 'manager' | 'employee';

const Login: React.FC = () => {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [activeRole, setActiveRole] = useState<LoginRole>('employee');
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme(); 
  const from = (location.state as any)?.from?.pathname || '/';

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateAcademicEmail(identifier)) {
      setError('عفواً، لا يُسمح بالدخول إلا باستخدام البريد الأكاديمي الرسمي المنتهي بـ .edu.eg');
      setLoading(false);
      return;
    }

    try {
      const isValid = await AuthService.validateCredentials(identifier, password);
      if (isValid) {
        setStep('2fa');
      }
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
      setError('يرجى إدخال البريد الإلكتروني أولاً لإرسال رابط إعادة التعيين.');
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

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await AuthService.verifyTwoFactorCode(identifier, otp);
      login(user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  const roleTabs = [
    { id: 'admin', label: 'مسؤول نظام', icon: Shield, color: 'indigo' },
    { id: 'manager', label: 'مدير (إداري)', icon: UserCog, color: 'blue' },
    { id: 'employee', label: 'موظف / معلم', icon: Users, color: 'emerald' },
  ];

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-center items-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-90 z-0"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 text-center px-12 space-y-6">
          <div className="inline-flex p-6 bg-white rounded-3xl shadow-2xl mb-4">
             <img src="https://i.postimg.cc/Gtdn21c4/123456.jpg" alt="TVETA Logo" className="w-32 h-auto object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">نظام بيانات العاملين (TVETA)</h1>
            <p className="text-lg text-indigo-200 font-light">بوابة إدارة الموارد البشرية والتعليم الفني والمهني</p>
          </div>
          <div className="pt-8 space-y-4">
             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                <Building2 className="text-indigo-400" />
                <div className="text-right">
                    <p className="font-bold">دخول موحد</p>
                    <p className="text-xs text-gray-400">يرجى استخدام البريد الأكاديمي الرسمي (.edu.eg)</p>
                </div>
             </div>
          </div>
          <div className="absolute bottom-10 left-0 right-0 text-center text-xs text-gray-500">
            &copy; 2024 وزارة التربية والتعليم - قطاع التعليم الفني
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 transition-colors">
          
          {step === 'credentials' ? (
            <div className="animate-fade-in">
              <div className="text-center mb-8 lg:text-right">
                 <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">تسجيل الدخول</h2>
                 <p className="text-gray-500 dark:text-gray-400">مرحباً بك، يرجى إدخال بيانات حسابك الأكاديمي</p>
              </div>

              <div className="flex p-1 bg-gray-100 dark:bg-slate-700 rounded-xl mb-8">
                {roleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveRole(tab.id as LoginRole)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all
                        ${activeRole === tab.id 
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        <tab.icon size={16} className={activeRole === tab.id ? `text-${tab.color}-600` : ''} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
              </div>
              
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 px-4 py-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in">
                  <ShieldCheck size={18} />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    البريد الأكاديمي الرسمي
                  </label>
                  <div className="relative group">
                    <UserSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pr-10 pl-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="user@academy.edu.eg"
                      dir="ltr"
                      style={{textAlign: 'right'}}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 mr-1">يجب استخدام البريد المنتهي بـ <span className="font-mono text-indigo-500">.edu.eg</span></p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">كلمة المرور</label>
                     <button 
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-transparent border-none p-0 cursor-pointer"
                      >
                        نسيت كلمة المرور؟
                      </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 pl-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      dir="ltr"
                      style={{textAlign: 'right'}}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg transition-all transform active:scale-95
                    ${loading ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {loading ? 'التحقق والمتابعة...' : 'متابعة'}
                </button>
                
                <div className="text-center mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ليس لديك حساب؟{' '}
                    <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold hover:underline">
                      إنشاء حساب جديد
                    </Link>
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-900/30">
                   <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                    بيانات تجريبية: peterfathi2020@gmail.com  / pepo_1759
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mt-1">
                    للموظف: mohamed.a@academy.edu.eg / Pass123
                  </p>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in text-center">
               <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-6 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={48} />
               </div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">التحقق بخطوتين</h2>
               <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                 تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى إدخال الرمز المكون من 6 أرقام.
                 <br/>
                 <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded mt-2 inline-block">Code: 123456</span>
               </p>

               {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2 text-sm justify-center">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handle2FASubmit} className="space-y-6">
                 <div>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl border-2 border-indigo-100 dark:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-slate-600 bg-white dark:bg-slate-700"
                      placeholder="000000"
                      autoFocus
                    />
                 </div>

                 <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className={`w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg transition-all transform active:scale-95
                    ${(loading || otp.length < 6) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'جاري التحقق...' : 'تأكيد الدخول'}
                </button>

                <button 
                  type="button"
                  onClick={() => { setStep('credentials'); setOtp(''); setError(''); }}
                  className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                >
                   <ArrowRight size={16} />
                   <span>العودة لتسجيل الدخول</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;