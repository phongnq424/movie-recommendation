import Link from "next/link";
import {
    Bell,
    ChevronDown,
    Clapperboard,
    LogIn,
    Menu,
    Search,
    User,
} from "lucide-react";

const navItems = [
    { label: "Trang chủ", href: "/", active: true },
    { label: "Phim", href: "/movies" },
    { label: "Thể loại", href: "/genres", hasDropdown: true },
    { label: "Quốc gia", href: "/countries", hasDropdown: true },
    { label: "Diễn viên", href: "/actors" },
    { label: "Bảng giá", href: "/pricing" },
];

export function SiteHeader() {
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
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="group relative flex items-center gap-1 py-2 text-sm font-medium transition-colors"
                            >
                                <span className={item.active ? "text-white" : "text-zinc-400 group-hover:text-white"}>
                                    {item.label}
                                </span>

                                {item.hasDropdown && (
                                    <ChevronDown
                                        size={14}
                                        strokeWidth={2}
                                        className={`transition-transform duration-200 group-hover:rotate-180 ${item.active
                                                ? "text-white"
                                                : "text-zinc-500 group-hover:text-zinc-300"
                                            }`}
                                    />
                                )}

                                {/* Indicator cho active item */}
                                {item.active && (
                                    <span className="absolute -bottom-1.5 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-red-600" />
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <form
                        action="/search"
                        className="group relative hidden md:block"
                    >
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search size={16} className="text-zinc-400 group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            name="q"
                            placeholder="Tìm kiếm phim..."
                            className="h-10 w-[240px] rounded-full bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-zinc-400 outline-none transition-all focus:w-[280px] focus:bg-white/15 focus:ring-1 focus:ring-white/20 xl:w-[260px] xl:focus:w-[300px]"
                        />
                    </form>

                    {/* Action Icons */}
                    <div className="hidden items-center gap-2 md:flex">
                        <button
                            type="button"
                            className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label="Thông báo"
                        >
                            <Bell size={20} strokeWidth={2} />
                            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-black bg-red-600" />
                        </button>

                        <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label="Tài khoản"
                        >
                            <User size={20} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Login Button */}
                    <Link
                        href="/login"
                        className="hidden md:flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:scale-105 active:scale-95"
                    >
                        <LogIn size={18} strokeWidth={2} />
                        <span>Đăng nhập</span>
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 lg:hidden"
                        aria-label="Mở menu"
                    >
                        <Menu size={20} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </header>
    );
}