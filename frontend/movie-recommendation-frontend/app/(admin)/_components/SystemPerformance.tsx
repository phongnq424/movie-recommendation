'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Trash2, 
  Server, 
  TrendingUp, 
  Terminal,
  RefreshCw
} from 'lucide-react';

/**
 * THÔNG TIN CHẨN ĐOÁN HỆ THỐNG MOCK
 * Dùng để phát triển UI, kiểm thử giao diện quản trị nâng cao.
 */
interface ServiceStatus {
  name: string;
  endpoint: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  uptime: string;
}

interface MetricHistoryPoint {
  time: string;
  cpu: number;
  memory: number;
  apiCalls: number;
}

export default function SystemPerformance() {
  const [cpuUsage, setCpuUsage] = useState(24);
  const [memoryUsage, setMemoryUsage] = useState(58);
  const [diskUsage] = useState(42.8); // GB used out of 100GB
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);
  
  // Lịch sử tải hệ thống phục vụ vẽ biểu đồ SVG Mock
  const [history, setHistory] = useState<MetricHistoryPoint[]>([
    { time: "16:00", cpu: 15, memory: 52, apiCalls: 120 },
    { time: "16:10", cpu: 22, memory: 53, apiCalls: 145 },
    { time: "16:20", cpu: 35, memory: 55, apiCalls: 210 },
    { time: "16:30", cpu: 28, memory: 56, apiCalls: 180 },
    { time: "16:40", cpu: 45, memory: 57, apiCalls: 290 },
    { time: "16:50", cpu: 24, memory: 58, apiCalls: 165 }
  ]);

  // Trạng thái các microservices giả lập
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Cơ sở dữ liệu (PostgreSQL)", endpoint: "localhost:5432", status: "ONLINE", latencyMs: 4, uptime: "15d 4h 22m" },
    { name: "Dịch vụ Xác thực (JWT Auth)", endpoint: "/api/v1/auth", status: "ONLINE", latencyMs: 12, uptime: "15d 4h 22m" },
    { name: "Dịch vụ Gợi ý (Collaborative)", endpoint: "/api/v1/recommend", status: "ONLINE", latencyMs: 85, uptime: "4d 11h 5m" },
    { name: "TMDB Metadata Sync Gateway", endpoint: "api.themoviedb.org", status: "ONLINE", latencyMs: 240, uptime: "30d 12h 0m" },
    { name: "Bộ nhớ đệm (Redis Cache)", endpoint: "localhost:6379", status: "ONLINE", latencyMs: 1, uptime: "15d 4h 21m" }
  ]);

  // Giả lập CPU và Memory dao động theo thời gian
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage(prev => {
        const diff = Math.floor(Math.random() * 9) - 4; // -4% to +4%
        const newVal = prev + diff;
        return Math.max(5, Math.min(newVal, 95));
      });
      
      setMemoryUsage(prev => {
        const diff = Math.floor(Math.random() * 3) - 1; // -1% to +1%
        const newVal = prev + diff;
        return Math.max(30, Math.min(newVal, 90));
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // HÀM CHẠY TỐI ƯU HÓA HỆ THỐNG MOCK
  const handleOptimizeSystem = () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setOptimizationProgress(0);
    setOptimizationLogs(["Bắt đầu tiến trình bảo trì và tối ưu hệ thống...", "Đang phân tích bộ nhớ đệm và các tệp rác..."]);
    
    const steps = [
      { prg: 20, log: "Dọn dẹp bộ nhớ đệm Redis: Đã xóa 1,240 keys hết hạn." },
      { prg: 45, log: "Đang giải phóng bộ nhớ RAM không sử dụng (Garbage Collection)..." },
      { prg: 70, log: "Tối ưu hóa các chỉ mục Database (Index Vacuuming)..." },
      { prg: 90, log: "Đã tối ưu hóa lưu lượng API Gateway. Kiểm tra bảo mật hoàn tất." },
      { prg: 100, log: "Hệ thống tối ưu hoàn tất! RAM giải phóng thành công, hiệu năng tăng ~15%." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setOptimizationProgress(step.prg);
        setOptimizationLogs(prev => [...prev, step.log]);
        
        if (step.prg === 45) {
          setMemoryUsage(prev => Math.max(prev - 12, 35));
        }
        if (step.prg === 100) {
          setCpuUsage(12);
        }
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsOptimizing(false);
        }, 1000);
      }
    }, 1200);
  };

  // Vẽ biểu đồ SVG từ dữ liệu history
  const svgCpuPoints = useMemo(() => {
    const width = 500;
    const height = 100;
    const padding = 10;
    const usableHeight = height - padding * 2;
    const stepX = width / (history.length - 1);
    
    return history.map((pt, i) => {
      const x = i * stepX;
      // cpu is 0-100, maps to height-padding down to padding
      const y = height - padding - (pt.cpu / 100) * usableHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [history]);

  const svgMemoryPoints = useMemo(() => {
    const width = 500;
    const height = 100;
    const padding = 10;
    const usableHeight = height - padding * 2;
    const stepX = width / (history.length - 1);
    
    return history.map((pt, i) => {
      const x = i * stepX;
      const y = height - padding - (pt.memory / 100) * usableHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [history]);

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-8">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500 animate-pulse" size={20} />
            Chẩn Đoán Hiệu Năng & Tài Nguyên
          </h2>
          <p className="text-xs text-zinc-400">Giám sát tải CPU, bộ nhớ, trạng thái cơ sở dữ liệu và API thời gian thực</p>
        </div>
        <button
          onClick={handleOptimizeSystem}
          disabled={isOptimizing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/10"
        >
          {isOptimizing ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
          {isOptimizing ? `Đang tối ưu (${optimizationProgress}%)` : "Tối Ưu Hệ Thống"}
        </button>
      </div>

      {/* CHỈ SỐ NHANH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU USAGE */}
        <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Cpu size={16} className="text-blue-400" />
              <span className="text-sm font-semibold">Tải CPU</span>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              cpuUsage > 80 ? 'bg-red-500/10 text-red-400' :
              cpuUsage > 50 ? 'bg-amber-500/10 text-amber-400' :
              'bg-green-500/10 text-green-400'
            }`}>{cpuUsage}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5 mb-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 50 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${cpuUsage}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-zinc-500">Tần số: 3.4 GHz | Luồng hoạt động: 12/16</span>
        </div>

        {/* MEMORY USAGE */}
        <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Server size={16} className="text-purple-400" />
              <span className="text-sm font-semibold">Bộ nhớ RAM</span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
              {memoryUsage}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5 mb-2 overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all duration-1000"
              style={{ width: `${memoryUsage}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-zinc-500">Đã dùng: {(16 * memoryUsage / 100).toFixed(1)} GB / 16.0 GB RAM</span>
        </div>

        {/* STORAGE USAGE */}
        <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <HardDrive size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold">Lưu trữ SSD</span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              {diskUsage}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5 mb-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${diskUsage}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-zinc-500">Khả dụng: 57.2 GB trống trong tổng số 100 GB SSD</span>
        </div>
      </div>

      {/* BIỂU ĐỒ SVG TẢI HỆ THỐNG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" />
            Biểu đồ tải CPU (60 phút qua)
          </h3>
          <div className="w-full h-[120px] bg-zinc-950/80 rounded-lg p-2 relative border border-white/5 flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              {/* CPU Line */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={svgCpuPoints}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute top-2 right-2 text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              Hiện tại: {cpuUsage}%
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-400" />
            Biểu đồ tải Memory (60 phút qua)
          </h3>
          <div className="w-full h-[120px] bg-zinc-950/80 rounded-lg p-2 relative border border-white/5 flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              {/* Memory Line */}
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                points={svgMemoryPoints}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute top-2 right-2 text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              Hiện tại: {memoryUsage}%
            </div>
          </div>
        </div>
      </div>

      {/* TRẠNG THÁI CÁC microservices & TIẾN TRÌNH TỐI ƯU HÓA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Microservices Status */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server size={14} className="text-zinc-400" />
            Trạng Thái Dịch Vụ Microservices
          </h3>
          <div className="border border-white/5 rounded-xl bg-zinc-950/30 overflow-hidden divide-y divide-white/5">
            {services.map((svc, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-white/2 transition-colors">
                <div className="space-y-1">
                  <div className="font-semibold text-zinc-200">{svc.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{svc.endpoint}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-zinc-300">{svc.latencyMs}ms</div>
                    <div className="text-[9px] text-zinc-500">Uptime: {svc.uptime}</div>
                  </div>
                  <div>
                    {svc.status === 'ONLINE' ? (
                      <span className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10 font-bold">
                        ONLINE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                        WARN
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LOGS TỐI ƯU HÓA HỆ THỐNG */}
        <div className="flex flex-col justify-between bg-zinc-950/60 border border-white/5 rounded-xl p-5 min-h-[200px]">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Terminal size={14} className="text-blue-400" />
              Bảng Tin Bảo Trì Hệ Thống
            </h3>
            <div className="bg-black/80 rounded-lg p-3 font-mono text-[10px] text-zinc-400 h-[150px] overflow-y-auto space-y-2 border border-white/5">
              {optimizationLogs.length > 0 ? (
                optimizationLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    <span className="text-blue-500">admin@novaflix:~$</span> {log}
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 italic text-center pt-8">
                  Hệ thống chưa chạy tiến trình tối ưu hóa. Bấm nút "Tối Ưu Hệ Thống" ở trên để chạy.
                </div>
              )}
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              Bảo trì định kỳ: Hằng tuần
            </span>
            <span>Phiên bản: 1.0.4-MOCK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
