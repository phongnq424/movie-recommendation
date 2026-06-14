'use client';

import { Menu } from 'lucide-react';

type AdminHeaderProps = {
  user: {
    fullName: string;
    email: string;
    roles?: string[];
    permissions?: string[];
    avatarUrl?: string | null;
  };
};

function getDisplayRole(roles?: string[]) {
  if (!roles || roles.length === 0) {
    return 'Administrator';
  }

  if (roles.includes('ADMIN')) {
    return 'Administrator';
  }

  return roles[0]
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const userFullName = user.fullName || 'Admin User';
  const displayRole = getDisplayRole(user.roles);

  return (
    <header className="h-16 border-b border-white/10 bg-[#08080a] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-zinc-400 hover:text-white">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{userFullName}</p>
            <p className="text-xs text-zinc-400">{displayRole}</p>
          </div>

          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={userFullName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
              {userFullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}