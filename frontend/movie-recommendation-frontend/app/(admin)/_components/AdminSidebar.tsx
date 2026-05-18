'use client';

import Link from 'next/link';
import { 
  Film, 
  Tags, 
  Users, 
  UserCircle, 
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    router.push('/auth/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Phim (Movies)', href: '/admin/movies', icon: Film },
    { name: 'Thể loại (Genres)', href: '/admin/genres', icon: Tags },
    { name: 'Diễn viên (Actors)', href: '/admin/actors', icon: UserCircle },
    { name: 'Người dùng (Users)', href: '/admin/users', icon: Users },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-white/10 flex flex-col h-full">
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
            <Film size={18} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            NOVA<span className="text-red-600">ADMIN</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-red-600/10 text-red-500' 
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 transition-colors hover:bg-red-950/30"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
