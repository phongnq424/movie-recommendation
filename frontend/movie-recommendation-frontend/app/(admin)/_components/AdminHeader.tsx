'use client';

import { Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminHeader() {
  const [userFullName, setUserFullName] = useState<string>('Admin User');

  useEffect(() => {
    // Read user_info from localStorage (if client side)
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo.fullName) {
          setUserFullName(userInfo.fullName);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <header className="h-16 border-b border-white/10 bg-[#08080a] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle would go here */}
        <button className="lg:hidden text-zinc-400 hover:text-white">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{userFullName}</p>
            <p className="text-xs text-zinc-400">Administrator</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
            {userFullName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
