import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  ArrowUpCircle,
  Settings,
  ChevronRight,
  LogOut,
  Menu,
  X as CloseIcon,
} from 'lucide-react';

/** Sidebar labels align with main content titles (see OMMS org-admin mocks). */
const nav = [
  { to: '/org-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/org-admin/members', label: 'Member Management', icon: Users },
  { to: '/org-admin/events', label: 'Event Management', icon: Calendar },
  { to: '/org-admin/blogs', label: 'Blog & Announcements', icon: FileText, narrow: true },
  { to: '/org-admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/org-admin/upgrade', label: 'Upgrade Plan', icon: ArrowUpCircle },
  { to: '/org-admin/settings', label: 'Settings', icon: Settings },
];

const OrgAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const orgLabel = user?.organization_name || 'Your organization';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex font-poppins relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[50] w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-auto lg:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <Link
              to="/"
              title="Back to public home"
              className="text-xl font-black text-indigo-600 hover:text-indigo-500 transition-colors block"
            >
              OMMS
            </Link>
            <p
              className="text-[11px] text-gray-500 uppercase tracking-wide mt-1 truncate"
              title={orgLabel}
            >
              {orgLabel}
            </p>
          </div>
          <button 
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all leading-snug ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 mt-0.5 ${active ? 'text-indigo-600' : 'text-gray-400'}`}
                />
                <span className={(item as { narrow?: boolean }).narrow ? 'text-[13px]' : ''}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm overflow-hidden border border-indigo-200/50">
              {user?.profile_photo_path ? (
                <img 
                  src={`/uploads/${user.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.name?.charAt(0) ?? '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-indigo-600/90 font-medium">Org Admin</p>
            </div>
          </div>
          <Link
            to="/org-admin/profile"
            onClick={closeSidebar}
            className="flex items-center justify-between text-xs font-bold text-indigo-600 hover:underline"
          >
            Edit Profile
            <ChevronRight size={14} />
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-3 flex items-center gap-2 text-sm text-red-500 hover:text-red-600 w-full transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between lg:justify-end items-center sticky top-0 z-[30] min-h-[64px]">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-bold text-gray-800">{user?.name}</span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OrgAdminLayout;
