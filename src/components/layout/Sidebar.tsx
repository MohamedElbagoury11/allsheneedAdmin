import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Package, 
  Folders, 
  ShoppingCart, 
  Bell, 
  LogOut, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Folders, label: 'Categories', path: '/categories' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
];

const Sidebar = ({ isCollapsed, toggleCollapse }: { isCollapsed: boolean, toggleCollapse: () => void }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const { data: notifications } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get('/admin/analytics/notifications').then(res => res.data),
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center justify-between p-6 h-20 border-b border-slate-100">
        {!isCollapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Panel
          </span>
        )}
        <button 
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
              isActive 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "text-slate-600 hover:bg-slate-50 hover:text-primary"
            )}
          >
            <item.icon size={20} className={cn("min-w-[20px]")} />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            {item.label === 'Notifications' && unreadCount > 0 && (
              <span className={cn(
                "absolute flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full min-w-[20px] h-5 px-1",
                isCollapsed ? "top-1 right-1" : "ml-auto"
              )}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        {!isCollapsed && (
          <div className="mb-4 px-4 py-3 bg-slate-50 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.name?.[0] || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user.email || 'admin@store.com'}</p>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
