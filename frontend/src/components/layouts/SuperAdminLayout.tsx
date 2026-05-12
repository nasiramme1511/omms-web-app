import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { relativeTime } from '../../lib/relativeTime';
import {
  LayoutDashboard,
  Building2,
  UserCog,
  Users,
  CreditCard,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Inbox,
  Loader2,
  Menu,
  Zap,
  X as CloseIcon,
} from 'lucide-react';

const nav = [
  { to: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/super-admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/super-admin/org-admins', label: 'OrgAdmins', icon: UserCog },
  { to: '/super-admin/members', label: 'Members', icon: Users },
  { to: '/super-admin/plans', label: 'Upgrade Plans', icon: Zap },
  { to: '/super-admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/super-admin/system-config', label: 'System Config', icon: Settings },
];

const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  type ApiNotification = { id: number; title: string; read: boolean; createdAt: string };
  type Panel = 'notifications' | 'user' | null;

  const [open, setOpen] = useState<Panel>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const queryClient = useQueryClient();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const { data: notifications = [], isLoading: notifsLoading, isError: notifsError } = useQuery({
    queryKey: ['superadmin-notifications'],
    queryFn: async () => {
      const { data } = await api.get<ApiNotification[]>('/notifications');
      return data;
    },
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin-notifications'] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin-notifications'] }),
  });

  const unread = notifications.filter((n) => !n.read).length;

  const close = useCallback(() => setOpen(null), []);
  const toggle = useCallback((panel: Exclude<Panel, null>) => {
    setOpen((prev) => (prev === panel ? null : panel));
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleLogout = () => {
    close();
    logout();
    navigate('/login', { replace: true });
  };

  const iconBtn =
    'inline-flex shrink-0 items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 sm:min-h-[40px] sm:min-w-[40px] sm:rounded-lg';

  const panelClass =
    'absolute right-0 z-50 mt-1 max-h-[min(70vh,24rem)] w-[min(calc(100vw-1.5rem),20rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 sm:max-h-[min(80vh,22rem)] sm:w-80';

  const notifId = `${baseId}-notifications`;
  const userId = `${baseId}-user`;
  return (
    <div className="min-h-screen bg-slate-50 flex font-poppins relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[50] w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-auto lg:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <Link
              to="/"
              title="Back to public home"
              className="text-lg font-black tracking-tight text-white hover:text-sky-300 transition-colors block"
            >
              OMMS
            </Link>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
          </div>
          <button 
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-2 py-2 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-[30]">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search data, organizations, members..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-4" ref={containerRef}>
            <div className="relative">
                {open === 'notifications' ? (
                  <button
                    title="notifications"
                    type="button"
                    className={`${iconBtn} relative`}
                    aria-label="Notifications"
                    aria-expanded="true"
                    aria-haspopup="true"
                    aria-controls={notifId}
                    id={`${notifId}-trigger`}
                    onClick={() => toggle('notifications')}
                  >
                    <Bell size={20} />
                    {unread > 0 ? (
                      <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white sm:right-1.5 sm:top-1.5">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : null}
                  </button>
                ) : (
                  <button
                    title="notifications"
                    type="button"
                    className={`${iconBtn} relative`}
                    aria-label="Notifications"
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-controls={notifId}
                    id={`${notifId}-trigger`}
                    onClick={() => toggle('notifications')}
                  >
                    <Bell size={20} />
                    {unread > 0 ? (
                      <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white sm:right-1.5 sm:top-1.5">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : null}
                  </button>
                )}

              {open === 'notifications' ? (
                <div
                  id={notifId}
                  role="region"
                  aria-labelledby={`${notifId}-trigger`}
                  className={panelClass}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    {unread > 0 && !notifsLoading ? (
                      <button
                        type="button"
                        onClick={() => markAllMut.mutate()}
                        disabled={markAllMut.isPending}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                      >
                        {markAllMut.isPending ? '…' : 'Mark all read'}
                      </button>
                    ) : null}
                  </div>

                  <ul className="max-h-[min(50vh,18rem)] divide-y divide-gray-50 overflow-y-auto overscroll-contain">
                    {notifsLoading ? (
                      <li className="flex justify-center px-4 py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-label="Loading" />
                      </li>
                    ) : notifsError ? (
                      <li className="px-4 py-8 text-center text-sm text-red-600">
                        Could not load notifications.
                      </li>
                    ) : notifications.length === 0 ? (
                      <li className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-gray-500">
                        <Inbox className="h-8 w-8 text-gray-300" aria-hidden />
                        No notifications
                      </li>
                    ) : (
                      notifications.map((n: ApiNotification) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!n.read) markReadMut.mutate(n.id);
                            }}
                            disabled={markReadMut.isPending}
                            className={`flex w-full gap-3 px-3 py-3 text-left text-sm transition hover:bg-gray-50 disabled:opacity-60 ${
                              n.read ? 'opacity-75' : 'bg-indigo-50/40'
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                n.read ? 'bg-gray-300' : 'bg-indigo-500'
                              }`}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="font-medium text-slate-800">{n.title}</span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                {relativeTime(n.createdAt)}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="relative">
              {open === 'user' ? (
                <button
                  title="user menu"
                  type="button"
                  className="inline-flex items-center gap-3 text-sm font-bold text-gray-800 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors"
                  aria-expanded="true"
                  aria-haspopup="true"
                  aria-controls={userId}
                  id={`${userId}-trigger`}
                  onClick={() => toggle('user')}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={
                        user?.profile_photo_path 
                          ? `/uploads/${user.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=e0e7ff&color=3730a3`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                  <ChevronDown
                    size={16}
                    className="text-gray-400 transition-transform rotate-180"
                  />
                </button>
              ) : (
                <button
                  title="user menu"
                  type="button"
                  className="inline-flex items-center gap-3 text-sm font-bold text-gray-800 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors"
                  aria-expanded="false"
                  aria-haspopup="true"
                  aria-controls={userId}
                  id={`${userId}-trigger`}
                  onClick={() => toggle('user')}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={
                        user?.profile_photo_path 
                          ? `/uploads/${user.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=e0e7ff&color=3730a3`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                  <ChevronDown
                    size={16}
                    className="text-gray-400 transition-transform"
                  />
                </button>
              )}

              {open === 'user' ? (
                <div
                  title="user menu"
                  id={userId}
                  role="menu"
                  aria-labelledby={`${userId}-trigger`}
                  className={`${panelClass} max-h-none`}
                >
                  <div className="border-b border-gray-100 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>

                  <div className="py-1" role="none">
                    <Link
                      to="/super-admin/system-config"
                      role="menuitem"
                      onClick={close}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                      System config
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 p-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
