'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // Thêm usePathname
import {
    Bell,
    ChevronDown,
    Clapperboard,
    LogIn,
    Menu,
    Search,
    Settings,
    User,
} from "lucide-react";
import { authService } from "@/services/auth.service";

const navItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Phim", href: "/movies" },
    { label: "Thể loại", href: "#", hasDropdown: true },
    { label: "Diễn viên", href: "/actors" },
];

export function SiteHeader() {
    const [user, setUser] = useState<{ fullName: string; role: string; userPublicId: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [genres, setGenres] = useState<{ publicId: string; name: string; slug: string }[]>([]);

    const router = useRouter();
    const pathname = usePathname(); // Lấy đường dẫn hiện tại

    useEffect(() => {
        const checkAuth = () => {
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                setUser(JSON.parse(userInfo));
            } else {
                setUser(null);
            }
        };
        checkAuth();
        window.addEventListener('auth-change', checkAuth);
        return () => window.removeEventListener('auth-change', checkAuth);
    }, []);

    useEffect(() => {
        import("@/services/genre.service").then(({ genreService }) => {
            genreService.getActiveGenres().then((data) => {
                setGenres(data);
            }).catch(console.error);
        });
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        } finally {
            setUser(null);
            window.dispatchEvent(new Event('auth-change'));
            router.push('/');
        }
    };

    return (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md transition-all">
            <div className="mx-auto flex h-20 max-w-[1460px] items-center justify-between px-5 sm:px-8 lg:px-12">

                {/* Logo & Navigation */}
                <div className="flex items-center gap-10">
                    <Link href="/" className="group flex shrink-0 items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white transition-transform group-hover:scale-105">
                            <Clapperboard size={22} strokeWidth={2} />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-white">
                            NOVA<span className="text-red-600">FLIX</span>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-6 lg:flex">
                        {navItems.map((item) => {
                            // Kiểm tra xem item có đang active hay không
                            const isActive = pathname === item.href || (item.label === "Thể loại" && pathname.startsWith('/movies?genre='));

                            if (item.label === "Thể loại") {
                                return (
                                    <div key={item.label} className="group relative flex items-center py-2 cursor-pointer">
                                        <div className={`flex items-center gap-1 text-sm font-medium transition-colors ${isActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                                            {item.label}
                                            <ChevronDown size={14} strokeWidth={2} className="transition-transform duration-200 group-hover:rotate-180 text-zinc-500 group-hover:text-zinc-300" />
                                        </div>

                                        <div className="absolute left-0 top-full hidden pt-2 group-hover:block z-50">
                                            <div className="grid w-[400px] grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#111114] p-4 shadow-xl shadow-black/50">
                                                {genres.map(genre => (
                                                    <Link
                                                        key={genre.publicId}
                                                        href={`/movies?genre=${genre.publicId}`}
                                                        className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                                                    >
                                                        {genre.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="group relative flex items-center gap-1 py-2 text-sm font-medium transition-colors"
                                >
                                    <span className={isActive ? "text-white" : "text-zinc-400 group-hover:text-white"}>
                                        {item.label}
                                    </span>

                                    {item.hasDropdown && (
                                        <ChevronDown
                                            size={14}
                                            strokeWidth={2}
                                            className={`transition-transform duration-200 group-hover:rotate-180 ${isActive
                                                ? "text-white"
                                                : "text-zinc-500 group-hover:text-zinc-300"
                                                }`}
                                        />
                                    )}

                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <form action="/search" className="group relative hidden md:block">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search size={16} className="text-zinc-400 group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            name="q"
                            placeholder="Tìm kiếm phim..."
                            className="h-10 w-[240px] rounded-full bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-zinc-400 outline-none transition-all focus:w-[280px] focus:bg-white/15 focus:ring-1 focus:ring-white/20 xl:w-[260px] xl:focus:w-[300px]"
                        />
                    </form>

                    <div className="hidden items-center gap-2 md:flex">
                        <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                            <Bell size={20} strokeWidth={2} />
                            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-black bg-red-600" />
                        </button>
                    </div>

                    {user ? (
                        <div className="relative hidden md:block">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                            >
                                <User size={18} strokeWidth={2} />
                                <span>{user.fullName}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#111114] shadow-xl shadow-black/50">
                                    <Link href="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
                                        <Settings size={16} /> Hồ sơ cá nhân
                                    </Link>
                                    <button
                                        onClick={() => { setShowDropdown(false); handleLogout(); }}
                                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-400 transition-colors hover:bg-white/10 hover:text-red-300"
                                    >
                                        <LogIn size={16} className="rotate-180" /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/auth/login" className="hidden md:flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:scale-105 active:scale-95">
                            <LogIn size={18} strokeWidth={2} /> <span>Đăng nhập</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}