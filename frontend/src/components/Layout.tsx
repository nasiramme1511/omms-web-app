import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Calendar, BookOpen, LogOut, User as UserIcon, Home } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard', roles: ['orgAdmin', 'member', 'SuperAdmin'] },
    { icon: <Users size={20} />, label: 'Organizations', path: '/dashboard/admin/organizations', roles: ['SuperAdmin'] },
    { icon: <Users size={20} />, label: 'Members', path: '/dashboard/members', roles: ['orgAdmin', 'SuperAdmin'] },
    { icon: <Calendar size={20} />, label: 'Events', path: '/dashboard/events', roles: ['orgAdmin', 'member'] },
    { icon: <BookOpen size={20} />, label: 'Blogs', path: '/dashboard/blogs', roles: ['orgAdmin', 'member'] },
    { icon: <CreditCard size={20} />, label: 'Payments', path: '/dashboard/payments', roles: ['orgAdmin', 'SuperAdmin'] },
    { icon: <UserIcon size={20} />, label: 'Profile', path: '/dashboard/profile', roles: ['orgAdmin', 'member', 'SuperAdmin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-xl border-r border-gray-100 flex flex-col">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-medium rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-medium/20">
              M
            </div>
            <span className="text-xl font-black text-brand-dark tracking-tight">
              MemberShip<span className="text-brand-medium">Pro</span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-black text-brand-deep uppercase tracking-[0.2em] mb-6 ml-2 opacity-50">Main Menu</p>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3.5 rounded-2xl font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-medium text-white shadow-xl shadow-brand-medium/20 translate-x-1'
                    : 'text-gray-400 hover:bg-brand-pale/30 hover:text-brand-medium'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-inherit'}`}>
                  {item.icon}
                </div>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-gray-50 bg-gray-50/50">
           <Link
             to="/"
             className="flex items-center space-x-3 p-3 rounded-2xl font-bold text-gray-400 hover:bg-white hover:text-brand-dark transition-all duration-300 mb-2"
           >
             <Home size={20} />
             <span className="text-sm">Back to Site</span>
           </Link>
           <button
             onClick={handleLogout}
             className="flex items-center space-x-3 p-3 rounded-2xl font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 w-full text-left"
           >
             <LogOut size={20} />
             <span className="text-sm">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 px-10 py-5 flex justify-between items-center shadow-sm">
          <div>
             <h2 className="text-xl font-black text-brand-dark tracking-tight">
               {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
             </h2>
          </div>
          <div className="flex items-center space-x-6">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-brand-dark leading-none">{user?.name}</p>
                <p className="text-[10px] font-bold text-brand-medium mt-1.5 uppercase tracking-widest bg-brand-pale/30 px-2 py-0.5 rounded-md inline-block">{user?.role}</p>
             </div>
             <div className="relative group cursor-pointer">
                <img
                   src={user?.profile_photo_path ? `/uploads/${user.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}` : `https://ui-avatars.com/api/?name=${user?.name}&background=ecf39e&color=132a13`}
                   alt="Profile"
                   className="w-11 h-11 rounded-2xl border-2 border-white shadow-md ring-1 ring-gray-100 group-hover:ring-brand-medium transition-all"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-medium border-2 border-white rounded-full shadow-sm"></div>
             </div>
          </div>
        </header>
        <div className="p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
