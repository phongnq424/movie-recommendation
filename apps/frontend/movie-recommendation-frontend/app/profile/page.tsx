'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Save, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import axiosClient from '@/services/axios';
import { userService } from "@/services/user.service";

export default function ProfilePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ fullName: '', email: '', avatarUrl: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await userService.getCurrentUser();
                setFormData({
                    fullName: response.fullName || '',
                    email: response.email || '',
                    avatarUrl: response.avatarUrl || ''
                });
            } catch (err) {
                console.error('Tải thông tin thất bại', err);
                router.push('/auth/login');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        setError('');

        try {
            // Gửi cả fullName và avatarUrl lên API theo đúng cấu trúc UserUpdateRequest
            await axiosClient.put('/users/me/profile', {
                fullName: formData.fullName,
                avatarUrl: formData.avatarUrl
            });

            setMessage('Cập nhật hồ sơ thành công!');

            const userInfoStr = localStorage.getItem('user_info');
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                userInfo.fullName = formData.fullName;
                userInfo.avatarUrl = formData.avatarUrl; // Cập nhật avatar vào localStorage nếu cần
                localStorage.setItem('user_info', JSON.stringify(userInfo));
                window.dispatchEvent(new Event('auth-change'));
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#08080a] text-white">
                <SiteHeader />
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#08080a] text-white">
            <SiteHeader />
            <div className="mx-auto max-w-2xl px-5 pt-32 sm:px-8">
                <h1 className="mb-8 text-3xl font-black">Hồ sơ cá nhân</h1>

                {message && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-500/50 bg-green-500/10 px-4 py-3 text-green-400">
                        <CheckCircle2 size={20} />
                        <p className="text-sm">{message}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
                        <AlertCircle size={20} />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="rounded-[34px] border border-white/10 bg-[#111114]/80 p-8 shadow-2xl backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* Khu vực hiển thị Preview Avatar */}
                        <div className="flex flex-col items-center justify-center gap-4 border-b border-white/5 pb-6">
                            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/10 bg-white/5 shadow-inner">
                                {formData.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={formData.avatarUrl}
                                        alt="Avatar Preview"
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            // Fallback nếu link ảnh lỗi
                                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${formData.fullName || 'User'}`;
                                        }}
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-zinc-400">Ảnh đại diện của bạn</p>
                        </div>

                        {/* Input Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-300">Email (Không thể thay đổi)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500"><Mail size={18} /></div>
                                <input type="email" value={formData.email} disabled className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-zinc-500 outline-none" />
                            </div>
                        </div>

                        {/* Input Họ và tên */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-300">Họ và tên</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500"><User size={18} /></div>
                                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-red-600 focus:bg-white/10" required />
                            </div>
                        </div>

                        {/* Input Link đường dẫn Avatar */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-300">Đường dẫn ảnh đại diện (Avatar URL)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500"><ImageIcon size={18} /></div>
                                <input
                                    type="url"
                                    placeholder="https://example.com/avatar.png"
                                    value={formData.avatarUrl}
                                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-red-600 focus:bg-white/10"
                                />
                            </div>
                        </div>

                        {/* Button Submit */}
                        <button type="submit" disabled={isSaving} className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-950/40 transition hover:bg-red-700 disabled:opacity-50">
                            {isSaving ? (<><Loader2 size={18} className="animate-spin" />Đang lưu...</>) : (<><Save size={18} />Lưu thay đổi</>)}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}