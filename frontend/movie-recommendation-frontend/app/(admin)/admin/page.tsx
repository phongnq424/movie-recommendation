export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Simple mock stat cards */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-zinc-400 font-medium mb-2">Tổng số phim</h3>
          <p className="text-3xl font-bold text-white">--</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-zinc-400 font-medium mb-2">Tổng thể loại</h3>
          <p className="text-3xl font-bold text-white">--</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-zinc-400 font-medium mb-2">Tổng diễn viên</h3>
          <p className="text-3xl font-bold text-white">--</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-zinc-400 font-medium mb-2">Người dùng</h3>
          <p className="text-3xl font-bold text-white">--</p>
        </div>
      </div>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-zinc-400">
        <p>Chào mừng bạn đến với trang quản trị NovaFlix.</p>
        <p className="mt-2 text-sm">Vui lòng chọn các mục trong menu bên trái để bắt đầu quản lý hệ thống.</p>
      </div>
    </div>
  );
}
