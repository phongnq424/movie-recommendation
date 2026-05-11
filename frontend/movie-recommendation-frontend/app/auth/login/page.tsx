'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { LoginRequest } from '@/types/auth';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<LoginRequest>({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!formData.email || !formData.password) {
                setError('Vui lòng nhập email và mật khẩu');
                setIsLoading(false);
                return;
            }

            const payload = await authService.login(formData);

            // Lưu token và thông tin người dùng
            localStorage.setItem('access_token', payload.accessToken);
            localStorage.setItem('refresh_token', payload.refreshToken);
            localStorage.setItem('user_info', JSON.stringify({
                userPublicId: payload.userPublicId,
                fullName: payload.fullName,
                role: payload.role,
            }));
            window.dispatchEvent(new Event('auth-change')); // Phát event báo Navbar cập nhật

            // Redirect to home
            router.push('/');
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message ||
                err?.message ||
                'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080a] text-white p-5">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,28,28,0.15),transparent_40rem)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.1)_0%,#08080a_100%)]" />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md rounded-[34px] border border-white/10 bg-[#111114]/80 p-8 sm:p-10 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/15 px-4 py-2 text-sm font-semibold text-red-100">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        NovaFlix
                    </div>
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                        Chào mừng trở lại
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Đăng nhập để tiếp tục thưởng thức các bộ phim đỉnh cao
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3">
                        <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="text-sm font-semibold text-zinc-300"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-[#c91d1d] focus:bg-white/10 disabled:opacity-50"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="text-sm font-semibold text-zinc-300"
                            >
                                Mật khẩu
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-xs font-medium text-zinc-400 transition hover:text-white"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                                <Lock size={18} />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-[#c91d1d] focus:bg-white/10 disabled:opacity-50"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c91d1d] px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-950/40 transition hover:bg-[#e02727] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang đăng nhập...
                            </>
                        ) : (
                            <>
                                Đăng nhập
                                <ArrowRight
                                    size={18}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-zinc-400">
                    Chưa có tài khoản?{" "}
                    <Link
                        href="/auth/register"
                        className="font-bold text-white transition hover:text-[#c91d1d]"
                    >
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </main>
    );
}