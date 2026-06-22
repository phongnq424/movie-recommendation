export const dynamic = "force-dynamic";
export const revalidate = 0;

import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { actorService } from "@/services/actor.service";
import { Actor } from "@/types/actor";

export default async function ActorsPage() {
    let actors: Actor[] = [];

    try {
        actors = await actorService.getAllActiveActors();
    } catch (error) {
        console.error("Lỗi khi tải danh sách diễn viên:", error);
        actors = [];
    }

    return (
        <main className="min-h-screen bg-[#08080a] text-white pt-24 pb-14 px-5 sm:px-8 lg:px-12">
            <SiteHeader />
            <div className="mx-auto max-w-[1460px]">
                <div className="mb-12">
                    <h1 className="text-3xl font-black md:text-4xl">
                        Tất cả diễn viên
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Khám phá danh sách các diễn viên trong hệ thống NovaFlix. Nhấn vào một diễn viên để xem các phim họ đã tham gia.
                    </p>
                </div>

                {actors.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
                        Chưa có diễn viên nào để hiển thị.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                        {actors.map((actor) => (
                            <Link
                                key={actor.publicId}
                                href={`/movies?actor=${actor.publicId}`}
                                className="group flex flex-col items-center text-center"
                            >
                                <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border border-white/10 bg-zinc-800 transition-all duration-300 group-hover:border-white/30 group-hover:shadow-lg group-hover:shadow-white/10">
                                    {actor.avatarUrl ? (
                                        <Image
                                            src={actor.avatarUrl}
                                            alt={actor.fullName}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                            <User size={40} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-sm font-bold text-white transition group-hover:text-red-500 line-clamp-1">
                                    {actor.fullName}
                                </h3>
                                {actor.nationality && (
                                    <p className="mt-1 text-xs text-zinc-400">
                                        {actor.nationality}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}