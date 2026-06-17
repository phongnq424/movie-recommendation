'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Link2, 
  Database, 
  Save, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Upload, 
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

/**
 * CẤU HÌNH HỆ THỐNG MOCK
 * Dùng để mô phỏng trang quản trị cấu hình hệ thống phim NovaFlix.
 */
interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  itemsPerPage: number;
  enableRegistration: boolean;
  tmdbApiKey: string;
  tmdbBaseUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  sessionTimeoutMin: number;
  maxFailedLogins: number;
  enableRateLimit: boolean;
  backupSchedule: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  backupRetentionDays: number;
}

const INITIAL_SETTINGS: SystemSettings = {
  siteTitle: "NovaFlix - Khám Phá Thế Giới Phim Ảnh",
  siteDescription: "Hệ thống gợi ý phim thông minh hàng đầu dựa trên sở thích cá nhân.",
  itemsPerPage: 12,
  enableRegistration: true,
  tmdbApiKey: "8a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p",
  tmdbBaseUrl: "https://api.themoviedb.org/3",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "noreply@novaflix.com",
  smtpPass: "••••••••••••••••",
  sessionTimeoutMin: 120,
  maxFailedLogins: 5,
  enableRateLimit: true,
  backupSchedule: "DAILY",
  backupRetentionDays: 30
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'integrations' | 'backups'>('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // XỬ LÝ THAY ĐỔI GIÁ TRỊ INPUT
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseInt(value) || 0 
          : value
    }));
  };

  const handleCheckboxChange = (name: keyof SystemSettings, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // LƯU CẤU HÌNH (MOCK ACTION)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Giả lập cuộc gọi API lưu trữ
    setTimeout(() => {
      setIsSaving(false);
      setToastMessage({
        text: "Đã lưu toàn bộ cấu hình hệ thống thành công!",
        type: "success"
      });
      
      // Tự tắt Toast sau 4 giây
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 1000);
  };

  // KHÔI PHỤC CẤU HÌNH BAN ĐẦU
  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục cấu hình mặc định?")) {
      setSettings(INITIAL_SETTINGS);
      setToastMessage({
        text: "Đã khôi phục cài đặt gốc.",
        type: "success"
      });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* TIÊU ĐỀ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Settings className="text-red-500 animate-spin-slow" size={28} />
            Cấu Hình Hệ Thống
          </h1>
          <p className="text-zinc-400">Thiết lập các thông số hoạt động, bảo mật và kết nối API (Mock Page)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors text-sm font-semibold"
          >
            <RotateCcw size={16} />
            Mặc Định
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-600/10 text-sm"
          >
            <Save size={16} />
            {isSaving ? "Đang lưu..." : "Lưu Cài Đặt"}
          </button>
        </div>
      </div>

      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* GIAO DIỆN TABS CÀI ĐẶT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* THANH MENU TABS BÊN TRÁI */}
        <div className="lg:col-span-1 flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'general' 
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/10' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sparkles size={18} />
            Cấu hình chung
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'security' 
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/10' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shield size={18} />
            Bảo mật & Phiên
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'integrations' 
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/10' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Link2 size={18} />
            Kết nối API bên ngoài
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'backups' 
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/10' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Database size={18} />
            Sao lưu & Dữ liệu
          </button>
        </div>

        {/* NỘI DUNG FORM TABS BÊN PHẢI */}
        <div className="lg:col-span-3 bg-[#111114] border border-white/10 rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* TAB 1: CẤU HÌNH CHUNG */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Cấu Hình Chung Hệ Thống</h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      Tiêu đề trang Web (Title)
                      <span className="text-zinc-500 cursor-help" title="Tiêu đề chính hiển thị trên tab trình duyệt.">
                        <HelpCircle size={12} />
                      </span>
                    </label>
                    <input
                      type="text"
                      name="siteTitle"
                      value={settings.siteTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mô tả SEO trang web</label>
                    <textarea
                      name="siteDescription"
                      rows={3}
                      value={settings.siteDescription}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Số phim mỗi trang</label>
                      <input
                        type="number"
                        name="itemsPerPage"
                        value={settings.itemsPerPage}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-white/5 rounded-xl self-end h-[46px]">
                      <span className="text-sm text-zinc-300">Mở cổng đăng ký tài khoản</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.enableRegistration} 
                          onChange={(e) => handleCheckboxChange('enableRegistration', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BẢO MẬT */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Bảo Mật & Quản Lý Phiên</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Thời hạn phiên đăng nhập (phút)</label>
                    <input
                      type="number"
                      name="sessionTimeoutMin"
                      value={settings.sessionTimeoutMin}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Số lần thử đăng nhập tối đa</label>
                    <input
                      type="number"
                      name="maxFailedLogins"
                      value={settings.maxFailedLogins}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-white/5 rounded-xl">
                  <div>
                    <span className="text-sm font-semibold text-zinc-200 block">Kích hoạt Rate Limiting</span>
                    <span className="text-xs text-zinc-500 block">Giới hạn số lượt gọi API từ 1 IP để phòng chống DDoS (tối đa 100 req/phút)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.enableRateLimit} 
                      onChange={(e) => handleCheckboxChange('enableRateLimit', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: TÍCH HỢP API */}
            {activeTab === 'integrations' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Kết Nối API Ngoài & SMTP</h3>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} />
                    Cấu hình The Movie Database (TMDB)
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">TMDB API Base URL</label>
                      <input
                        type="text"
                        name="tmdbBaseUrl"
                        value={settings.tmdbBaseUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">TMDB API Token Key</label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          name="tmdbApiKey"
                          value={settings.tmdbApiKey}
                          onChange={handleChange}
                          className="w-full pl-4 pr-10 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} />
                    Hệ thống gửi thư (SMTP Server)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SMTP Host</label>
                      <input
                        type="text"
                        name="smtpHost"
                        value={settings.smtpHost}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SMTP Port</label>
                      <input
                        type="number"
                        name="smtpPort"
                        value={settings.smtpPort}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tài khoản SMTP</label>
                      <input
                        type="text"
                        name="smtpUser"
                        value={settings.smtpUser}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mật khẩu SMTP</label>
                      <div className="relative">
                        <input
                          type={showSmtpPass ? "text" : "password"}
                          name="smtpPass"
                          value={settings.smtpPass}
                          onChange={handleChange}
                          className="w-full pl-4 pr-10 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(!showSmtpPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                          {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAO LƯU DỮ LIỆU */}
            {activeTab === 'backups' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Sao Lưu & Quản Lý Dữ Liệu</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tần suất sao lưu cơ sở dữ liệu</label>
                    <select
                      name="backupSchedule"
                      value={settings.backupSchedule}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 cursor-pointer"
                    >
                      <option value="DAILY">Hàng ngày (Khuyên dùng)</option>
                      <option value="WEEKLY">Hàng tuần</option>
                      <option value="MONTHLY">Hàng tháng</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Thời gian lưu trữ bản sao lưu (ngày)</label>
                    <input
                      type="number"
                      name="backupRetentionDays"
                      value={settings.backupRetentionDays}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                </div>

                <div className="p-5 border border-white/5 bg-zinc-950/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-zinc-200 block">Sao lưu dữ liệu ngay lập tức</span>
                    <span className="text-xs text-zinc-500 block">Tạo file backup SQL nén và tải về thiết bị của bạn.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("Tính năng DEMO: Tiến trình tạo file backup đang được thực thi ngầm...")}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-white/5 self-start md:self-auto"
                  >
                    <Upload size={14} className="rotate-180" />
                    Chạy Sao Lưu Ngay
                  </button>
                </div>
              </div>
            )}
            
            {/* THÔNG TIN PHIÊN BẢN */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
              <span>Hệ thống: NovaFlix Administration Portal v1.2</span>
              <span>Framework: NextJS 16.2 & React 19</span>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
