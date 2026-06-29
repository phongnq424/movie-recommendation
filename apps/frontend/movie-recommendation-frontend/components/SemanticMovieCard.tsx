import Image from "next/image";
import Link from "next/link";
import { Sparkles, Star } from "lucide-react";
import type { MovieVectorSearchResponse } from "@/types/movie";

const fallbackPoster =
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700&auto=format&fit=crop";

function formatSimilarity(value: number | undefined) {
    if (value == null || Number.isNaN(value)) {
        return "N/A";
    }

    const percentage = value > 1 ? value : value * 100;
    return `${Math.round(Math.max(0, Math.min(100, percentage)))}%`;
}

export function SemanticMovieCard({
    movie,
}: {
    movie: MovieVectorSearchResponse;
}) {
    const posterSrc = movie.posterUrl || movie.backdropUrl || fallbackPoster;

    return (
        <Link
            href={`/movies/${movie.slug}`}
            className="group block overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-red-500/50 hover:bg-zinc-900"
        >
            <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <Image
                    src={posterSrc}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 220px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    <Sparkles className="h-3.5 w-3.5" />
                    {formatSimilarity(movie.similarity)}
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                    <div className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur">
                        <Star className="h-3.5 w-3.5 fill-amber-300" />
                        {(movie.averageRating ?? 0).toFixed(1)} ({movie.ratingCount ?? 0})
                    </div>
                </div>
            </div>

            <div className="space-y-1 p-4">
                <h3 className="line-clamp-1 text-sm font-bold text-white transition group-hover:text-red-400">
                    {movie.title}
                </h3>

                {movie.originalTitle && (
                    <p className="line-clamp-1 text-xs text-zinc-500">
                        {movie.originalTitle}
                    </p>
                )}

                <p className="text-xs text-zinc-400">
                    {movie.releaseYear ?? "N/A"} ·{" "}
                    {(movie.viewCount ?? 0).toLocaleString()} lượt xem
                </p>
            </div>
        </Link>
    );
}