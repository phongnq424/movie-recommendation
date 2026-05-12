import Image from "next/image";
import Link from "next/link";
import { CirclePlay, Star } from "lucide-react";
import type { Movie } from "@/types/movie";

const fallbackPoster =
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700&auto=format&fit=crop";

export function MovieCard({ movie }: { movie: Movie }) {
    const posterSrc = movie.posterUrl || movie.backdropUrl || fallbackPoster;

    return (
        <Link
            href={`/movies/${movie.slug}`}
            className="
                group relative z-0 block overflow-hidden rounded-[20px]
                border border-white/5 bg-[#111114]
                shadow-lg shadow-black/40
                transition-all duration-300 ease-out
                hover:z-20 hover:-translate-y-2 hover:border-white/20
                hover:shadow-2xl hover:shadow-red-500/15
            "
        >
            {/* Khung chứa ảnh */}
            <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                    src={posterSrc}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/20 to-transparent transition-colors duration-300 group-hover:bg-black/40" />

                {/* Badges */}
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-yellow-500 px-2 py-1 text-[11px] font-black tracking-wide text-black shadow-sm">
                    <Star size={10} fill="currentColor" />
                    <span>{(movie.averageRating ?? 0).toFixed(1)} ({movie.ratingCount ?? 0})</span>
                </div>

                {movie.quality && (
                    <div className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        {movie.quality}
                    </div>
                )}

                {/* Nút Play */}
                <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 scale-75 place-items-center rounded-full bg-red-600 text-white opacity-0 shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                    <CirclePlay size={28} fill="currentColor" className="ml-1" />
                </div>
            </div>

            {/* Nội dung Text */}
            <div className="p-4 pt-3">
                <h3 className="line-clamp-1 text-[15px] font-bold tracking-wide text-white transition-colors duration-300 group-hover:text-red-400">
                    {movie.title}
                </h3>

                <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-500">
                    {movie.originalTitle || movie.title}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                    <span className="rounded-sm bg-white/10 px-1.5 py-0.5">
                        {movie.releaseYear ?? "N/A"}
                    </span>
                    <span>{movie.viewCount?.toLocaleString() ?? 0} lượt xem</span>
                </div>
            </div>
        </Link>
    );
}