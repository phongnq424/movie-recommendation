import AdminSidebar from './_components/AdminSidebar';
import AdminHeader from './_components/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#08080a] text-white">
      {/* Sidebar - hidden on mobile, block on lg */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
