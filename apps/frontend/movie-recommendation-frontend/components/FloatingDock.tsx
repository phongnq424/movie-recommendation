import { Film, Flame, Heart, Home, Tv } from "lucide-react";

const items = [
    { label: "Trang chủ", icon: Home, active: true },
    { label: "Phim bộ", icon: Tv },
    { label: "Phim lẻ", icon: Film },
    { label: "Hot", icon: Flame },
    { label: "Yêu thích", icon: Heart },
];

export function FloatingDock() {
    return (
        <aside className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 gap-3 rounded-[28px] border border-white/10 bg-[#111114]/75 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:left-8 lg:top-1/2 lg:bottom-auto lg:translate-x-0 lg:-translate-y-1/2 lg:flex-col">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <button
                        key={item.label}
                        title={item.label}
                        className={[
                            "group grid h-12 w-12 place-items-center rounded-2xl transition",
                            item.active
                                ? "bg-[#c91d1d] text-white shadow-lg shadow-red-950/50"
                                : "text-zinc-500 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                    >
                        <Icon size={22} />
                    </button>
                );
            })}
        </aside>
    );
}