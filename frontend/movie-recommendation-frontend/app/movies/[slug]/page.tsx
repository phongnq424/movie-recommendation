import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Film, Play, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MovieRating } from "@/components/MovieRating";
import { movieService } from "@/services/movie.service";

const fallbackBackdrop =
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop";

const fallbackPoster =
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700&auto=format&fit=crop";

export default async function MovieDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    let movie;
    try {
        movie = await movieService.getMovieDetailBySlug(slug);
    } catch {
        return notFound();
    }

    if (!movie) {
        return notFound();
    }

    const imageUrl = movie.backdropUrl || movie.posterUrl || fallbackBackdrop;
    const posterUrl = movie.posterUrl || movie.backdropUrl || fallbackPoster;

    return (
        <main className="min-h-screen bg-[#08080a] text-white selection:bg-red-500/30">
            <SiteHeader />

            {/* Hero Banner Section */}
            <section className="relative flex min-h-[90vh] items-end pb-20 pt-32">
                {/* Background Image & Overlays */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={imageUrl}
                        alt={movie.title ?? "Backdrop"}
                        fill
                        priority
                        className="object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#08080a_0%,rgba(8,8,10,0.94)_24%,rgba(8,8,10,0.54)_58%,rgba(8,8,10,0.88)_100%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.24)_0%,rgba(8,8,10,0.36)_48%,#08080a_92%)]" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12">
                    <div className="flex flex-col gap-10 lg:flex-row lg:items-end">
                        {/* Desktop Poster */}
                        <div className="hidden shrink-0 lg:block">
                            <div className="relative h-[480px] w-[320px] overflow-hidden rounded-[24px] border border-white/10 shadow-2xl shadow-black/60">
                                <Image
                                    src={posterUrl}
                                    alt={movie.title ?? "Poster"}
                                    fill
                                    priority
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Movie Info */}
                        <div className="flex-1 lg:pb-6">
                            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                {movie.title}
                            </h1>

                            {movie.originalTitle && (
                                <p className="mt-3 text-xl font-medium text-zinc-400">
                                    {movie.originalTitle}
                                </p>
                            )}

                            {/* Badges */}
                            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold">
                                <div className="flex items-center gap-1.5 rounded-md bg-yellow-500 px-2 py-1 text-black">
                                    <Star size={16} fill="currentColor" />
                                    <span>{(movie.averageRating ?? 0).toFixed(1)} ({movie.ratingCount ?? 0} đánh giá)</span>
                                </div>

                                {movie.releaseYear && (
                                    <div className="flex items-center gap-1.5 text-zinc-300">
                                        <Calendar size={16} />
                                        <span>{movie.releaseYear}</span>
                                    </div>
                                )}

                                {movie.durationMinutes && (
                                    <div className="flex items-center gap-1.5 text-zinc-300">
                                        <Clock size={16} />
                                        <span>{movie.durationMinutes} phút</span>
                                    </div>
                                )}

                                {movie.quality && (
                                    <div className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-zinc-200 backdrop-blur-sm">
                                        {movie.quality}
                                    </div>
                                )}

                                {movie.ageRating && (
                                    <div className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-zinc-200 backdrop-blur-sm">
                                        {movie.ageRating}
                                    </div>
                                )}
                            </div>

                            {/* Genres */}
                            <div className="mt-6 flex flex-wrap gap-2">
                                {movie.genres?.map((genre) => (
                                    <Link
                                        key={genre.genrePublicId}
                                        href={`/genres/${genre.genreSlug}`}
                                        className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium transition hover:bg-white/20 hover:text-white"
                                    >
                                        {genre.genreName}
                                    </Link>
                                ))}
                            </div>

                            {/* Description */}
                            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
                                {movie.description || "Chưa có mô tả cho phim này."}
                            </p>

                            {/* Actions */}
                            <div className="mt-10 flex flex-wrap items-center gap-4">
                                <Link
                                    href={`/movies/${movie.slug}/watch`}
                                    className="group flex items-center gap-3 rounded-2xl bg-[#c91d1d] px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-950/40 transition hover:bg-[#e02727] active:scale-95"
                                >
                                    <Play size={24} fill="currentColor" />
                                    Xem phim
                                </Link>
                                {movie.trailerUrl && (
                                    <a
                                        href={movie.trailerUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                                    >
                                        Trailer
                                    </a>
                                )}
                            </div>

                            {/* Rating Component */}
                            {movie.publicId && <MovieRating moviePublicId={movie.publicId} />}
                        </div>
                    </div>
                </div>
            </section>

            {/* Cast Section */}
            {movie.actors && movie.actors.length > 0 && (
                <section className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 lg:px-12">
                    <h2 className="mb-8 text-2xl font-bold">Diễn viên chính</h2>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {movie.actors.map((actor) => (
                            <Link
                                href={`/movies?actor=${actor.actorPublicId}`}
                                key={actor.actorPublicId}
                                className="group flex flex-col items-center text-center"
                            >
                                <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border border-white/10 bg-zinc-800 transition-all duration-300 group-hover:border-white/30 group-hover:shadow-lg group-hover:shadow-white/10">
                                    {actor.actorAvatarUrl ? (
                                        <Image
                                            src={actor.actorAvatarUrl}
                                            alt={actor.actorFullName ?? "Actor"}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                            <Film size={32} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-sm font-semibold text-white transition group-hover:text-red-400">
                                    {actor.actorFullName}
                                </h3>
                                {actor.characterName && (
                                    <p className="mt-1 text-xs text-zinc-400">
                                        {actor.characterName}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
