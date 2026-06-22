import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebar from './_components/AdminSidebar';
import AdminHeader from './_components/AdminHeader';

type CurrentUser = {
  publicId?: string;
  userPublicId?: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  avatarUrl?: string | null;
  status?: string;
};

async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  try {
    const response = await fetch(`${apiUrl}users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: `access_token=${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

function canAccessAdmin(user: CurrentUser) {
  const roles = user.roles ?? [];
  const permissions = user.permissions ?? [];

  if (roles.includes('ADMIN')) {
    return true;
  }

  return permissions.some((permission) =>
    [
      'USER_READ',
      'ROLE_READ',
      'PERMISSION_READ',
      'MOVIE_READ_ADMIN',
      'ACTOR_READ_ADMIN',
      'GENRE_READ_ADMIN',
      'REVIEW_READ_ADMIN',
      'RATING_READ_ADMIN',
      'RECOMMENDATION_REFRESH_PUBLIC',
    ].includes(permission)
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!canAccessAdmin(user)) {
    redirect('/');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#08080a] text-white">
      <div className="hidden lg:block">
        <AdminSidebar
          roles={user.roles ?? []}
          permissions={user.permissions ?? []}
        />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader user={user} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}