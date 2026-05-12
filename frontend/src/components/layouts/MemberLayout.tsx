import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  User,
  Calendar,
  FileText,
  CreditCard,
  ChevronRight,
  LogOut,
  Menu,
  X as CloseIcon,
} from 'lucide-react';

const nav = [
  { to: '/member/dashboard', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/member/profile', label: 'Profile', icon: User },
  { to: '/member/events', label: 'Events', icon: Calendar },
  { to: '/member/blog', label: 'Blog', icon: FileText },
  { to: '/member/payments', label: 'Payments', icon: CreditCard },
];

const MemberLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 flex font-poppins relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[50] w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-auto lg:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <Link
              to="/"
              title="Back to public home"
              className="text-lg font-black text-sky-600 hover:text-sky-500 transition-colors block"
            >
              OMMS
            </Link>
            <p className="text-xs text-gray-500 mt-1">Member Dashboard</p>
          </div>
          <button 
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  active ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs border border-sky-200 overflow-hidden">
              {user?.profile_photo_path ? (
                <img 
                  src={`/uploads/${user.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.name?.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500">Member</p>
            </div>
          </div>
          <Link to="/member/profile" onClick={closeSidebar} className="text-xs font-bold text-sky-600 flex items-center justify-between hover:underline">
            Edit Profile
            <ChevronRight size={12} />
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-3 flex items-center gap-2 text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between lg:justify-end items-center sticky top-0 z-[30]">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-bold text-gray-800">{user?.name}</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] border border-slate-200">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
