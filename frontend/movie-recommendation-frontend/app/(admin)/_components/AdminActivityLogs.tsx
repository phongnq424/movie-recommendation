'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  User,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * MOCK AUDIT LOG INTERFACE
 * Định nghĩa cấu trúc dữ liệu cho hoạt động logs của hệ thống.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'MOVIE' | 'GENRE' | 'ACTOR' | 'USER' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  ipAddress: string;
  details: string;
  metaData: Record<string, any>;
}

/**
 * MOCK DATA - Nhật ký hoạt động quản trị viên (chạy offline)
 * Cung cấp dữ liệu mẫu phong phú để phục vụ việc hiển thị UI và tăng dung lượng code theo yêu cầu.
 */
const INITIAL_MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-06-05 16:45:12",
    adminName: "Phan Vũ Cao",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Đã thêm phim 'Spider-Man: No Way Home' vào hệ thống thành công.",
    metaData: { movieId: "m-102", title: "Spider-Man: No Way Home", category: "Action, Adventure", year: 2021 }
  },
  {
    id: "LOG-002",
    timestamp: "2026-06-05 16:30:45",
    adminName: "Phan Vũ Cao",
    action: "Cập nhật thông tin người dùng",
    category: "USER",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Cập nhật phân quyền người dùng 'phongnq424' từ USER lên PREMIUM.",
    metaData: { userId: "usr-992", oldRole: "USER", newRole: "PREMIUM" }
  },
  {
    id: "LOG-003",
    timestamp: "2026-06-05 15:12:00",
    adminName: "Hệ thống tự động",
    action: "Đồng bộ TMDB API",
    category: "SYSTEM",
    status: "WARNING",
    ipAddress: "127.0.0.1",
    details: "Phát hiện độ trễ kết nối cao khi kết nối đến API TMDB (1200ms).",
    metaData: { provider: "TMDB", latencyMs: 1200, retryAttempt: 1 }
  },
  {
    id: "LOG-004",
    timestamp: "2026-06-05 14:50:33",
    adminName: "Nguyễn Quốc Phong",
    action: "Xóa thể loại",
    category: "GENRE",
    status: "DANGER",
    ipAddress: "192.168.1.88",
    details: "Đã xóa thể loại phim 'Musical' do không còn phim nào liên kết.",
    metaData: { genreId: "g-15", name: "Musical", linkedMoviesCount: 0 }
  },
  {
    id: "LOG-005",
    timestamp: "2026-06-05 13:22:18",
    adminName: "Phan Vũ Cao",
    action: "Chỉnh sửa diễn viên",
    category: "ACTOR",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thay đổi ảnh đại diện cho diễn viên 'Robert Downey Jr.'.",
    metaData: { actorId: "act-55", name: "Robert Downey Jr.", oldImage: "/old.jpg", newImage: "/new.jpg" }
  },
  {
    id: "LOG-006",
    timestamp: "2026-06-05 12:05:00",
    adminName: "Hệ thống tự động",
    action: "Backup database",
    category: "SYSTEM",
    status: "SUCCESS",
    ipAddress: "localhost",
    details: "Sao lưu cơ sở dữ liệu hàng ngày hoàn tất. File: db_backup_20260605.sql.gz",
    metaData: { sizeMb: 142.5, compressRate: "78%", durationSec: 12 }
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-05 11:30:29",
    adminName: "Nguyễn Quốc Phong",
    action: "Thêm phim mới",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Đã thêm phim hoạt hình 'Inside Out 2' từ API ngoài.",
    metaData: { movieId: "m-103", title: "Inside Out 2", source: "Import Wizard" }
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-05 10:15:10",
    adminName: "Hệ thống tự động",
    action: "Cảnh báo bảo mật",
    category: "SYSTEM",
    status: "DANGER",
    ipAddress: "203.113.15.22",
    details: "Phát hiện 5 lần đăng nhập sai liên tiếp vào tài khoản quản trị 'admin_test'.",
    metaData: { blockedIp: "203.113.15.22", blockDurationMin: 30, targetAccount: "admin_test" }
  },
  {
    id: "LOG-009",
    timestamp: "2026-06-05 09:40:00",
    adminName: "Phan Vũ Cao",
    action: "Thêm thể loại",
    category: "GENRE",
    status: "SUCCESS",
    ipAddress: "192.168.1.15",
    details: "Thêm thể loại mới 'Hành động viễn tưởng'.",
    metaData: { genreId: "g-16", name: "Hành động viễn tưởng" }
  },
  {
    id: "LOG-010",
    timestamp: "2026-06-05 08:22:11",
    adminName: "Nguyễn Quốc Phong",
    action: "Cập nhật trạng thái phim",
    category: "MOVIE",
    status: "SUCCESS",
    ipAddress: "192.168.1.88",
    details: "Thay đổi trạng thái phim 'Interstellar' thành 'Nổi bật' (Featured).",
    metaData: { movieId: "m-44", title: "Interstellar", status: "FEATURED" }
  }
];

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // LÀM MỚI DANH SÁCH (MOCK ACTION)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Thêm log ngẫu nhiên khi refresh để tăng độ sinh động
      const newLog: AuditLog = {
        id: `LOG-0${logs.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        adminName: Math.random() > 0.5 ? "Phan Vũ Cao" : "Nguyễn Quốc Phong",
        action: "Đọc cấu hình hệ thống",
        category: "SYSTEM",
        status: "SUCCESS",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        details: "Quản trị viên đã kiểm tra cài đặt logs bảo mật.",
        metaData: { timestamp: Date.now(), agent: "Chrome/NextJS Client" }
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // LỌC DỮ LIỆU LOGS THEO ĐIỀU KIỆN TÌM KIẾM
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [logs, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // PHÂN TRANG LOGS
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // XUẤT CSV MOCK
  const handleExportCSV = () => {
    alert("Tính năng DEMO: Dữ liệu " + filteredLogs.length + " bản ghi logs đã được xuất thành công dưới dạng CSV!");
  };

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* TIÊU ĐỀ & NÚT ĐIỀU KHIỂN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-red-500" size={20} />
            Lịch Sử Hoạt Động Quản Trị
          </h2>
          <p className="text-xs text-zinc-400">Xem và lọc các hoạt động chỉnh sửa dữ liệu, cấu hình hệ thống (Mock Component)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
            title="Làm mới log"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
          >
            <Download size={14} />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo hành động, nội dung, admin..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Lọc theo Phân mục */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="MOVIE">Phim ảnh</option>
            <option value="GENRE">Thể loại</option>
            <option value="ACTOR">Diễn viên</option>
            <option value="USER">Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LOGS */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-zinc-400 bg-zinc-950/50 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[120px]">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition-colors">
                  Thời gian
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3.5 px-4 w-[150px]">Người thực hiện</th>
              <th className="py-3.5 px-4 w-[140px]">Hành động</th>
              <th className="py-3.5 px-4 w-[100px]">Phân loại</th>
              <th className="py-3.5 px-4">Chi tiết</th>
              <th className="py-3.5 px-4 w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[80px] text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5 text-zinc-400">
                        <User size={12} />
                      </div>
                      {log.adminName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.category === 'MOVIE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.category === 'USER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.category === 'GENRE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.category === 'ACTOR' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-[250px] text-zinc-400" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex justify-center">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} />
                          Warning
                        </span>
                      )}
                      {log.status === 'DANGER' && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={12} />
                          Danger
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Không tìm thấy nhật ký hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG UI */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-zinc-400">
          Hiển thị {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số {filteredLogs.length} logs
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${currentPage === index + 1
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* DIALOG XEM JSON CHI TIẾT MOCK */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="text-red-500" size={18} />
              Chi Tiết Hoạt Động {selectedLog.id}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Thời gian log: {selectedLog.timestamp} | Thực hiện bởi: {selectedLog.adminName}</p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 overflow-auto max-h-[300px]">
              <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <span className="text-xs text-zinc-500 self-center">IP: {selectedLog.ipAddress}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}