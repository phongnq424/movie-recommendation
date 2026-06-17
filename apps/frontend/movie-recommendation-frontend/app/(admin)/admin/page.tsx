'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Users, Clapperboard, Layers, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import axiosClient from '@/services/axios';
// import AdminActivityLogs from '../_components/AdminActivityLogs';
// import SystemPerformance from '../_components/SystemPerformance';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [movies, genres, actors, users] = await Promise.all([
        axiosClient.get('/movies').then(res => res.data).catch(() => []),
        axiosClient.get('/genres').then(res => res.data).catch(() => []),
        axiosClient.get('/actors').then(res => res.data).catch(() => []),
        axiosClient.get('/users').then(res => res.data).catch(() => [])
      ]);

      return {
        moviesCount: movies?.totalElements || 0,
        genresCount: genres?.length || 0,
        actorsCount: actors?.length || 0,
        usersCount: users?.length || 0,
      };
    }
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'performance'>('overview');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-zinc-400">Tổng quan về hệ thống NovaFlix</p>
        </div>

        {/* TABS SWITCHER */}
        <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-white/5 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'overview'
              ? 'bg-red-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white'
              }`}
          >
            Tổng quan
          </button>
          {/* <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'logs'
                ? 'bg-red-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Nhật ký hệ thống
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'performance'
                ? 'bg-red-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Hiệu năng & Tài nguyên
          </button> */}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Movies Stat */}
            <div className="relative overflow-hidden bg-[#111114] border border-white/10 rounded-2xl p-6 group transition-all hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10">
              <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                <Film size={64} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-red-400 mb-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Film size={20} />
                  </div>
                  <h3 className="font-semibold text-sm">Tổng số phim</h3>
                </div>
                <p className="text-4xl font-black text-white">
                  {isLoading ? <span className="animate-pulse">--</span> : stats?.moviesCount}
                </p>
              </div>
            </div>

            {/* Genres Stat */}
            <div className="relative overflow-hidden bg-[#111114] border border-white/10 rounded-2xl p-6 group transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                <Layers size={64} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-blue-400 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Layers size={20} />
                  </div>
                  <h3 className="font-semibold text-sm">Tổng thể loại</h3>
                </div>
                <p className="text-4xl font-black text-white">
                  {isLoading ? <span className="animate-pulse">--</span> : stats?.genresCount}
                </p>
              </div>
            </div>

            {/* Actors Stat */}
            <div className="relative overflow-hidden bg-[#111114] border border-white/10 rounded-2xl p-6 group transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10">
              <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                <Clapperboard size={64} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-green-400 mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Clapperboard size={20} />
                  </div>
                  <h3 className="font-semibold text-sm">Tổng diễn viên</h3>
                </div>
                <p className="text-4xl font-black text-white">
                  {isLoading ? <span className="animate-pulse">--</span> : stats?.actorsCount}
                </p>
              </div>
            </div>

            {/* Users Stat */}
            <div className="relative overflow-hidden bg-[#111114] border border-white/10 rounded-2xl p-6 group transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                <Users size={64} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-purple-400 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Users size={20} />
                  </div>
                  <h3 className="font-semibold text-sm">Người dùng</h3>
                </div>
                <p className="text-4xl font-black text-white">
                  {isLoading ? <span className="animate-pulse">--</span> : stats?.usersCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#111114] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-zinc-400 min-h-[300px]">
              <Activity size={48} className="text-zinc-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Hệ thống đang hoạt động ổn định</h3>
              <p className="max-w-md">Chào mừng bạn đến với trang quản trị NovaFlix. Dữ liệu trên Dashboard được cập nhật trực tiếp từ hệ thống.</p>
            </div>
            <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-white mb-6">Thao tác nhanh</h3>
                <div className="space-y-3">
                  <Link href="/admin/movies" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Quản lý phim</span>
                    <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </Link>
                  <Link href="/admin/actors" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Quản lý diễn viên</span>
                    <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </Link>
                  <Link href="/admin/genres" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Quản lý thể loại</span>
                    <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </Link>
                  <Link href="/admin/users" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Quản lý người dùng</span>
                    <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {activeTab === 'logs' && (
        <div className="animate-in fade-in duration-300">
          <AdminActivityLogs />
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="animate-in fade-in duration-300">
          <SystemPerformance />
        </div>
      )} */}
    </div>
  );
}
