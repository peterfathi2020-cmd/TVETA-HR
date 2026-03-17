
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Building2, Menu, X, LogOut, User as UserIcon, FileText, ChevronLeft, Sun, Moon, Shield, Briefcase, GraduationCap, School, Sparkles } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import { ACADEMY_LOGO_URL } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Define navigation items based on Role
  const getNavItems = () => {
    const items = [];

    // Admin & Manager Dashboard
    if (user?.role === UserRole.ACAD_ADMIN || user?.role === UserRole.EDU_MANAGER) {
      items.push({ name: 'لوحة القيادة', path: '/', icon: <LayoutDashboard size={20} /> });
      items.push({ name: 'دليل الموظفين', path: '/directory', icon: <Users size={20} /> });
    }

    // Employee specific dashboard/profile link
    if (user?.role === UserRole.EMPLOYEE) {
        items.push({ name: 'ملفي الوظيفي', path: '/', icon: <LayoutDashboard size={20} /> });
    }

    // Lists and Management
    if (user?.role === UserRole.ACAD_ADMIN || user?.role === UserRole.EDU_MANAGER) {
      items.push(
        { name: 'إدارة الجهات', path: '/units', icon: <Building2 size={20} /> }
      );
    }

    // AI Assistant - Available to all
    items.push({ name: 'المساعد الذكي', path: '/ai', icon: <Sparkles size={20} /> });

    // Employee Profile Direct Link
    if (user?.role === UserRole.EMPLOYEE && user.employee_national_id) {
      items.push(
        { name: 'بياناتي التفصيلية', path: `/employees/${user.employee_national_id}`, icon: <FileText size={20} /> }
      );
    }

    return items;
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
      switch(user?.role) {
          case UserRole.ACAD_ADMIN:
              return <span className="flex items-center gap-1 text-[10px] bg-purple-600/90 text-white px-2 py-0.5 rounded shadow-sm"><Shield size={10} /> Admin</span>;
          case UserRole.EDU_MANAGER:
              return <span className="flex items-center gap-1 text-[10px] bg-blue-600/90 text-white px-2 py-0.5 rounded shadow-sm"><Briefcase size={10} /> Manager</span>;
          default:
              return <span className="flex items-center gap-1 text-[10px] bg-emerald-600/90 text-white px-2 py-0.5 rounded shadow-sm"><GraduationCap size={10} /> Staff</span>;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans print:bg-white print:block print:h-auto print:overflow-visible transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden print:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Professional Dark Theme */}
      <aside 
        className={`fixed lg:sticky top-0 right-0 h-screen w-72 bg-[#002244] dark:bg-slate-900 text-white transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) z-50 flex flex-col shadow-2xl print:hidden border-l border-white/5
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="relative h-24 flex items-center px-6 border-b border-white/10 bg-[#001a33]/50">
          <button onClick={toggleSidebar} className="lg:hidden absolute top-1/2 -translate-y-1/2 left-4 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 w-full">
             <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 shadow-lg">
                <img src={ACADEMY_LOGO_URL} alt="TVETA" className="w-full h-full object-contain" />
             </div>
             <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white leading-none">TVETA <span className="text-indigo-400">HR</span></h1>
                <p className="text-[10px] text-slate-400 font-medium mt-1 tracking-wide opacity-80">نظام إدارة الكادر</p>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">القائمة الرئيسية</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden mb-1
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                  <div className="flex items-center gap-3 relative z-10">
                      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300 transition-colors'}`}>
                          {item.icon}
                      </span>
                      <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  {isActive && <ChevronLeft size={16} className="text-indigo-200" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section & Theme Toggle */}
        <div className="p-4 mt-auto space-y-3 bg-[#001a33]/30 border-t border-white/5">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
          >
             <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-400" />}
                <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                    {theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح'}
                </span>
             </div>
             <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${theme === 'dark' ? 'left-0.5' : 'right-0.5'}`}></div>
             </div>
          </button>

          <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg">
                 <div className="w-full h-full rounded-full bg-[#002244] flex items-center justify-center overflow-hidden">
                    {user?.employee_national_id ? ( 
                        <UserIcon size={20} className="text-indigo-300" />
                    ) : (
                        <UserIcon size={20} className="text-gray-400" />
                    )}
                 </div>
              </div>
              <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                  <div className="mt-0.5">{getRoleBadge()}</div>
              </div>
              <button 
                onClick={logout}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                title="تسجيل خروج"
              >
                <LogOut size={18} />
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:mr-0 print:mr-0 w-full overflow-hidden">
         {/* Mobile Header */}
         <header className="lg:hidden bg-[#003366] text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md print:hidden">
            <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-lg"><img src={ACADEMY_LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" /></div>
                <span className="font-bold text-lg">TVETA HR</span>
            </div>
            <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Menu size={24} />
            </button>
         </header>
         
         <div className="p-4 lg:p-8 w-full max-w-full print:p-0">
            {children}
         </div>
      </main>
    </div>
  );
};
